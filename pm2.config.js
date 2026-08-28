module.exports = {
  apps: [
    {
      name: 'mirainox',
      script: 'dist/index.js',
      cwd: 'c:\\Users\\Administrator\\Documents\\SISTEMA MIRAINOX\\sistema\\backend',
      env: {
        NODE_ENV: 'production',
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
}
