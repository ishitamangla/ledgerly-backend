const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const userSchema = new mongoose.Schema({
    email :{
        type:String,
        required:[true,"Email is required for creating user"],
        trim:true,
        lowercase:true,
        match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "invalid email address"
        ],
        unique:[true,"email already exists"]
    },
    name:{
        type:String,
        required:[true,"Name is required for creating a account"],
        trim:"true"
    },
    password:{
        type:String,
        required:[true,"Password is required for creating a account"],
        minlength:[6,"password should contain more than 6 character"],
        //for security enhancement we never allow password to go directly when we do findone 
        select:false
    },
    // system also treated as a user
    //used for giving signup bonus , cashback,interest so from whom account it  will be deducted -> system user account
    systemUser:{
        type:Boolean,
        default:false,
        immutable:true,
        select:false,
    }
},{
    //add createdAt and updatedAt in document
    timestamps:true
})

//run before document saved in db
//we use simpele function not arrow so that we can access this keyword
//mongoose middleware pre save hook , run when we save a user
userSchema.pre("save",async function(){
    //if not modified simply come out of this function
    if(!this.isModified("password")){
        //as function is async cannot use next()
        return 
    }
    const hash = await bcrypt.hash(this.password,10)
    this.password = hash
    return 
})

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password,this.password)
}
//one instance is user
//whole collection is userModel
const userModel = mongoose.model("user",userSchema)
module.exports = userModel