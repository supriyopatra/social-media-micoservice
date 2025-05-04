const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'facebook_events';

async function connectRabbitMQ() {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = connection.createChannel();
        
        (await channel).assertExchange(EXCHANGE_NAME,'topic',{durable:true})
        logger.info('connected to rabbitMq');
        return channel;
    } catch (error) {
        logger.error('Error connecting to Rabbit MQ',error)
    }
}

async function publishEvent(rroutingKey,message) {
    if(!channel){
        await connectRabbitMQ();
    }
    (await channel).publish(EXCHANGE_NAME,rroutingKey,Buffer.from(JSON.stringify(message)));
    logger.info(`Publish Event ${rroutingKey}`)
}

async function consumeEvent(routingKey,callback) {
    if(!channel){
        await connectRabbitMQ();
    }
    const q = (await channel).assertQueue("", { exclusive: true });
    (await channel).bindQueue(q.queue,EXCHANGE_NAME,routingKey);
    (await channel).consume(q.queue,async (msg)=>{
        if(msg != null){
            const content = JSON.parse(msg.content.toString());
            callback(content);
            (await channel).ack(msg)
           // channel.ack(msg);
        }
    });


    logger.info(`Subscribe to  Event ${routingKey}`)
}

module.exports = {connectRabbitMQ,publishEvent,consumeEvent}