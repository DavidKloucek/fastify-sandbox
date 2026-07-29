import 'dotenv/config';
process.title = "Fastify job worker"

import { AwilixContainer } from "awilix";
import { appContainer, Cradle, initAppContainer } from "../shared/container.js";

let di: AwilixContainer<Cradle> | null = null
const getDi = async () => {
    if (di !== null) {
        return di;
    }
    await initAppContainer();
    di = appContainer.createScope();
    return di
}

async function start() {
    const di = await getDi();
    di.resolve('worker');
    console.log('Worker started');

    const shutdown = () => {
        void appContainer.dispose().finally(() => process.exit(0));
    };
    process.on('SIGTERM', shutdown);
}
void start();
