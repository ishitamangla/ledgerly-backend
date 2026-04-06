const mongoose = require("mongoose")
const ledgerModel = require('./ledger.model')
const accountSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,"account must be associated with user"],
        index:true  //helps in very fast searching (B+tree)
    },
    status:{
        type:String,
        enum:{
            //fixed list of allowed values
            values:["ACTIVE","FROZEN","CLOSED"],
            //if not from values then error message
            message:"Status can be either ACTIVE,FROZEN or CLOSED"
        },
        default:"ACTIVE"
    },
    currency:{
        type:String,
        required:[true,"currency is required for creating account"],
        default:"INR"
    }
},{
    timestamps:true
})

//index (user+status)
accountSchema.index({user:1,status:1})

accountSchema.methods.getBalance  = async function(){
    //mongodb aggregation pipeline
    //aggregation pipeline takes a array as input
    const balanceData = await ledgerModel.aggregate([
        {$match :{account :this._id}},
        {
            $group:{
                // id is on what basis you want to group
                _id:null,
                totalDebit:{
                    $sum:{
                        // cond : [condition,true_value,false_value] and eq  is equal operator 
                        $cond:[
                            {$eq:["$type","DEBIT"]},
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit:{
                    $sum:{
                        $cond:[
                            {$eq:["$type","CREDIT"]},
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },{
            $project:{
                //do you want to show id in output or not
                _id:0,
                balance:{$subtract:["$totalCredit","$totalDebit"]}
            }
        }
    ])
    //if no entry in ledger
    if(balanceData.length === 0){
        return 0;
    }
    console.log(balanceData[0].balance)
    return balanceData[0].balance

}

const accountModel = mongoose.model("account",accountSchema)

module.exports = accountModel
