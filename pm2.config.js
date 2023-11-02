module.exports = {
    script: 'tsc && node dist/app.js',
    name: 'dk_academy_server',
    exec_mode: 'cluster', // Optional: Use 'cluster' mode for better performance
    instances: 1, // Optional: Set the number of instances based on your needs
    // other PM2 configuration options as needed pm2
};
  