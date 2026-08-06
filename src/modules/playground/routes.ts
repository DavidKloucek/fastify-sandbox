import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { withoutAuth } from '../../shared/schema.js';
import { z } from 'zod'
import { eventLoopUtilization, monitorEventLoopDelay } from 'node:perf_hooks';
import process from 'node:process'
import { createClient, createConfig } from '../../generated/face-api/client/index.js';
import { representApiRepresentPost } from '../../generated/face-api/sdk.gen.js';

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

    route.get('/stats', {
        schema: {
            tags: ['Playground'],
            ...withoutAuth(),
        }
    }, () => {
        return {
            eventLoopUtilization: eventLoopUtilization(),
            monitorEventLoopDelay: monitorEventLoopDelay(),
            getActiveResourcesInfo: process.getActiveResourcesInfo(),
        }
    })


    route.get('/api-call', {
        schema: {
            tags: ['Playground'],
            ...withoutAuth(),
        }
    }, async (req) => {

        const imgReq = await fetch("https://www.gstatic.com/marketing-cms/assets/images/c3/69/0cea77f34e4aa735f729734b327f/we-partner-img-1.webp")

        const file = await imgReq.blob();

        const client = createClient(createConfig({
            baseUrl: 'http://127.0.0.1:8055/',
        }));

        const { data } = await representApiRepresentPost({
            client,
            body: { file, detector_backend: 'mtcnn', model_name: 'ArcFace' },
        });

        console.log("Regions", data.length)

        const faceRepository = req.di.resolve('faceRepository')

        for (const reg of data) {
            const q = await faceRepository.findNearestByVector({
                targetVector: reg.embedding,
                metric: 'cosine',
                limit: 10
            })

            for (const item of q) {
                console.log(item.face.filename, item.face.model, item.distance)
            }
        }

        return data;
    })
}
