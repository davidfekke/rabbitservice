import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import amqp from 'amqplib';

let connection;
let channel;
const queue = "pi_messages";
const rabbitmqURL = process.env.RABBITMQ_URL;

const fastify = Fastify({ logger: true });

const port = process.env.PORT || '3000';

fastify.register(fastifyCors, { 
    // put your options here
});

fastify.post('/', async (request, reply) => {
    const jsonMessage = request.body;

    const response = {
        status: 'success',
        message: 'Message sent to AMQP',
        data: jsonMessage // Optionally include the user data or some identifier
    };

    await produceMessage(jsonMessage);

    reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(response);
})

const start = async () => {
    try {
        console.log(`URL: ${rabbitmqURL}`);
        connection = await amqp.connect(rabbitmqURL);
        channel = await connection.createChannel();
        await channel.assertQueue(queue, { durable: false });

        process.once("SIGINT", async () => {
            await channel.close();
            await connection.close();
        });

        await fastify.listen({ port, host: '0.0.0.0' });
    } catch(err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();

async function produceMessage(msgObject) {
    try {
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(msgObject)));
        // const response = 
        console.log(" [x] Sent '%s'", msgObject);
       // return response;
    } catch (err) {
        console.error(err);
    }
}
