import { fastify, FastifySchema, RouteOptions } from 'fastify';
import fastifyJWT from '@fastify/jwt';
import { z } from 'zod';
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import { NotFoundError, RequestContext, EntityManager } from '@mikro-orm/postgresql';
import { registerUserRoutes } from '../modules/user/routes.js';
import { registerCountryRoutes } from '../modules/country/routes.js';
import { appContainer, asValue, initAppContainer } from './container.js';
import fastifyCors from '@fastify/cors';
import { registerPlaygroundRoutes } from '../modules/playground/routes.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { authenticate, AuthError } from './utils.js';
import fastifySwagger from '@fastify/swagger';

interface AppFastifySchema extends FastifySchema {
    response?: Record<number, unknown>;
}


export async function bootstrap(port: number) {
    const db = await initAppContainer();

    const app = fastify({
        logger: true
    });

    await app.register(fastifyCors, {
        origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
        credentials: true,
    });

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(fastifySwagger, {
        openapi: {
            info: { title: 'API', version: '1.0.0' },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
        transform: jsonSchemaTransform,
    });

    function stripAdditionalProperties(obj: Record<string, unknown>) {
        for (const key of Object.keys(obj)) {
            if (key === 'additionalProperties' && obj[key] === false) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                stripAdditionalProperties(obj[key] as Record<string, unknown>);
            }
        }
    }

    app.get('/api/docs', (_req, reply) => {
        const spec = app.swagger();
        stripAdditionalProperties(spec as Record<string, unknown>);
        reply.type('text/html; charset=utf-8').send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Reference</title>
</head>
<body>
    <script id="api-reference" type="application/json">${JSON.stringify(spec)}</script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.62.5/dist/browser/standalone.js"></script>
</body>
</html>`);
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is required');
    }

    app.register(fastifyJWT, {
        secret: jwtSecret,
    });

    app.addHook('onRoute', (routeOptions: RouteOptions) => {
        const schema = routeOptions.schema as AppFastifySchema | undefined;

        if (schema?.security?.length) {
            schema.response ??= {};
            schema.response[401] ??= z.object({ error: z.string() });

            if (!routeOptions.preHandler) {
                routeOptions.preHandler = [authenticate];
            } else if (Array.isArray(routeOptions.preHandler)) {
                routeOptions.preHandler = [authenticate, ...routeOptions.preHandler];
            } else {
                routeOptions.preHandler = [authenticate, routeOptions.preHandler];
            }
        }
    });

    app.addHook('onRequest', (request, reply, done) => {
        RequestContext.create(db.em, done);
    });

    app.addHook('onRequest', (request, _reply, done) => {
        const em = RequestContext.getEntityManager() as EntityManager;
        request.di = appContainer.createScope();
        request.di.register({ em: asValue(em) });
        done()
    });

    app.addHook('onRequest', async request => {
        if (!request.headers.authorization) {
            return
        }
        try {
            const ret = await request.jwtVerify<{ id: number }>();
            request.user = await request.di.resolve("userRepository").findOneOrFail(ret.id);
        } catch (e) {
            app.log.error(e);
        }
    });

    app.setErrorHandler((error: Error, request, reply) => {

        if (error instanceof AuthError) {
            return reply.status(401).send({ error: error.message });
        }

        if (error instanceof NotFoundError) {
            return reply.status(404).send({ error: error.message });
        }

        app.log.error(error);
        reply.status(500).send({ error: "An error occured" });
    });

    app.addHook('onResponse', async request => {
        await request.di.dispose();
    });

    app.addHook('onClose', async () => {
        await db.orm.close();
        await appContainer.dispose();
    });

    app.register(registerUserRoutes, { prefix: 'api/user' });
    app.register(registerCountryRoutes, { prefix: 'api/countries' });
    app.register(registerPlaygroundRoutes, { prefix: 'api/playground' });

    const serverAdapter = new FastifyAdapter();
    serverAdapter.setBasePath('/admin/queues');

    const queue = appContainer.resolve('queue');
    createBullBoard({
        queues: [new BullMQAdapter(queue)],
        serverAdapter,
    });

    app.register(serverAdapter.registerPlugin(), { prefix: '/admin/queues' });

    app.get('/api/docs/openapi.json', () => {
        const spec = app.swagger();
        stripAdditionalProperties(spec as Record<string, unknown>);
        return spec;
    });

    const url = await app.listen({ port });

    return { app, url };
}
