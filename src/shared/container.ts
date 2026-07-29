import { createContainer, asClass, asFunction, asValue, InjectionMode, NameAndRegistrationPair, } from 'awilix';
import { Country } from '../modules/country/country.entity.js';
import { CountryFacade } from '../modules/country/country.facade.js';
import { User } from '../modules/user/user.entity.js';
import { UserRepository } from '../modules/user/user.repository.js';
import { CountryRepository } from '../modules/country/country.repository.js';
import { EntityManager } from '@mikro-orm/postgresql';
import { DashboardFacade } from './dashboard.facade.js';
import { initORM } from './db.js';
import { ProductCardFactoryPool } from '../modules/read-model/product-card-factory.pool.js';
import { ProductCardFactory as ProductCardDtoFactory } from '../modules/read-model/product-card.factory.js';
import { ProductCardCache } from '../modules/read-model/product-card.cache.js';
import { Queue, Worker } from 'bullmq';
import { Redis as RedisClient } from 'ioredis';
import { OrderCommandService, createOrderJobHandlers } from '../modules/jobs/order-handlers.js';
import { createDomainWorker } from '../modules/jobs/task-worker.js';
import { UsefulService } from './useful-service.js';
import { JobHandlerList } from '../modules/jobs/types.js';
import { AdidasStockUpdater } from '../modules/stock-updater/adidas.updater.js';
import { IPumaStockUpdater, PumaStockUpdater } from '../modules/stock-updater/puma.updater.js';
import { StockUpdater } from '../modules/stock-updater/stock-updater.service.js';

type TConfig = {
    exampleValue: boolean
}

export interface Cradle {
    config: TConfig
    em: EntityManager;

    productCardDtoFactory: ProductCardDtoFactory;
    productCardWorkerPoolDtoFactory: ProductCardFactoryPool;
    productCardCache: ProductCardCache;

    countryRepository: CountryRepository;
    countryFacade: CountryFacade;

    userRepository: UserRepository;

    dashboardFacade: DashboardFacade;

    stockUpdater: StockUpdater;

    pumaStockUpdater: IPumaStockUpdater;
    adidasStockUpdater: AdidasStockUpdater;

    usefulService: UsefulService

    queue: Queue;
    worker: Worker;
    jobHandlers: JobHandlerList
    createOrderJobHandlers: ReturnType<typeof createOrderJobHandlers>
    orderCommandService: OrderCommandService;
    redisConnection: RedisClient;
}

export const appContainer = createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true
});

declare global {
    type Dependencies<Name extends keyof Cradle> = Pick<Cradle, Name>
}

export async function initAppContainer() {
    const services = await initORM();

    appContainer.register<NameAndRegistrationPair<Cradle>>({

        usefulService: asClass(UsefulService).singleton(),

        em: asValue(services.em),

        productCardDtoFactory: asClass(ProductCardDtoFactory).singleton(),

        productCardWorkerPoolDtoFactory: asClass(ProductCardFactoryPool).singleton(),

        productCardCache: asClass(ProductCardCache)
            .inject(() => ({ productReadModel: appContainer.resolve('productCardWorkerPoolDtoFactory') }))
            .singleton(),

        redisConnection: asFunction((): RedisClient => new RedisClient({
            host: process.env.REDIS_HOST ?? 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: null,
        })).singleton(),

        queue: asFunction(({ redisConnection }: Dependencies<'redisConnection'>) =>
            new Queue('jobs', { connection: redisConnection })
        ).singleton(),

        createOrderJobHandlers: asFunction(createOrderJobHandlers).singleton(),

        jobHandlers: asFunction((cradle: Cradle) => ({
            ...cradle.createOrderJobHandlers,
        } satisfies JobHandlerList)).singleton(),

        worker: asFunction(({ redisConnection, jobHandlers }: Dependencies<'jobHandlers' | 'redisConnection'>) =>
            createDomainWorker('jobs', jobHandlers, redisConnection, 2)
        ).singleton(),

        orderCommandService: asFunction(({ queue }: Dependencies<"queue">) =>
            new OrderCommandService(queue)
        ).singleton(),

        countryRepository: asFunction(({ em }: Dependencies<"em">) => em.getRepository(Country)).singleton(),
        countryFacade: asClass(CountryFacade).singleton(),
        userRepository: asFunction(({ em }: Dependencies<"em">) => em.getRepository(User)).singleton(),
        dashboardFacade: asClass(DashboardFacade).singleton(),
        stockUpdater: asClass(StockUpdater).singleton(),
        pumaStockUpdater: asClass(PumaStockUpdater).singleton(),
        adidasStockUpdater: asClass(AdidasStockUpdater).singleton(),

        config: asValue({
            exampleValue: true,
        }),
    });

    return services;
}

export { asValue };

declare module 'fastify' {
    interface FastifyRequest {
        di: typeof appContainer
    }
}
