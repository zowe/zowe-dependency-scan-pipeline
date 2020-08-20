/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { MetricWorkerResultItem } from "../../types";

const convertToOpenMetrics = (workerName: string, metricsRawResult: MetricWorkerResultItem[], timestamp?: Date): string => {
  if (!timestamp) {
    timestamp = new Date();
  }

  const result: string[] = [];

  for (const item of metricsRawResult) {
    let name = item.key.toLowerCase();
    const labels = [ `source="${workerName}"` ];
    for (const xk of Object.keys(item)) {
      if (xk !== 'key' && xk !== 'value') {
        labels.push(xk + '="' + item[xk] + '"');
      }
    }
    if (labels.length > 0) {
      name += '{' + labels.join(',') + '}'
    }

    result.push([
      name,
      item.value,
      timestamp.getTime(),
    ].join(' '));
  }

  return result.join("\n");
};

export default convertToOpenMetrics;
