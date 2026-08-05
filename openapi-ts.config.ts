import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig([
    {
        input: 'http://127.0.0.1:8055/openapi.json',
        output: {
            path: './src/generated/face-api',
            module: { extension: '.js' },
        },
        plugins: [
            { name: '@hey-api/client-fetch', throwOnError: true },
            {
                name: 'zod',
                compatibilityVersion: 4,
                requests: false,
                responses: true,
            },
            { name: '@hey-api/sdk', validator: 'zod' },
        ],
    },
]);