/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import express from "express";
import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import { safeLoad } from "js-yaml";

import { ZMS_LOGGER_LABEL, ZMS_CONFIG_DIR, ZMS_CONFIG_FILE } from "./constants";
import { ZMSConfig, ZMSException } from "./types";
import logger from "./services/logger";
import metricsManager from "./services/metrics-manager";
import routes from "./routes";

(async () => {
  // read configs
  logger.info("reading config file ...");
  const config: ZMSConfig = safeLoad(fs.readFileSync(ZMS_CONFIG_FILE).toString()) as ZMSConfig;
  logger.debug("> config loaded %j", config);

  // init metrics manager
  logger.info("initializing metrics manager ...");
  await metricsManager.init(config.metrics);
  logger.debug("starting metrics manager ...");
  await metricsManager.start();

  logger.info("starting web application ...");
  const app = express();

  // app.use(cors());
  app.enable('trust proxy');

  // log requests
  app.use((req, res, next) => {
    logger.info("> %s %s from %j", req.method, req.url, req.ips.length > 0 ? req.ips : req.ip);
    next();
  });

  app.get("/", (req, res) => res.send(ZMS_LOGGER_LABEL));
  // load external routes
  app.use(routes);

  if (config.server.http.enabled) {
    logger.debug("> starting http server at port %d ...", config.server.http.port);
    const httpServer = http.createServer(app);
    httpServer.listen(config.server.http.port);
    logger.info("> http server listening at port %d", config.server.http.port);
  }
  if (config.server.https.enabled) {
    // prepare https option
    const httpsOption: https.ServerOptions = Object.create({});
    if (config.server.https.key && config.server.https.cert) {
      httpsOption.key = fs.readFileSync(path.resolve(ZMS_CONFIG_DIR, config.server.https.key), "utf-8");
      httpsOption.cert = fs.readFileSync(path.resolve(ZMS_CONFIG_DIR, config.server.https.cert), "utf-8");
    } else {
      throw new ZMSException("Only key/cert https option is supported");
    }

    logger.debug("> starting https server at port %d ...", config.server.https.port);
    const httpsServer = https.createServer(httpsOption, app);
    httpsServer.listen(config.server.https.port);
    logger.info("> https server listening at port %d", config.server.https.port);
  }
})();
