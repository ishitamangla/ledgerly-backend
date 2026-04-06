//to check authorisation
//whether a user is login or not before creating a account for them

const jwt = require("jsonwebtoken")
const userModel = require('../models/user.model')
const tokenBlackListModel = require('../models/blacklist.model')

//while checking we are not passing the system user initially create a new function while mainting ledger system user tahts wahya new functino is needed
async function authMiddleware(req,res,next){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token){
        console.log("token is missing")
        return res.status(401).json({
            message:"unauthenticated access,token is missing"
        })
    }
    
    const isBlackListed = await tokenBlackListModel.findOne({token})

    if(isBlackListed){
        return res.status(401).json({
            message : "unauthorised access,tokn is invalid"
        })
    }

    try{
        //jwt verify returns the payload i.e id here
        const payload = jwt.verify(token,process.env.JWT_SECRET)
        const user = await userModel.findById(payload.userId)
        if(!user){
            return res.status(401).json({
            message:"user not found"
        })
        }
        req.user = user
        return next()
    }
    catch(err){
        return res.status(401).json({
            message:"unauthorised access,token is invalid"
        })
    }
}

async function authSystemUserMiddleware(req,res,next){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
    if(!token){
        return res.status(401).json({
            message:"unauthorized access,token is missing"
        })
    }
    const isBlackListed = await tokenBlackListModel.findOne({token})

    if(isBlackListed){
        return res.status(401).json({
            message : "unauthorised access,tokn is invalid"
        })
    }
    try{
        const payload = jwt.verify(token,process.env.JWT_SECRET)
        const user = await userModel.findById(payload.userId).select("+systemUser")
        if(!user.systemUser){
            return res.status(403).json({
                message:"forbidden access,not a systemUser"
            })
        }
        req.user = user
        next()

    }catch(err){
        return res.status(401).json({
            message:"unauthorised access,token is invalid"
        })
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}