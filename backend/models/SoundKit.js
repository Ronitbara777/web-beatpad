const mongoose=require("mongoose");

const soundKitSchema=new mongoose.Schema(
  {
    "id":String,
    "pads":[{
      "padIndex": Number,
      "keyBinding": String,
      "soundUrl": String,
      "config": {
        "cut": String,
        "trigger": String
      }
  }]} 
)

module.exports=mongoose.model("SoundKit",soundKitSchema);
