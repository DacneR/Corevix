import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { WebSocketServer, type WebSocket as ServerWebSocket } from 'ws';
import { scanLocalNetwork } from './network.js';

const prisma = new PrismaClient();
const app = Fastify({ logger: true });
let wsServer: WebSocketServer;

const scanSchema = z.object({
  ip: z.string().ip().optional(),
  interfaceName: z.string().optional(),
});

const eventSchema = z.object({
  type: z.string(),
  message: z.string(),
});

await app.register(cors, { origin: true });
await app.register(swagger, {
  openapi: {
    info: {
      title: 'Corevix API',
      version: '2.0.0',
      description: 'API de monitoreo y administración de redes locales',
    },
  },
});
await app.register(swaggerUi, { routePrefix: '/docs' });

await app.register(async (instance) => {
  instance.get('/', async () => ({
    project: 'Corevix',
    status: 'running',
    version: '2.0.0',
  }));

  instance.get('/health', async () => ({
    status: 'healthy',
    project: 'Corevix',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  }));

  instance.get('/devices', async () => {
    return prisma.device.findMany({
      orderBy: { lastSeen: 'desc' },
    });
  });

  instance.post('/devices/scan', async (request) => {
    const body = scanSchema.parse(request.body ?? {});
    const discovered = scanLocalNetwork();

    const devices = await Promise.all(
      discovered.map(async (device) => {
        const created = await prisma.device.upsert({
          where: { ip: device.ip },
          update: {
            mac: device.mac,
            hostname: device.hostname,
            vendor: device.vendor,
            lastSeen: new Date(),
          },
          create: {
            ip: device.ip,
            mac: device.mac,
            hostname: device.hostname,
            vendor: device.vendor,
            lastSeen: new Date(),
          },
        });

        return created;
      })
    );

    const event = await prisma.eventLog.create({
      data: {
        type: 'SCAN',
        message: `Escaneo de red ejecutado para ${body.ip ?? 'red local'}`,
      },
    });

    wsServer.clients.forEach((client: { send: (message: string) => void }) => {
      client.send(JSON.stringify({
        type: 'devices:update',
        payload: devices,
        event,
      }));
    });

    return { ok: true, devices };
  });

  instance.get('/events', async () => {
    return prisma.eventLog.findMany({
      orderBy: { createdAt: 'desc' },
    });
  });

  instance.post('/events', async (request) => {
    const body = eventSchema.parse(request.body ?? {});
    const event = await prisma.eventLog.create({ data: body });

    wsServer.clients.forEach((client: { send: (message: string) => void }) => {
      client.send(JSON.stringify({
        type: 'event:new',
        payload: event,
      }));
    });

    return event;
  });

}, { prefix: '/api' });

const start = async () => {
  try {
    const host = process.env.HOST ?? '127.0.0.1';
    const port = Number(process.env.PORT ?? 8000);

    const address = await app.listen({ host, port });
    wsServer = new WebSocketServer({
      server: app.server,
      path: '/api/ws',
    });

    wsServer.on('connection', (socket: ServerWebSocket) => {
      socket.send(JSON.stringify({
        type: 'status',
        message: 'Connected to Corevix websocket',
      }));

      socket.on('message', (data: Buffer | ArrayBuffer | Buffer[] | string) => {
        socket.send(JSON.stringify({
          type: 'ping',
          message: 'Corevix websocket active',
          received: data.toString(),
        }));
      });
    });

    console.log(`Corevix API running at ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
