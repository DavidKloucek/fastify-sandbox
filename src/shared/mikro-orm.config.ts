import { defineConfig, GeneratedCacheAdapter, Options } from '@mikro-orm/postgresql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const options = {} as Options;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const backendRoot = path.join(__dirname, '..', '..');

if (process.env.NODE_ENV === 'production' && existsSync('./temp/metadata.json')) {
    options.metadataCache = {
        enabled: true,
        adapter: GeneratedCacheAdapter,
        options: {
            data: JSON.parse(readFileSync('./temp/metadata.json', {
                encoding: 'utf8'
            })) as Record<string, unknown>,
        },
    };
}

export default defineConfig({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
    dbName: process.env.DB_NAME,
    entities: [path.join(backendRoot, 'dist', '**', '*.entity.js')],
    entitiesTs: [path.join(backendRoot, 'src', '**', '*.entity.ts')],
    discovery: {
        tsConfigPath: path.join(backendRoot, 'tsconfig.json'),
    },
    debug: process.env.NODE_ENV !== 'production',
    dynamicImportProvider: id => import(id),
    highlighter: new SqlHighlighter(),
    ...options,
});