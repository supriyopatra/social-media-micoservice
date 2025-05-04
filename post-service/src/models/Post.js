const moongose = require("mongoose");

const postSchema = new moongose.Schema({
    user:{
        type: moongose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content:{
        type: String,
        required: true
    },
    mediaIds: [
        {
            type:String
        }
    ],
    createdAt:{
        type: Date,
        default: Date.now
    }
},
{timestamps:true}
);

postSchema.indexes({content:"text"});

const Post = moongose.model("Post",postSchema);
module.exports = Post;