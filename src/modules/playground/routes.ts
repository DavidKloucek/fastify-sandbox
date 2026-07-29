import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { withoutAuth } from '../../shared/schema.js';
import { z } from 'zod'

const Reply200 = z.any()

export function registerPlaygroundRoutes(app: FastifyInstance) {

    const route = app.withTypeProvider<ZodTypeProvider>();

    route.get<{
        Reply: z.infer<typeof Reply200>
    }>('/jobs', {
        schema: {
            tags: ['Playground'],
            ...withoutAuth(),
            response: {
                200: Reply200,
            },
        },
    }, async (request) => {
        const orderService = request.di.resolve('orderCommandService')
        for (let i = 1; i <= 2; i++) {
            await orderService.createOrder({
                customerId: "123",
                items: [{ sku: "ABC-" + i.toString(), qty: i }]
            })
        }
        return {}
    })

    route.get<{
        Reply: z.infer<typeof Reply200>
    }>('/stocks', {
        schema: {
            tags: ['Playground'],
            ...withoutAuth(),
            response: {
                200: Reply200,
            },
        },
    }, async (request) => {
        const pumaParams = {
            useFastMode: true
        }

        const pumaWorker = request.di.resolve('stockUpdater')
            .process("pumaStockUpdater", [pumaParams]);

        const puma = request.di.resolve('pumaStockUpdater')
            .process(pumaParams)

        const adidasWorker = request.di.resolve('stockUpdater')
            .process('adidasStockUpdater', []);

        const adidas = request.di.resolve('adidasStockUpdater')
            .process()

        const inline = (await import("../stock-updater/stock-updater.worker.js"))
            .processStock({ processorKey: 'adidasStockUpdater' })

        return {
            pumaWorker: await pumaWorker,
            puma: await puma,
            adidasWorker: await adidasWorker,
            adidas: await adidas,
            inline: await inline,
        }
    })

    route.get<{
        Reply: z.infer<typeof Reply200>
    }>('/products', {
        schema: {
            tags: ['Playground'],
            ...withoutAuth(),
            response: {
                200: Reply200,
            },
        },
    }, async (request) => {

        const dashboardData = request.di.resolve("dashboardFacade").createStats()

        const cached = request.di.resolve('productCardCache');

        const products = await Promise.all([...Array(10).keys()]
            .map(i => cached.getDtoById(i + 1)))

        return {
            dashboard: await dashboardData,
            products,
        }
    });
}
