import { FastifyRequest } from 'fastify';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function resolveRelative(importMetaUrl: string, relativePath: string) {
    const base = path.dirname(fileURLToPath(importMetaUrl));
    return path.resolve(base, relativePath);
}

export class AuthError extends Error { }

export async function authenticate(request: FastifyRequest): Promise<void> {
    if (!request.user) {
        throw new AuthError('Please provide your token via Authorization header');
    }
    return Promise.resolve()
}

export async function delay(ms: number): Promise<void> {
    await new Promise((ok) => setTimeout(ok, ms))
}
