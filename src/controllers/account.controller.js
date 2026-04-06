const accountModel = require('../models/account.model')

async function createAccountController(req,res){
    const user = req.user

    //if want 1 user 1 account in bank
    // const existingAccount = await accountModel.findOne({user : user._id});
    // if(existingAccount){
    //     return res.status(400).json({
    //         message:"account already exists"
    //     });
    // }

    const account = await accountModel.create({
        user:user._id
    })
    res.status(201).json({
        account
    })
}

async function getUserAccountsController(req,res){
    const accounts = await accountModel.find({user:req.user._id})

    res.status(200).json({
        accounts
    })

}

async function getAccountBalanceController(req,res){
    const {accountId} = req.params;
    const account = await  accountModel.findOne({
        _id:accountId,
        user:req.user._id
    })

    if(!account){
        return res.status(404).json({
            message:"account not found"
        })
    }
    const balance = await account.getBalance();
    res.status(200).json({
        message:`account : ${accountId} account balance is ${balance}`
    })
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
}