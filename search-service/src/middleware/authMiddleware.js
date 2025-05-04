const logger = require("../../utils/logger");

const authenticateRequest = (req,res,next)=>{
    const userId = req.headers['x-user-id'];
    if(!userId){
        logger.warn('Without Userid try to access ');
        return res.status(401).json({
            success: false,
            message: "Authencation required! Please login to continue",
          });
    }
    req.user = { userId };
    next();
}


module.exports = {authenticateRequest};