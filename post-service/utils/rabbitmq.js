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

async function publishEvent(routingKey,message) {
    if(!channel){
        await connectRabbitMQ();
    }
    (await channel).publish(EXCHANGE_NAME,routingKey,Buffer.from(JSON.stringify(message)));
    logger.info(`Publish Event ${routingKey}`)
}

module.exports = {connectRabbitMQ,publishEvent}