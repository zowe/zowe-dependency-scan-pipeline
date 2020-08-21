/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import * as path from "path";
import { OutputFormat, ZMSWorkerOptions, RmfDdsOptions } from "./types";

export const ZMS_LOGGER_LABEL = "zms";
export const ZMS_ROOT_DIR = path.resolve(__dirname, "..");
export const ZMS_CONFIG_DIR = path.resolve(ZMS_ROOT_DIR, "configs");
export const ZMS_CONFIG_FILE = path.resolve(ZMS_CONFIG_DIR, "index.yaml");
export const ZMS_COLLECTORS_DIR = path.resolve(ZMS_ROOT_DIR, "src", "collectors");

export const DEFAULT_WORKER_OPTIONS: ZMSWorkerOptions = {
  interval: 10,
};

export const DEFAULT_WORKER_OUTPUT_FORMAT: OutputFormat = "json";

export const DEFAULT_RMF_PERFORM_FILTER = "HI=500";
export const DEFAULT_RMF_DDS_OPTIONS: RmfDdsOptions = {
  protocol      : "http",
  host          : "localhost",
  port          : 8803,
  performFilter : DEFAULT_RMF_PERFORM_FILTER,
};

export const DEFAULT_RMF_DDS_METRICS: {[key: string]: string[]} = {
  cpu: ['PROCESSOR.8D49E0'],
  cpupr: ['PROCESSOR.8D0460', 'PROCESSOR.8D3450'],
};
