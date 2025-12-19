module.exports = {
    apps: [
        {
            name: 'clm-frontend',
            script: '/usr/bin/serve',
            args: '-s dist -l 8080',
            cwd: '/home/adel/log',
            env: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'clm-backend',
            script: 'dist/server.js',
            cwd: '/home/adel/log/backend',
            env: {
                NODE_ENV: 'production',
                DB_HOST: '127.0.0.1',
                DB_USER: 'adel',
                DB_PASSWORD: '!Yara@2014',
                DB_NAME: 'logser',
                PORT: '3000',
                SYSLOG_PORT: '4950'
            }
        }
    ]
};
