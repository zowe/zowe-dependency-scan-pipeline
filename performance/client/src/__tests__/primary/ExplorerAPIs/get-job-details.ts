/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import got from "got";
import WrkTestCase from "../../../testcase/wrk";
import { getBasicAuthorizationHeader, getBasicAuthorizationHeaderValue } from "../../../utils";

class ExplorerApiJobDetailsTest extends WrkTestCase {
  fetchZoweVersions = true;
  name = "Test explorer data sets api endpoint /api/v2/jobs/{jobName}/{jobId}";
  endpoint = '/api/v2/jobs/SDSF/STC01060';

  duration = 5;
  concurrency = 10;
  threads = 1;
  debug = true;

  async before(): Promise<void> {
    await super.before();

    try{
      const url = `https://${this.targetHost}:${this.targetPort}/api/v2/jobs?prefix=SDSF*&status=ACTIVE`;
      console.log("calling: " + url);
    
      //let authHeader = getBasicAuthorizationHeader();

      console.log("calling: " + url);
      const response =  await got(url, {
        https: {
          rejectUnauthorized: false
        },
        headers: {
          "Authorization": getBasicAuthorizationHeaderValue()
        }
      });
      console.log("res: " + response.body);
    } catch (e) {
      console.log('e: ' + e);
      console.log('error: ' + e.response.body);
    }
   
    this.headers.push(getBasicAuthorizationHeader());
 
  }
}

new ExplorerApiJobDetailsTest().init();
