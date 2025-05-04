const amqplib = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME ='facebook_events';

async function connectToRabbitMQ() {

    try {
       connection = await amqplib.connect(process.env.RABBITMQ_URL);
       channel = await connection.createChannel();
       
       await channel.assertExchange(EXCHANGE_NAME,"topic",{durable:true});
       logger.info("connected to rabbitmq")
    } catch (e) {
        logger.error("Error connecting to rabbit mq", e);
    }
    
}

async function consumeEvent(routingKey, callback) {
    if(!channel){
        await connectToRabbitMQ();
    }
    const q = channel.assertQueue("",{
        exclusive: true
       });
    channel.bindQueue((await q).queue,EXCHANGE_NAME,routingKey);
    channel.consume(q.queue, (msg) => {
        if (msg !== null) {
          const content = JSON.parse(msg.content.toString());
          callback(content);
          channel.ack(msg);
        }
      });
    
      logger.info(`Subscribed to event: ${routingKey}`);

}


module.exports ={connectToRabbitMQ,consumeEvent}
