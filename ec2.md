nvm node npm git installer
1. https://medium.com/geekculture/how-to-install-node-js-by-nvm-61addf4ab1ba
2. https://medium.com/@rajani103/deploying-nodejs-app-on-aws-ec2-instance-step-by-step-1b00f807cdce

# Installing git with nvm
1. Ensure NVM is sourced :- source ~/.bashrc
2. Use NVM to install Git :- nvm exec npm install -g git
 

# Closing the SSH connection but keeping the server onn.
1. screen -ls :-  https://dev.to/akhileshthite/how-to-keep-ec2-instance-running-after-ssh-is-terminated-45k8






# This workflow will do a clean installation of node dependencies, cache/restore them, build the source code and run tests across different versions of node
# For more information see: https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs

name: Node.js CI

on:
  push:
    branches: [ "main" ]

jobs:
  build:

    runs-on: self-hosted

    strategy:
      matrix:
        node-version: [20.x]
        # See supported Node.js release schedule at https://nodejs.org/en/about/releases/

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - name: Define Environment Variables
      run: echo defining PORT, NODE_ENV , MONGO_URI, JWT_SECRET, JWT_LIFETIME, FAST2SMS_API_KEY, CRYPT_PASSWORD, CRYPT_IV
      env:
        PORT: ${{ secrets.PORT }}
        NODE_ENV: ${{ secrets.NODE_ENV }}
        MONGO_URI: ${{ secrets.MONGO_URI }}
        JWT_SECRET: ${{ secrets.JWT_SECRET }}
        JWT_LIFETIME: ${{ secrets.JWT_LIFETIME }}
        FAST2SMS_API_KEY: ${{ secrets.FAST2SMS_API_KEY }}
        CRYPT_PASSWORD: ${{ secrets.CRYPT_PASSWORD }}
        CRYPT_IV: ${{ secrets.CRYPT_IV }}
    - run: npm ci
    - run: npm run build --if-present
    - run: pm2 restart pm2.config.js
