const Post = require("../models/Post");
const logger = require("../../utils/logger");
const { validateCreatePost } = require("../../utils/validation");
const { publishEvent } = require("../../utils/rabbitmq");

async function invalidatePostCache(req, input) {
    const cachedKey = `post:${input}`;
    await req.redisClient.del(cachedKey);
  
    const keys = await req.redisClient.keys("posts:*");
    console.log('keys',keys)
    if (keys.length > 0) {
      await req.redisClient.del(keys);
    }
}
const createPost = async (req,res)=>{
    logger.info("Create post endpoint hit");

    try {
        const {error} = validateCreatePost(req.body);
        if(error){
            logger.warn('Create post endpoint hit');
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const {content,mediaIds} = req.body;
        const newlyCreatedPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || [],
        });
        await newlyCreatedPost.save();
        publishEvent('post.create',{
            content: newlyCreatedPost.content,
            userId:req.user.userId,
            postId: newlyCreatedPost._id,
            createdAt: newlyCreatedPost.createdAt
        })
        logger.info("Post created successfully", newlyCreatedPost);
        await invalidatePostCache(req, newlyCreatedPost._id.toString());
        logger.info("Post created successfully", newlyCreatedPost);
        res.status(201).json({
        success: true,
        message: "Post created successfully",
        });
    } catch (error) {
        logger.error("Error creating post", error);
        res.status(500).json({
        success: false,
        message: "Error creating post",
        });
    }
}

const getAllPosts = async (req,res)=>{
    logger.info("Get all post endpoint hit");
    try {
    
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        
        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);
        if (cachedPosts) {
        return res.json(JSON.parse(cachedPosts));
        }

        const posts = await Post.find({})
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);

        const totalNoOfPosts = await Post.countDocuments();

        const result = {
        posts,
        currentpage: page,
        totalPages: Math.ceil(totalNoOfPosts / limit),
        totalPosts: totalNoOfPosts,
        };

        //save your posts in redis cache
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

        res.json(result);
    } catch (error) {
        logger.error("Error fetching post", error);
        res.status(500).json({
        success: false,
        message: "Error fetching post",
        });
    }
}

const getPost = async (req,res) =>{
    try {
        const postid = req.params.id;
        const cashekey = `post:${postid}`;
        const cashedPost = await req.redisClient.get(cashekey);
        if(cashedPost){
           return res.json(JSON.parse(cashedPost));
        }

        const singlePostDetailsById = await Post.findById(postid);
        if(!singlePostDetailsById){
            return res.status(400).json({
                message:'Post not found',
                success: false
            })
        }

        await req.redisClient.setex(cashekey,3600,JSON.stringify(singlePostDetailsById));
        res.json(singlePostDetailsById);
    } catch (error) {
        logger.error("Error fetching post", error);
        res.status(500).json({
        success: false,
        message: "Error fetching post by ID",
        });
    }
}

const deletePost = async (req,res) =>{
    try {
        const postid = req.params.id;
        const cashekey = `post:${postid}`;
        

        const singlePostDetailsById = await Post.findByIdAndDelete({
            _id:postid,
            user:req.user.userId
        });
        
        if(!singlePostDetailsById){
            return res.status(400).json({
                message:'Post not found',
                success: false
            })
        }
        await Post.findByIdAndDelete(postid);
        await publishEvent('post.delete',{
            postId:singlePostDetailsById._id,
            userId: req.user.userId,
            mediaIds:singlePostDetailsById.mediaIds
        });
        await invalidatePostCache(req, postid.toString());
        res.json({
          message: "Post deleted successfully",
        });
    } catch (error) {
        logger.error("Error fetching post", error);
        res.status(500).json({
        success: false,
        message: "Error fetching post by ID",
        });
    }
}

module.exports ={createPost,getAllPosts,getPost,deletePost}
