/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { Options } from "got";
import PerformanceTestException from "../exceptions/performance-test-exception";
import { GotHttpResponse, JesCheckpointSpace, JesPurgeJobOutputResponse, JesSpoolStatus, JesSystemActivity } from "../types";
import { DEFAULT_JES_MINIMAL_FREE_BERTS_PERCENT, DEFAULT_JES_MINIMAL_FREE_SPOOL_PERCENT, DEFAULT_JES_MINIMAL_FREE_TS_USERS_PERCENT } from "../constants";
import { getBasicAuthorizationHeaderValue, httpRequest } from "../utils";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:zosmf-utils');

/**
 * Parse key/value pairs from string
 *
 * Example:
 * - Input: A=v1,B=v2
 * - Output: { A: 'v1', B: 'v2' }
 *
 * @param str
 */
const parseProps = (str: string): { [key: string]: string } => {
  const props: { [key: string]: string } = {};

  str.split(',').forEach(prop => {
    prop = prop.trim();

    const eqIndex = prop.indexOf('=');
    if (eqIndex > -1) {
      const key = prop.substr(0, eqIndex);
      props[key] = prop.substr(eqIndex + 1);
    }
  });

  return props;
};

/**
 * Make z/OSMF Restful API request
 *
 * @param path
 * @param options 
 * @param zOSMFHost 
 * @param zOSMFPort 
 */
export const zOSMFRequest = async (path: string, options?: Options): Promise<GotHttpResponse> => {
  const zOSMFHost = process.env.ZOSMF_HOST || process.env.TARGET_HOST;
  const zOSMFPort = (process.env.ZOSMF_PORT && parseInt(process.env.ZOSMF_PORT, 10)) || 443;
  const zOSMFUser = process.env.ZOSMF_AUTH_USER || process.env.TEST_AUTH_USER;
  const zOSMFPassword = process.env.ZOSMF_AUTH_PASSWORD || process.env.TEST_AUTH_PASSWORD;

  if (!options) {
    options = {};
  }
  if (!options.headers) {
    options.headers = {
      'Authorization': getBasicAuthorizationHeaderValue(zOSMFUser, zOSMFPassword),
      'X-CSRF-ZOSMF-HEADER': '*'
    };
  }

  return httpRequest(zOSMFHost, zOSMFPort, path, options);
};

/**
 * Run TSO command with z/OSMF console API
 *
 * @param command
 * @param console 
 */
export const tsoCommand = async (command: string, console?: string): Promise<string> => {
  const { body } = await zOSMFRequest(
    `/zosmf/restconsoles/consoles/${console? console : 'defcn'}`,
    {
      method: 'PUT',
      json: {
        cmd: command,
      }
    }
  );

  if (body['cmd-response']) {
    return body['cmd-response'];
  } else if (body['reason']) {
    throw new PerformanceTestException(`TSO command "${command}" failed with (return code ${body['return-code']}, reason code ${body['reason-code']}): "${body['reason']}"`);
  } else {
    throw new PerformanceTestException(`TSO command "${command}" failed with unknown reason: "${JSON.stringify(body)}"`);
  }
};

/**
 * Return JES2 Spool Status ($DSPL,LONG)
 */
export const getJesSpoolStatus = async (): Promise<JesSpoolStatus> => {
  const text = await tsoCommand('$DSPL,LONG');
  /**
   * Exampple response:

    $HASP893 VOLUME(V31011)                                       
    $HASP893 VOLUME(V31011)  STATUS=ACTIVE,DSNAME=SYS1.HASPACE,   
    $HASP893                 SYSAFF=(ANY),TGNUM=15000,TGINUSE=473,
    $HASP893                 TRKPERTGB=3,PERCENT=3,RESERVED=NO,   
    $HASP893                 MAPTARGET=NO                         
    $HASP646 3.1533 PERCENT SPOOL UTILIZATION       
   */

  const lines = text.split(/\n|\r/);
  const response: JesSpoolStatus = {
    utilization: null,
    volumes: Object.create({}),
  };
  let currentVolume: string;
  lines.forEach(line => {
    line = line.trim();
    let m;

    if (m = line.match(/^\$HASP893 VOLUME\(([^)]+)\)\s+(.+)$/)) {
      currentVolume = m[1];
      response.volumes[currentVolume] = {
        ...response.volumes[currentVolume],
        ...parseProps(m[2])
      };
    } else if (m = line.match(/^\$HASP893(.+)$/)) {
      if (currentVolume) {
        response.volumes[currentVolume] = {
          ...response.volumes[currentVolume],
          ...parseProps(m[1])
        };
      }
    } else if (m = line.match(/^\$HASP646 (.+) PERCENT SPOOL UTILIZATION/)) {
      response.utilization = parseFloat(m[1]);
    }
  });

  return response;
};

/**
 * Return JES2 Checkpoint Space ($DCKPTSPACE)
 */
export const getJesCheckpointSpace = async (): Promise<JesCheckpointSpace> => {
  const text = await tsoCommand('$DCKPTSPACE');
  /**
   * Exampple response:

    RESPONSE=VM30101                                               
    $HASP852 CKPTSPACE                                            
    $HASP852 CKPTSPACE  BERTNUM=3500,BERTFREE=3287,BERTWARN=80,   
    $HASP852            CKPT1=(CAPACITY=888,UNUSED=480,TRACKS=75),
    $HASP852            CKPT2=(CAPACITY=888,UNUSED=480,TRACKS=75) 
   */

  const lines = text.split(/\n|\r/);
  const response: JesCheckpointSpace = {
    bertNum: null,
    bertFree: null,
    bertWarn: null,
    checkpoints: Object.create({}),
  };
  lines.forEach(line => {
    line = line.trim();
    let m;

    if (m = line.match(/^\$HASP852 CKPTSPACE\s+(.+)$/)) {
      const props = parseProps(m[1]);
      if (props['BERTNUM']) {
        response.bertNum = parseInt(props['BERTNUM'], 10);
      }
      if (props['BERTFREE']) {
        response.bertFree = parseInt(props['BERTFREE'], 10);
      }
      if (props['BERTWARN']) {
        response.bertWarn = parseInt(props['BERTWARN'], 10);
      }
    } else if (m = line.match(/^\$HASP852\s+(.+)=\((.+)\),?$/)) {
      response.checkpoints[m[1]] = parseProps(m[2]);
    }
  });

  return response;
};

/**
 * Return system activity (JOBS)
 */
export const getSystemActivity = async (): Promise<JesSystemActivity> => {
  // would like to run D TS,ALL to list all TSO address spaces
  // then we can possibly delete TSO address spaces created by RESTful APIs
  // so far P=2 seems generated by API, and P=1 seems from TN3270
  // but not 100% sure
  const text = await tsoCommand('D TS');
  /**
    CNZ4106I 11.55.46 DISPLAY ACTIVITY 758
      JOBS     M/S    TS USERS    SYSAS    INITS   ACTIVE/MAX VTAM     OAS
    00034    00019    00002      00032    00040    00001/00300       00050
    IBMUSER  OWT     A=0049   PER=NO   SMC=000  PGN=N/A  DMN=N/A  AFF=NONE
                      CT=000.058S  ET=02.51.19
                      WUID=TSU00636
                      WKL=TSO      SCL=TSOCMD   P=1
                      RGP=N/A      SRVR=NO  QSC=NO
    IBMUSER  IN   O  A=0089   PER=NO   SMC=000  PGN=N/A  DMN=N/A  AFF=NONE
                      CT=000.096S  ET=000.664S
                      WUID=TSU00641
                      WKL=TSO      SCL=TSOCMD   P=2
                      RGP=N/A      SRVR=NO  QSC=NO
   */

  const lines = text.split(/\n|\r/);
  const response: JesSystemActivity = {
    jobs: null,
    startedTasks: null,
    tsUsers: null,
    tsUsersUnderTso: null,
    maxTsUsersUnderTso: null,
    systemAddressSpaces: null,
    initiators: null,
    ussAddressSpaces: null,
  };
  let checkNextLine = false;
  lines.forEach(line => {
    line = line.trim();
    let m;

    if (line.match(/^JOBS\s+M\/S\s+TS\s+USERS\s+SYSAS\s+INITS\s+ACTIVE\/MAX\s+VTAM\s+OAS$/)) {
      checkNextLine = true
    } else if (checkNextLine) {
      if (m = line.match(/^([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\/([0-9]+)\s+([0-9]+)$/)) {
        response.jobs = parseInt(m[1], 10);
        response.startedTasks = parseInt(m[2], 10);
        response.tsUsers = parseInt(m[3], 10);
        response.systemAddressSpaces = parseInt(m[4], 10);
        response.initiators = parseInt(m[5], 10);
        response.tsUsersUnderTso = parseInt(m[6], 10);
        response.maxTsUsersUnderTso = parseInt(m[7], 10);
        response.ussAddressSpaces = parseInt(m[8], 10);
      }
    }
  });

  return response;
};

/**
 * Validate if BERTs is big enough to start test
 *
 * @param threshold 
 */
export const validateFreeBerts = async (threshold?: number): Promise<void> => {
  if (!threshold) {
    threshold = (process.env.JES_MINIMAL_FREE_BERTS_PERCENT && parseInt(process.env.JES_MINIMAL_FREE_BERTS_PERCENT, 10)) || DEFAULT_JES_MINIMAL_FREE_BERTS_PERCENT;
  }
  debug(`JES BERTs free threshold: ${threshold}`);

  const ckpt = await getJesCheckpointSpace();
  if (ckpt.bertNum) {
    const free = (ckpt.bertFree / ckpt.bertNum) * 100;
    debug(`BERTs (free/num = %): ${ckpt.bertFree}/${ckpt.bertNum} = ${free}%`);
    if (free < threshold) {
      throw new PerformanceTestException(`Not enough JES BERTs (${ckpt.bertFree}/${ckpt.bertNum}) to start test`);
    }
  } else {
    debug('WARNING: unable to determine BERTNUM');
  }
};

/**
 * Validate if JES Spool is big enough to start test
 *
 * @param threshold 
 */
export const validateJesSpool = async (threshold?: number): Promise<void> => {
  if (!threshold) {
    threshold = (process.env.JES_MINIMAL_FREE_SPOOL_PERCENT && parseInt(process.env.JES_MINIMAL_FREE_SPOOL_PERCENT, 10)) || DEFAULT_JES_MINIMAL_FREE_SPOOL_PERCENT;
  }
  debug(`JES Spool free threshold: ${threshold}`);

  const spool = await getJesSpoolStatus();
  if (spool.utilization) {
    debug(`JES Spool utilization: ${spool.utilization}%`);
    const free = 100 - spool.utilization;
    if (free < threshold) {
      throw new PerformanceTestException(`Not enough JES Spool (${spool.utilization}% utilization) to start test`);
    }
  } else {
    debug('WARNING: unable to determine JES spool utilization');
  }
};

/**
 * Validate if free time-sharing users are big enough to start test
 *
 * @param threshold 
 */
export const validateTsUsers = async (threshold?: number): Promise<void> => {
  if (!threshold) {
    threshold = (process.env.JES_MINIMAL_FREE_TS_USERS_PERCENT && parseInt(process.env.JES_MINIMAL_FREE_TS_USERS_PERCENT, 10)) || DEFAULT_JES_MINIMAL_FREE_TS_USERS_PERCENT;
  }
  debug(`Free time-sharing users threshold: ${threshold}`);

  const sa = await getSystemActivity();
  if (sa.tsUsers && sa.maxTsUsersUnderTso) {
    debug(`Time-sharing users: ${sa.tsUsers}`);
    debug(`Time-sharing users under TSO/VTAM: ${sa.tsUsersUnderTso}`);
    debug(`Max time-sharing users under TSO/VTAM: ${sa.maxTsUsersUnderTso}`);
    const free = ((sa.maxTsUsersUnderTso - sa.tsUsers) * 100) / sa.maxTsUsersUnderTso;
    if (free < threshold) {
      throw new PerformanceTestException(`Not enough free time-sharing users (${sa.tsUsers}/ ${sa.maxTsUsersUnderTso}) to start test`);
    }
  } else {
    debug('WARNING: unable to determine free time-sharing users');
  }
};

/**
 * Purge JES2 Job Outputs ($PO ${jobClass}1-9999)
 */
export const purgeJobOutputs = async (jobClass = 'TSU'): Promise<JesPurgeJobOutputResponse> => {
  const text = await tsoCommand(`$PO ${jobClass}1-9999`);
  /**
   * Exampple response:

    $HASP690 COMMAND REJECTED - SOURCE OF COMMAND HAS IMPROPER AUTHORITY

    $HASP686 OUTPUT(IBMUSER)   OUTGRP=1.1.1 CANCELLED

    $HASP003 RC=(57),PO
    $HASP003 RC=(57),PO TSU1-9999  - DISPLAY TERMINATED DUE
    $HASP003            TO EXCESSIVE OUTPUT (AS DEFINED BY
    $HASP003            CONDEF DISPMAX)

    $HASP003 RC=(52),PO
    $HASP003 RC=(52),PO TSU1-9999  - NO SELECTABLE ENTRIES FOUND
    $HASP003            MATCHING SPECIFICATION
   */

  const lines = text.split(/\n|\r/);
  const response: JesPurgeJobOutputResponse = {
    count: 0,
    rc: null,
    message: '',
  };
  lines.forEach(line => {
    line = line.trim();
    let m;

    if (m = line.match(/^\$HASP690\s+(.+)$/)) {
      throw new PerformanceTestException(`Purge job ${jobClass} failed: ${m[1]}`);
    } else if (m = line.match(/^\$HASP686\s+(.+)$/)) {
      response.count++;
    } else if (m = line.match(/^\$HASP003\s+RC=\(([0-9]+)\),(.+)  - (.+)$/)) {
      response.rc = parseInt(m[1], 10);
      response.message += m[3];
    } else if (m = line.match(/^\$HASP003\s+(.+)$/)) {
      if (!m[1].trim().startsWith('RC=')) {
        response.message += ' ' + m[1].trim();
      }
    }
  });

  return response;
};

/**
 * Purge JES job output without throwing any errors
 *
 * @param jobClass 
 */
export const purgeJobOutputsWithoutFailure = async (jobClass = 'TSU'): Promise<JesPurgeJobOutputResponse> => {
  try {
    return await purgeJobOutputs(jobClass);
  } catch (e) {
    debug(`Purge job failed: ${e}`);
  }
};
