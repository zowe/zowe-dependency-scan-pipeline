/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { createLogger, format, transports } from "winston";
import { ZMS_LOGGER_LABEL } from "../constants";
const { combine, timestamp, label, printf, splat, colorize } = format;

export default createLogger({
  format: combine(
    label({ label: ZMS_LOGGER_LABEL }),
    timestamp(),
    colorize(),
    splat(),
    printf((info) => {
      return `[${info.label}][${info.timestamp}][${info.level}] ${info.message}`;
    }),
  ),
  transports: [
    new transports.Console({
      level: process.env.LOG_LEVEL || "info"
    })
  ]
});
