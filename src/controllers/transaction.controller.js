const transactionModel = require('../models/transaction.model')
const ledgerModel = require('../models/ledger.model')
const emailServices = require('../services/email.service')
const accountModel = require('../models/account.model')
const mongoose = require('mongoose')
/**
 * - create a new transaction
 * - the 10 step trnsafer flow
       * 1. validate request
       * 2. valid idempotencykey
       * 3. check account status
       * 4. derive sender balance from ledger 
       * 5. create transaction(pending)
       * 6. create debit ledger entry
       * 7. create credit ledger entry
       * 8. mark transaction completed
       * 9. commit mongodb session
       * 10.send email notification
 */
    //if transaction Failed frontend provide new idempotencyKey


async function createTransaction(req,res){

    /**
     * 1. valid request
     */
    const {fromAccount,toAccount,amount,idempotencyKey} = req.body
    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"fromAccount,toAccount,amount and idempotencyKey are required"
        })
    }
    if(amount <= 0){
        return res.status(400).json({
            message:"negative transafer is not possible"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id:fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id:toAccount
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message:"invalid fromAccount or toAccount"
        })
    }

    if(toUserAccount._id.toString() === fromUserAccount._id.toString()){
        return res.status(400).json({
            message:"transaction not possible with in a account"
        })
    }

    /**
     * 2.validate idempotencyKey
     *  frontend work 
     *      *if same attempt(mutiple clicks) - > same idempotencykey
     *      *if retry after failure -> new idempotencyKey , new request
     */
    /**
     * what happen in frontend
     * CLICK →
        generate key →
        disable button →
        send request →
                SUCCESS → done → next click = new key(again wants to send)
                FAILED → show retry → retry = new key
                PENDING → wait / poll → same key
            after reply from backend then only enable button back
     */
    
    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey:idempotencyKey
    })

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "COMPLETED"){
            return res.status(200).json({
                message:"transaction already processed",
                transaction:isTransactionAlreadyExists
            })
        }

        //when simultanesouly send not commited in db that's why handled in try block again of 11000

        if(isTransactionAlreadyExists.status === "PENDING"){
            return res.status(200).json({
                message:"transaction is still processing"
            })
        }
        if(isTransactionAlreadyExists.status === "FAILED"){
            return res.status(500).json({
                message:"transaction failed ,create a new request using a new idempotencykey"
            })
        }
    }

    /**
     * 3.check account status
     */
    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({
            message:"fromAccount and toAccount both accounts must be active"
        })
    }

   let transaction;
    const session = await mongoose.startSession()
    try{
        session.startTransaction();

        /**
         * 4.derive sender balance form ledger
         */
        // inside session to prevent race condition
        const balance = await fromUserAccount.getBalance({session})
        if(balance < amount){
            throw new Error("insufficient_ balance")
        }

        /**
         *  5. create transaction(pending)
        */ 
       //in case of duplicacy of idempotency ey transaction not made go to catch
        transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            status:"PENDING",
            amount,
            idempotencyKey //although if previous transaction is not commited , but a lock on this idempotency key is made so if new request come it will go in error 11000
        }],{session}))[0]
        
        
        /**
         *  6. create debit ledger entry
         */

        //debit - taking money from this account
        const debitLedgerEntry = (await ledgerModel.create([{
            type:"DEBIT",
            account:fromAccount,
            amount,
            transaction:transaction._id
        }],{session}))[0]

        /**
         *  7. create credit ledger entry
          */
        //credit - miney given to this account
        const creditLedgerEntry = (await ledgerModel.create([{
            type:"CREDIT",
            account:toAccount,
            amount,
            transaction:transaction._id
        }],{session}))[0]

        //for testing what happens in multiple transaction at same time one get completed other show failed as one is already in pendiong state

         await (() => {
            return new Promise((resolve) => setTimeout(resolve, 25 * 1000));
        })()


        /** 
         * 8. mark transaction completed
        */

        transaction.status = "COMPLETED";
        await transaction.save({session})
    
        /**
         * 9. commit mongodb session
         */   
        await session.commitTransaction()
    }
    catch(error){

        await session.abortTransaction(); //rollback
         
        //as previous transaction is still processing and not committed to db so we cacnnot access its data right now but a error 11000 will be given
        if(error?.code === 112){
            return res.status(200).json({
                message: "transaction is still processing"
            })
        }
        //update transaction status as failed 
        if(transaction?._id){
            await transactionModel.findByIdAndUpdate(
                transaction._id,
                {status:"FAILED"}
            )
        }
        if(error.message === "insufficient_ balance"){
            return res.status(400).json({
                message:"insufficient balance"
            })
        }

        return res.status(500).json({
            message:"transaction failed"
        })
    }
    finally{
        session.endSession();
    }
    

    /**
     *  * 10.send email notification
     */
    try{
        await emailServices.sendTransactionEmail(
            req.user.email,
            req.user.name,
            amount,
            toAccount)
    }
    catch(err){
        console.log("email failed but transaction successfully occured",err.message)
    }

    return res.status(201).json({
        message:"Transaction completed successfully",
        transaction:transaction
    })

}
/**
 * used to provide funds by system user like bank itself
 * cashback,interest,initialAmount
 * idempotencykey here is initial + _id given by backend
 * incase of failed transaction backend retry with same idempotencyKey
 */ 

async function createSystemTransaction(req,res){
    const {amount,toAccount,idempotencyKey} = req.body;

    if(!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:" toAccount,amount and idempotencyKey all are required"
        })
    }
    const toUserAccount = await accountModel.findOne({
        _id:toAccount
    })
    if(!toUserAccount){
        return res.status(400).json({
            message:"invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user:req.user._id
    });

    if(!fromUserAccount){
        return res.status(400).json({
            message:"system user not found"
        })
    }
    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({
            message:"both fromAccount and toAccount should be active"
        })
    }

    if(amount <= 0){
        return res.status(400).json({
            message:"negative transfer is not possible"
        })
    }

    const isTransactionAlreadyExists = await transactionModel.findOne({idempotencyKey});

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "COMPLETED"){
            return res.status(200).json({
                message:"transaction already completed"
            })
        }
        if(isTransactionAlreadyExists.status === "PENDING"){
            return res.status(200).json({
                message:"transaction is still processing"
            })
        }
    }
    //internally managing the idempotemcykey here instead of asking for a new one form frontend
    
    const session = await mongoose.startSession()

    let transaction;
    try{
        session.startTransaction();

        if(isTransactionAlreadyExists && isTransactionAlreadyExists.status === "FAILED"){
            await transactionModel.findByIdAndUpdate(isTransactionAlreadyExists._id,
                {status : "PENDING"},
                {session}
            )
            transaction = await transactionModel.findById(isTransactionAlreadyExists._id).session(session);
        }
        else{
            transaction = (await transactionModel.create([{
            fromAccount : fromUserAccount._id,
            toAccount,
            status:"PENDING",
            idempotencyKey,
            amount
        }],{session}))[0]
        }
        
    
        //create debitentry
        const debitLedgerEntry = (await ledgerModel.create([{
            type:"DEBIT",
            account:fromUserAccount._id,
            amount,
            transaction:transaction._id
        }],{session}))[0]

        //create credit ledger entry
        const creditLedgerEntry = (await ledgerModel.create([{
            type:"CREDIT",
            account:toAccount,
            amount,
            transaction:transaction._id
        }],{session}))[0]

        //for testing if more than 1 transaction send simultaneosly
        // await (() => {
        //     return new Promise((resolve) => setTimeout(resolve, 25 * 1000));
        // })()


        transaction.status = "COMPLETED"
        await transaction.save({session})

        await session.commitTransaction()
    }
    catch(e){
        await session.abortTransaction()
        if(e?.code === 112){
            return res.status(200).json({
                message:"system transaction is still processing"
            })
        }
        if(transaction?._id){
            await transactionModel.findByIdAndUpdate(
                transaction._id,
                {status:"FAILED"}
            )
        }
        return res.status(500).json({
            message:"system transaction failed"
        })
    }
    finally{
        session.endSession()
    }

    //email sending
    try{
        await emailServices.sendTransactionEmail(req.user.email,req.user.name,amount,toAccount);
        console.log("transaction completed and email send successfully")
    }
    catch(e){
        console.log("transaction of system funds is completed successfully but email not sent",e.message)
    }

    res.status(201).json({
        message:"system transaction completed successfully",
        transaction : transaction
    })
}

module.exports = {
    createTransaction,
    createSystemTransaction
}