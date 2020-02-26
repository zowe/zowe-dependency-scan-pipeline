const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require("path");
const cors = require('cors');
const logger = require('./services/logger.service');

logger.debug('starting ...');

const { HTTPS_PORT, HTTP_PORT } = require('../configs/config.json');

logger.debug('starting scheduler service ...');
const scheduler = require('./services/scheduler.service');

const app = express();

//TODO: use for whitelist only
app.use(cors());
const routes = require('./routes/index.route');

app.get('/', (req, res) => res.send('Hello World!'));
app.use(routes);

if (HTTP_PORT) {
    logger.debug(`starting http server at port ${HTTP_PORT} ...`);
    const httpServer = http.createServer(app);
    httpServer.listen(HTTP_PORT);
    logger.info(`server listening at port ${HTTPS_PORT}`);
}
if (HTTPS_PORT) {
    logger.debug(`starting https server at port ${HTTPS_PORT} ...`);
    const privateKey = fs.readFileSync(path.resolve(__dirname, "../configs/sslcert/server.key"), 'utf8');
    const certificate = fs.readFileSync(path.resolve(__dirname, "../configs/sslcert/server.cert"), 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(HTTPS_PORT);
    logger.info(`server listening at port ${HTTPS_PORT}`);
}

module.exports = { app };