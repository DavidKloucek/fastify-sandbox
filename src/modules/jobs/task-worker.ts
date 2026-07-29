import { ConnectionOptions, Job, Worker } from 'bullmq';
import { JobHandlerList } from './types.js';

export function createDomainWorker(
    queueName: string,
    handlers: JobHandlerList,
    redisConnection: ConnectionOptions,
    concurrency: number
) {
    return new Worker(
        queueName,
        (job: Job) => {
            const handler = handlers[job.name];
            if (!handler) {
                throw new Error(`Unknown job: ${job.name}`);
            }
            return handler(job) as Promise<unknown>;
        },
        { connection: redisConnection, concurrency }
    ).on('failed', (job, err) => {
        console.error(`Job ${job?.id ?? "-"} (${job?.name ?? ""}) failed:`, err.message);
    }).on('completed', (job) => {
        console.log("Completed", job.name, job.data)
    });
}
