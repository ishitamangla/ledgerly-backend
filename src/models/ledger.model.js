const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
    type:{
        type:String,
        enum:{
            values:["CREDIT","DEBIT"],
            message:"values must be either CREDIT or DEBIT"
        },
        required:[true,"ledger type is required"],
        immutable:true
    },
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        index:true,
        required :[true,"account should be associated with a ledger"],
        immutable:true   //once created cannot be changed
    },
    amount:{
        type:Number,
        required:[true,"amount is required for creating a ledger entry"],
        immutable:true
    },
    transaction:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transaction",
        index:true,
        required:[true,"ledger must be associated witha transaction"],
        immutable:true
    },
})

function preventLedgerModification(){
    throw new Error("ledger entries cannot be modified or deleted")
}

ledgerSchema.pre('findOneAndUpdate',preventLedgerModification);
ledgerSchema.pre('findOneAndReplace',preventLedgerModification);
ledgerSchema.pre('findOneAndDelete',preventLedgerModification);
ledgerSchema.pre('deleteOne',preventLedgerModification);
ledgerSchema.pre('deleteMany',preventLedgerModification);
ledgerSchema.pre('updateOne',preventLedgerModification);
ledgerSchema.pre('updateMany',preventLedgerModification)
ledgerSchema.pre('remove',preventLedgerModification);
ledgerSchema.pre('replaceOne',preventLedgerModification);



const ledgerModel = mongoose.model("ledger",ledgerSchema)

module.exports = ledgerModel