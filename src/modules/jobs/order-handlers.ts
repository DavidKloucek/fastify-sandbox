import { z } from 'zod';
import { Job, Queue, QueueEvents } from 'bullmq';
import { v4 } from 'uuid';

export const OrderItem = z.object({
    sku: z.string(),
    qty: z.number().positive()
});

export const CreateOrderInput = z.object({
    customerId: z.string(),
    items: z.array(OrderItem).min(1).optional(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderInput>

export const CreateOrderResult = z.object({
    orderId: z.string(),
    jobId: z.string(),
})
export type CreateOrderResult = z.infer<typeof CreateOrderResult>

export const CancelOrderDto = z.object({
    orderId: z.string(),
    reason: z.string(),
});

export const OrderJob = {
    CreateOrder: 'createOrder',
    CancelOrder: 'cancelOrder',
} as const;

export function createOrderJobHandlers(
    _deps: Dependencies<'usefulService'>, // eslint-disable-line @typescript-eslint/no-unused-vars
) {
    return {
        [OrderJob.CreateOrder]: (job: Job): CreateOrderResult => {
            CreateOrderInput.parse(job.data)
            return {
                orderId: v4(),
                jobId: job.id ?? '',
            }
        },
        [OrderJob.CancelOrder]: () => {
            throw new Error('Not implemented');
        },
    };
}

export class OrderCommandService {
    private queueEvents: QueueEvents;

    constructor(private queue: Queue) {
        this.queueEvents = new QueueEvents('jobs', {
            connection: queue.opts.connection
        });
    }

    async createOrder(input: CreateOrderInput) {
        const job = await this.queue.add(OrderJob.CreateOrder, CreateOrderInput.parse(input));
        return {
            jobId: job.id,
        };
    }
}
