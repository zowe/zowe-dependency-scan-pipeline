/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import BaseMetricsCollector from "./base";
import { MetricsCollectorOptions } from "../types";
import { sleep } from "../utils";

export default class ZMSMetricsCollector extends BaseMetricsCollector {
  protected _host: string;
  protected _available: boolean;

  constructor(options: MetricsCollectorOptions) {
    super(options);
  }

  async poll(): Promise<any> {
    console.log('poll start', new Date().toISOString());
    await sleep(300);
    console.log('poll end', new Date().toISOString());
  }
};
