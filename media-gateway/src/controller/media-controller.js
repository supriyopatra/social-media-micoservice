const Media = require("../models/Media");
const logger = require("../utils/logger");
const { v4: uuidv4 } = require('uuid');

const uploadMedia = async (req, res) => {
    logger.info("Starting media upload");
    try {
        
        if (!req.file) {
            logger.error("No file found. Please add a file and try again!");
            return res.status(400).json({
              success: false,
              message: "No file found. Please add a file and try again!",
            });
          }
          const { originalname, mimetype, buffer } = req.file;
          const userId = req.user.userId;
          logger.info(`File details: name=${originalname}, type=${mimetype}`);
          //logger.info("Uploading to cloudinary starting...");
          let url = `http://localhost:3000/${originalname}`

          const newlyCreatedMedia = new Media({
            publicId: uuidv4(),
            originalName: originalname,
            mimeType: mimetype,
            url,
            userId,
          });
      
          await newlyCreatedMedia.save();
          res.status(201).json({
            success: true,
            mediaId: newlyCreatedMedia._id,
            url: newlyCreatedMedia.url,
            message: "Media upload is successfully",
          });
    } catch (error) {
        logger.error("Error creating media", error);
        res.status(500).json({
          success: false,
          message: "Error creating media",
        });
    }
}

module.exports={uploadMedia}