require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const Redis = require("ioredis")
 
const app = express();
const PORT = process.env.PORT || 3002;
const logger = require("../utils/logger");
const postRoutes = require("../src/routes/post-routes");
const { connectRabbitMQ } = require("../utils/rabbitmq");


//connect to mongodb
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);

//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

app.use("/api/posts",(req,res,next)=>{
    req.redisClient = redisClient;
    next();
},postRoutes)

async function connectingServer(){
  try {
    await connectRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Post service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Get error while starting post servie');
  }
  
}
connectingServer();

process.on("unhandledRejection", (reason, promise) => {
logger.error("Unhandled Rejection at", promise, "reason:", reason);
});