require('dotenv').config();

const mongoose = require("mongoose");
const logger = require("./utils/logger");
//const {log} = require("winston");
const helmet = require("helmet");
const express = require("express");
const cors = require("cors");
const {RateLimiterRedis} = require("rate-limiter-flexible");
const Redis = require("ioredis");
const {rateLimit} = require("express-rate-limit");
const {RedisStore} = require("rate-limit-redis");
const routes = require("./routes/identity-service");
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001
mongoose.connect(process.env.MONGODB_URL)
.then(()=>logger.info("Connected to mongodb"))
.catch((e)=> logger.error("Mongo connection error",e));

const redisClient = new Redis(process.env.REDIS_URL)

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req,_,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request Body, ${req.body}`);
    next();
})

const rateLimiterRedis = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1
})

app.use((req,res,next)=>{
    rateLimiterRedis.consume(req.ip)
    .then(()=>next())
    .catch((e)=>{
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message:"Too many requests"
        });
    });
});

const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15*60*1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler:(req,res)=>{
        logger.warn(`Sensitive endpoint rate limit exceede for IP: ${req.ip}`);
        res.status(429).join({success: false, message: "Too many requests"})
    },
    store: new RedisStore({
        sendCommand: (...args)=> redisClient.call(...args)
    })
});

app.use('/api/auth/register',sensitiveEndpointsLimiter);
app.use('/api/auth',routes);

app.use(errorHandler);
app.listen(PORT, ()=>{
    logger.info(`Identity service running on port ${PORT}`)
})


process.on('unhandledRejection', (reason,promise)=>{
    logger.error('unhandledRejection at', promise,"reason:",reason)
})
