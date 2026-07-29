import 'dotenv/config';
import { bootstrap } from "../modules/read-model/microservice.js";

process.title = "Fastify read model"

try {
    const { url } = await bootstrap(8008);
    console.log(`Server started at ${url}`);
} catch (e) {
    console.error(e);
}
