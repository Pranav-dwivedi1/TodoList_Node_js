const mongoose = require("mongoose"); 

mongoose
.connect("mongodb://127.0.0.1:27017/mern6") //mern6 database name
.then(()=>{
    console.log("db connected");
})
.catch((error)=>{
    console.log("error");
})
