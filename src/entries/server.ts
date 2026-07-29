import 'dotenv/config';
import { bootstrap } from "../shared/app.js";

process.title = "Fastify main app"

try {
    const { url } = await bootstrap(8001);
    console.log(`server started at ${url}`);
} catch (e) {
    console.error(e);
}
