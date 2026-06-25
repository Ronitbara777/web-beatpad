const { configDotenv } = require("dotenv");
const { json } = require("express");

const express=require("express");
const cors=require("cors");
const mongoose=require("mongoose")
require("dotenv").config()
const kitRoutes=require("./routes/kitRoutes");


const PORT=process.env.PORT

const app=express()

app.use(cors())
app.use(express.json());
app.use('/uploads',express.static('uploads'));
app.use('/api/kits',kitRoutes)

mongoose.connect(process.env.MONGODB_URI).then(()=>{console.log("Mongoose Connected succesfully.")}).catch(e=>console.log(e))


app.get('/',(req,res)=>{
  res.status(200).json({msg:"Server is working Ok"});
})

app.listen(PORT,()=>{
  console.log("Server has started.")
  console.log("Listening in the port:"+PORT)
})