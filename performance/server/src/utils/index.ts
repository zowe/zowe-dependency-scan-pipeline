/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { exec, ExecOptions } from "child_process";

/**
 * Sleep for certain time
 * @param {Integer} ms 
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * Execute shell command
 * @param cmd       shell command
 */
export const execPromise = (cmd: string, options?: ExecOptions): Promise<{stdout: string, stderr: string}> => {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        const result = { stdout, stderr };
        resolve(result);
      }
    });
  });
};
