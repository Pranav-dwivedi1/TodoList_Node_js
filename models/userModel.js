const mongoose = require("mongoose");
//setting the rules for the data which we take from the sign up page
const plm = require("passport-local-mongoose")
const userModel = new mongoose.Schema({
    // username: String, //these are the details which we entered in the sign up page
    passwordResetToken:{
        type: Number,
        default: 0,
    },
    username:{
        type: String,
        trim: true,
        unique: true,
        required: [true,"Username field must not empty"],
        minlength: [4,"Usernme field must have 4 characters"]
    },
    // email: String,
    email:{
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: [true,"Email address is required"],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: String,
    
    avatar: {
        type: String,
        default: "default.jpg",
    },
    todos: [{ type: mongoose.Schema.Types.ObjectId, ref: "todo" }],
});
userModel.plugin(plm)
const user = mongoose.model("user", userModel); //user = collection, usermodel = collection me jo data aayega

module.exports = user;


//har collection ke liye new schema banega