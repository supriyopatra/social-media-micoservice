const Search = require("../models/Search");

const getAllSearch = async (req,res)=>{
    const {query} = req.query;
    console.log(query);
    //const results = await Search.find({})
    const results = await Search.find(
        { $text: { $search: 'composability' } },                   // 🔍 Full-text search for "what"
        { score: { $meta: "textScore" } }                // 🧠 Include relevance score in the result
      )
      .sort({ score: { $meta: "textScore" } })           // 📊 Sort by relevance
      .limit(10);                                        // 🔢 Limit to top 10
      
    res.json(results)
}

module.exports = {getAllSearch}