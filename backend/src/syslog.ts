import dgram from 'dgram';
import { insertLog } from './db';
import { parseMikrotikLog } from './parser';

const PORT = 4950;
const HOST = '0.0.0.0'; // Listen on all interfaces

export const startSyslogServer = () => {
    const server = dgram.createSocket('udp4');

    server.on('error', (err) => {
        console.error(`Syslog Server error:\n${err.stack}`);
        server.close();
    });

    server.on('message', async (msg, rinfo) => {
        const rawMessage = msg.toString();
        // console.log(`Syslog received: ${rawMessage} from ${rinfo.address}:${rinfo.port}`);

        const parsed = parseMikrotikLog(rawMessage);

        // Use the parser result, but if Source IP is missing in message, maybe use the Sender's IP?
        // Usually Mikrotik sends the traffic log IN the message.

        await insertLog(parsed);
    });

    server.on('listening', () => {
        const address = server.address();
        console.log(`Syslog UDP Server listening on ${address.address}:${address.port}`);
    });

    server.bind(PORT, HOST);
    return server;
};
