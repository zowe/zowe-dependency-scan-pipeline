/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { spawn, SpawnOptionsWithoutStdio } from "child_process";

export interface ChildProcessResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export default class ChildProcessException extends Error {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Execute a command in a chile process with spawn and return a promise.
 *
 * @param command
 * @param args 
 * @param options 
 */
export const spawnPromise = (command: string, args: string[], options?: SpawnOptionsWithoutStdio): Promise<ChildProcessResult> => {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, options);
    const result: ChildProcessResult = {
      exitCode: -1,
      stdout: "",
      stderr: "",
    };
    
    proc.stdout.on('data', (data) => {
      result.stdout += data;
    });
    
    proc.stderr.on('data', (data) => {
      result.stderr += data;
    });
    
    proc.on('close', (code) => {
      result.exitCode = code;

      if (code !== 0) {
        const e = new ChildProcessException(`Child process exits with code ${code}`);
        e.exitCode = code;
        e.stdout = result.stdout;
        e.stderr = result.stderr;
        reject(e);
      } else {
        resolve(result);
      }
    });
  });
};
