const Search = require("./../models/Search");
const logger = require("../../utils/logger");

const handleCreatePost = async (event)=>{
    try {
        console.log('EventEvent',event)
        const createSearchPost = new Search({
            content:event.content,
            userId:event.userId,
            postId: event.postId,
            createdAt: event.createdAt
        });
    
        await createSearchPost.save();
        logger.info(
            `Search Post created: ${event.postId}, ${createSearchPost._id}`
        )
    } catch (e) {
        logger.error(e, "Error handling post creation event");
    }
    

}

const handlePostDeleted = async (event)=>{
    try {
        const searchPost = await Search.findOneAndDelete({
            postId: event.postId
        });
        if(searchPost == null){
            logger.error(`Post not Found with postId ${event.postId}`)
        }
        logger.info('Post deleted Successfully')
    } catch (e) {
        logger.error(`Get error while delete a post with postId ${event.postId}`);
    }
}

module.exports={handleCreatePost,handlePostDeleted}
