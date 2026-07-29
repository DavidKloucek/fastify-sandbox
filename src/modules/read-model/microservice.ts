import fastify from "fastify";
import { appContainer, asValue, initAppContainer } from "../../shared/container.js";
import { withoutAuth } from "../../shared/schema.js";
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { ProductCardDto } from "./types.js";
import z from "zod";

const Reply200 = ProductCardDto

const ProductParams = z.object({
    id: z.coerce.number().positive(),
})

export async function bootstrap(port: number) {
    const db = await initAppContainer();

    const app = fastify({
        logger: true
    });
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    app.addHook('onResponse', async request => {
        await request.di.dispose();
    });

    app.addHook('onClose', async () => {
        await db.orm.close();
        await appContainer.dispose();
    });

    app.addHook('onRequest', (request, reply, done) => {
        RequestContext.create(db.em, done);
    });

    app.addHook('onRequest', (request, _response, done) => {
        const em = RequestContext.getEntityManager() as EntityManager;
        request.di = appContainer.createScope();
        request.di.register({ em: asValue(em) });
        done()
    });

    app.get<{
        Params: z.infer<typeof ProductParams>
        Reply: z.infer<typeof Reply200>
    }>("/api/product/:id", {
        schema: {
            params: ProductParams,
            ...withoutAuth(),
            response: {
                200: Reply200
            }
        }
    }, async (req) => {
        const cached = req.di.resolve('productCardCache');
        return await cached.getDtoById(req.params.id)
    })

    const url = await app.listen({ port });

    for (const sig of ['SIGTERM', 'SIGINT'] as const) {
        process.on(sig, () => {
            app.close()
                .catch((e: unknown) => {
                    console.error(e)
                })
                .finally(() => {
                    process.exit(0);
                })
        });
    }

    return { app, url };
}
