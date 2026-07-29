module.exports = {
    apps: [
        {
            name: 'api',
            script: 'dist/server.js',
            instances: 1,
            exec_mode: 'fork',
            node_args: '--experimental-vm-modules',
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
