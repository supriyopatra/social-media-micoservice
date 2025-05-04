const Media = require("../models/Media");
const logger = require("../utils/logger");

const handlePostDeleted = async (event)=>{
    console.log("eventevent",event);
    const {postId,mediaIds} = event;
    try {
        const mediaToDelete = await Media.find({_id:{$in:mediaIds}});
        const deletePromise =[]
        for(const media of mediaToDelete){
            deletePromise.push(Media.findByIdAndDelete(media._id))
        }
        await Promise.all(deletePromise);
        logger.info(`Deleted media ids associated with this deleted post ${postId}`)
    } catch (error) {
        logger.error(e, 'Error occured while media deletation')
    }
}

module.exports={handlePostDeleted}