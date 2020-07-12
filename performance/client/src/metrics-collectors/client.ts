/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import * as fs from "fs";
import BaseMetricsCollector from "./base";
import { MetricsCollectorOptions } from "../types";

export default class ClientMetricsCollector extends BaseMetricsCollector {
  constructor(options: MetricsCollectorOptions) {
    super(options);
  }
 
  async poll(): Promise<any> {
    const resourceUsage: NodeJS.ResourceUsage = process.resourceUsage();
    const ts = new Date().getTime();
    const content = [];
    content.push(`- timestamp: ${ts}`);
    content.push(`  name: userCPUTime`);
    content.push(`  value: ${resourceUsage.userCPUTime}`);
    content.push(`- timestamp: ${ts}`);
    content.push(`  name: systemCPUTime`);
    content.push(`  value: ${resourceUsage.systemCPUTime}`);
    fs.writeFileSync(this._options.cacheFile, content.join("\n") + "\n", { flag: "a" });
  }
};
// fsRead: number;
// fsWrite: number;
// involuntaryContextSwitches: number;
// ipcReceived: number;
// ipcSent: number;
// majorPageFault: number;
// maxRSS: number;
// minorPageFault: number;
// sharedMemorySize: number;
// signalsCount: number;
// swappedOut: number;
// systemCPUTime: number;
// unsharedDataSize: number;
// unsharedStackSize: number;
// userCPUTime: number;
// voluntaryContextSwitches: number;
