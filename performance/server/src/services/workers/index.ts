/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import ZMSShellWorker from "./shell";

// eslint-disable-next-line
export const ZMSWorkers: {[key: string]: any} = {
  shell: ZMSShellWorker,
};

export { default as ZMSBaseWorker } from "./base";
export { default as ZMSShellWorker } from "./shell";
