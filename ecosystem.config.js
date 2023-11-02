module.exports = {
    apps: [
      {
        script: 'src/app.ts',
        interpreter: '/home/ubuntu/.nvm/versions/node/v20.9.0/lib/node_modules/ts-node/dist/bin.js',
        watch: true,
        exec_mode: 'fork',
        instances: 1,
        name: 'dk_academy_server',
        env: {
          PORT: process.env.PORT,
          NODE_ENV: process.env.NODE_ENV,
          MONGO_URI: process.env.MONGO_URI,
          JWT_SECRET: process.env.JWT_SECRET,
          JWT_LIFETIME: process.env.JWT_LIFETIME,
          FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY,
          CRYPT_PASSWORD: process.env.CRYPT_PASSWORD,
          CRYPT_IV: process.env.CRYPT_IV
        },
        args: ['--update-env']
      }
    ]
  };
  