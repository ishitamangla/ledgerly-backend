const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require('../services/email.service')
const tokenBlackListModel = require("../models/blacklist.model")
/**
 * - user register contoller
 * - POST /api/auth/register
 */
async function userRegisterController(req,res){
    const {email,password,name} = req.body
    const isExists = await userModel.findOne({
        email
    })
    //user already exist
    if(isExists){
        return res.status(422).json({
            message:"user already exists with this email",
            status:"failed"
        })
    }
    //user do not exist
    //creating a newaccount
    const user = await userModel.create({
        email,password,name
    })
    //after login to identify user we use jwt 
    const payload = {
        userId:user._id
    }
    const token = jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"3d"})

    res.cookie("token",token)
    //201 when new data is created
    res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    })
        
    //sending mail
    try{
        await emailService.sendRegistrationEmail(email,name)
    }catch(err){
        return res.status(400).json({
            message: "email not sent"
        })
    }
}


/**
 * - user login controller
 *  - POST  /api/aauth/login
 */
async function userLoginController(req,res){
    const {email,password} = req.body

    const user = await userModel.findOne({email}).select("+password")

    if(!user){
        return res.status(401).json({
            message : "Email not found",
            status:"failed"
        })
    }
    const isValidPassword = await user.comparePassword(password)

    if(!isValidPassword){
        return res.status(401).json({
            message : "invalid password",
            status:"failed"
        })
    }

    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:"3d"})

    res.cookie("token",token)

    res.status(200).json({
        user:{
            message:"user login successfully",
            email : user.email,
            userId: user._id,
            name: user.name
        },
        token})
}

async function userLogoutController(req,res){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(200).json({
            message:"user logout successfully"
        })
    }
    await tokenBlackListModel.create({
        token:token
    })

    res.clearCookie("token")

    res.status(200).json({
        message:"user logged out successfully"
    })
}


module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
}