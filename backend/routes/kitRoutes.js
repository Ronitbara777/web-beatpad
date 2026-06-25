const express=require('express')
const router=express.Router();
const multer=require("multer");
const SoundKit= require('../models/SoundKit');

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'beatpad_sounds',
    resource_type: 'video' // Cloudinary uses 'video' for audio files
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/ogg') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only WAV, MP3 and OGG are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit
  },
  fileFilter: fileFilter
});

router.post('/create',
  upload.array('sounds',16),async (req, res)=>{
    try{
      const parsePads=JSON.parse(req.body.pads);
      let fileIndex = 0;
      const padsWithUrls = parsePads.map((pad) => {
        let finalUrl = pad.soundUrl;
        
        // If this pad had a new file uploaded, grab it from req.files
        if (pad.hasNewFile && req.files[fileIndex]) {
          finalUrl = req.files[fileIndex].path;
          fileIndex++;
        }
        
        // Clean up the temporary flag
        const { hasNewFile, ...padData } = pad;
        
        return {
          ...padData,
          soundUrl: finalUrl
        }
      });
      const uniqueId=Math.random().toString(36).substring(2,8);
      const newKit=new SoundKit({
        id:uniqueId,
        pads:padsWithUrls
      });
      await newKit.save();
      res.status(201).json({msg:"kit saved succesfully",kit:newKit});
    }catch(error){
      console.error(error);
      res.status(500).json({msg:"Server error while saving the kit."});
    }
  }
);

router.get("/:id",async (req,res)=>{
  try{
    const id=req.params.id
    kit=await SoundKit.findOne({id:id});
    if(kit){
      res.status(200).json(kit)
    }else{
      res.status(404).json({msg:"Kit not found"})
    }
  }catch(error){
    res.status(500).json({msg:"Server error"});
  }
})


module.exports = router;