# Zowe Performance Test Client

Perform performance test on the target server.

## Programming Language And Main Testing Method

- Node.js, with recommended [v12.x LTS](https://nodejs.org/docs/latest-v10.x/api/index.html)
- [Jest](https://jestjs.io/)

## Run Test Cases On Your Local

### Prepare NPM Packages

Run `npm install` to install dependencies.

### Start Test

```
DEBUG=zowe-performance-test:* \
ZMS_HOST=<your-zms-host> \
ZMS_PORT=19000 \
npm run test
```
