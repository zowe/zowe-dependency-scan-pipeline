/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { ZMSWorkerOptions, PartialZMSWorkerOptions } from "../../types";
import { DEFAULT_WORKER_OPTIONS } from "../../constants";
import logger from "../logger";

export default class ZMSBaseWorker {
  protected name: string;
  protected options: ZMSWorkerOptions;
  protected _timer: NodeJS.Timeout;

  constructor(name: string, options?: PartialZMSWorkerOptions) {
    this.name = name;
    this.options = Object.assign({}, DEFAULT_WORKER_OPTIONS, options);
    logger.silly("initialized worker with options: %j", this.options);
  }

  async prepare(): Promise<void> {
    // dummy prepare method
  }

  async start(): Promise<void> {
    // start right away
    setTimeout(async () => {
      await this.poll();
    }, 0);

    // define scheduler
    this._timer = setInterval(async() => {
      await this.poll();
    }, this.options.interval * 1000);
  }

  async destroy(): Promise<void> {
    clearInterval(this._timer);
  }

  async poll(): Promise<void> {
    // dummy poll method
  }
}
