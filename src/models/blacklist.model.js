//to remove the token form cookies as well as when logout user blacklist no use 0f token furhtur for anything
const mongoose = require("mongoose");

const tokenBlackListSchema = new mongoose.Schema({
    token:{
        type:String,
        required : [true,"Token is required to blackList"],
        unique : [true,"token is already blacklisted"]
    }
},{
    timestamps : true
})

//ttl index
//ascending order of createdAt 

//if someone logout so we put its token in blacklist model for the time until the token get invalidate itself(here 3 days) so that if someone even copy that token they cannot use it after logout 

tokenBlackListSchema.index({createdAt : 1},{
    expireAfterSeconds : 60 * 60 * 24 * 3 // 3 days
})

const tokenBlackListModel = mongoose.model("tokenBlackList",tokenBlackListSchema);

module.exports = tokenBlackListModel;