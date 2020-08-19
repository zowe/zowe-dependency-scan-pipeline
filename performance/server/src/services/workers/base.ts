/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { schedule, ScheduledTask } from "node-cron";
import { ZMSWorkerOptions } from "../../types";
import logger from "../logger";

export default class ZMSBaseWorker {
  protected name: string;
  protected options: ZMSWorkerOptions;
  protected _cronTask: ScheduledTask; 

  constructor(name: string, options: ZMSWorkerOptions) {
    this.name = name;
    this.options = options;
    logger.silly("initialized worker with options: %j", this.options);
  }

  async prepare(): Promise<void> {
    this._cronTask = schedule(`*/${this.options.interval} * * * * *`, async () => {
      await this.poll();
    }, {
      scheduled: false
    });
  }

  async start(): Promise<void> {
    this._cronTask.start();
  }

  async destroy(): Promise<void> {
    this._cronTask.destroy();
  }

  async poll(): Promise<void> {
    // dummy poll method
  }
}
