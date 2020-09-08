/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import PerformanceTestException from "../exceptions/performance-test-exception";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:wrk-parser');

/**
 * Convert time with unit to seconds
 *
 * For example, convertTimeUnit('2m') returns 120
 *
 * @param tu     time with unit
 */
const convertTimeUnit = (tu: string): number => {
  let result: number;
  const m = tu.match(/([0-9\.]+)([a-zA-Z]*)/);
  const factors: {[key: string]: number} = {
    s: 1,
    ms: 0.001,
    us: 0.000001,
    ns: 0.000000001,
    m: 60,
    h: 3600,
    d: 86400,
  };
  if (m) {
    const unit = m[2].toLowerCase();
    result = parseFloat(m[1]) * factors[unit];
  } else {
    throw new PerformanceTestException(`Invalid time unit ${tu}`);
  }

  return result;
};

/**
 * Convert transfer with unit to bytes
 *
 * For example, convertTimeUnit('12.3KB') returns 12595.2
 *
 * @param tu     transfer with unit
 */
const convertTransferUnit = (tu: string): number => {
  let result: number;
  const m = tu.match(/([0-9\.]+)([a-zA-Z]*)/);
  const factors: {[key: string]: number} = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
    tb: 1024 * 1024 * 1024 * 1024,
  };
  if (m) {
    const unit = m[2].toLowerCase();
    result = parseFloat(m[1]) * factors[unit];
  } else {
    throw new PerformanceTestException(`Invalid transfer unit ${tu}`);
  }

  return result;
};

/**
 * Parse WRK test result
 * @param stdout       stdout of wrk
 */
export const parseWrkStdout = (stdout: string): {[key: string]: unknown} => {
  const result: {[key: string]: unknown} = {};

  /* stdout examples:

Running 15s test @ https://zzow02.zowe.marist.cloud:7554/api/v1/datasets/ZOWEAD3.PERF.TEST(PURGEJOB)/content
  1 threads and 10 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.24s   535.19ms   3.16s    67.52%
    Req/Sec     8.40      5.09    29.00     81.43%
  Latency Distribution
     50%    1.19s 
     75%    1.46s 
     90%    1.95s 
     99%    2.91s 
  114 requests in 15.04s, 128.58KB read
Requests/sec:      7.58
Transfer/sec:      8.55KB

Running 15s test @ https://zzow01.zowe.marist.cloud:7554/api/v1/datasets/ZOWEAD3.PERF.TEST(PURGEJOB)/content
  1 threads and 10 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     0.00us    0.00us   0.00us    -nan%
    Req/Sec     0.00      0.00     0.00      -nan%
  Latency Distribution
     50%    0.00us
     75%    0.00us
     90%    0.00us
     99%    0.00us
  0 requests in 15.04s, 0.00B read
Requests/sec:      0.00
Transfer/sec:       0.00B

Running 15s test @ https://zzow02.zowe.marist.cloud:7554/api/v1/datasets/ZOWEAD3.PERF.TEST(PURGEJOB)/content
  1 threads and 10 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    36.60ms    5.13ms  81.35ms   82.82%
    Req/Sec   263.06     51.93   330.00     84.25%
  Latency Distribution
     50%   35.72ms
     75%   38.26ms
     90%   42.01ms
     99%   54.36ms
  3888 requests in 14.99s, 2.09MB read
  Non-2xx or 3xx responses: 3888
Requests/sec:    259.39
Transfer/sec:    142.91KB
  */

  const lines = stdout.split("\n");
  lines.forEach(line => {
    line = line.trim();
    let m;

    if (m = line.match(/^Running ([0-9]+[a-zA-Z]*) test @ (.+)$/)) {
      result["duration"] = convertTimeUnit(m[1]);
      result["url"] = m[2];
    } else if (m = line.match(/^([0-9]+) threads and ([0-9]+) connections$/)) {
      result["threads"] = parseInt(m[1], 10);
      result["connections"] = parseInt(m[2], 10);
    } else if (m = line.match(/^Latency\s+([0-9\.]+[a-zA-Z]*)\s+([0-9\.]+[a-zA-Z]*)\s+([0-9\.]+[a-zA-Z]*)\s+([0-9\.a-z\-%]+)$/)) {
      result["thread_latency"] = {
        average: convertTimeUnit(m[1]),
        stdev: convertTimeUnit(m[2]),
        max: convertTimeUnit(m[3]),
        stdevRange: m[4],
      };
    } else if (m = line.match(/^Req\/Sec\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.a-z\-%]+)$/)) {
      result["thread_requests_per_second"] = {
        average: parseFloat(m[1]),
        stdev: parseFloat(m[2]),
        max: parseFloat(m[3]),
        stdevRange: m[4],
      };
    } else if (m = line.match(/^([0-9]{2}%)\s+([0-9\.]+[a-zA-Z]*)$/)) {
      if (!result["latency_distribution"]) {
        result["latency_distribution"] = {};
      }
      Object.defineProperty(result["latency_distribution"], m[1], { value: convertTimeUnit(m[2]) });
    } else if (m = line.match(/^([0-9]+) requests in ([0-9\.]+[a-zA-Z]*), ([0-9\.]+[a-zA-Z]*) read$/)) {
      result["total_requests"] = parseInt(m[1], 10);
      result["total_time"] = convertTimeUnit(m[2]);
      result["total_transfer"] = convertTransferUnit(m[3]);
    } else if (m = line.match(/^Non-2xx or 3xx responses:\s+([0-9]+)$/)) {
      result["failed_requests"] = parseInt(m[1], 10);
    } else if (m = line.match(/^Requests\/sec:\s+([0-9\.]+)$/)) {
      result["requests_per_second"] = parseFloat(m[1]);
    } else if (m = line.match(/^Transfer\/sec:\s+([0-9\.]+[a-zA-Z]*)$/)) {
      result["bytes_per_second"] = convertTransferUnit(m[1]);
    } else if (line.match(/\[debug\]/) ||
      line === 'Thread Stats   Avg      Stdev     Max   +/- Stdev' ||
      line === 'Latency Distribution') {
      // skip some known lines we can ignore
    } else if (line != '') {
      debug('Unrecognized or redundant WRK response line:', line);
    }
  });

  return result;
};
