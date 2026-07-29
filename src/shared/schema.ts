import { z } from 'zod';

export function withAuth() {
    return { security: [{ bearerAuth: [] }] };
}

export function withoutAuth() {
    return { security: [] as { [key: string]: string[] }[] };
}

export const PaginationQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof PaginationQuery>;

export function paginationOffset(pagination: PaginationQuery): number {
    return (pagination.page - 1) * pagination.limit;
}

export function paginatedSchema(itemSchema: Parameters<typeof z.array>[0]) {
    return z.object({
        data: z.array(itemSchema),
        total: z.number().int(),
        page: z.number().int(),
        limit: z.number().int(),
    });
}

export function unpaginatedSchema(itemSchema: Parameters<typeof z.array>[0]) {
    return z.object({
        data: z.array(itemSchema),
    });
}
