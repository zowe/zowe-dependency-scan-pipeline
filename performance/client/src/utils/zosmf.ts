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
import { PerformanceTestException } from "..";
import { GotHttpResponse, JesCheckpointSpace, JesPurgeJobOutputResponse, JesSpoolStatus } from "../types";
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
export const zOSMFRequest = async (path: string, options?: Options, zOSMFHost?: string, zOSMFPort?: number): Promise<GotHttpResponse> => {
  if (!zOSMFHost) {
    zOSMFHost = process.env.ZOSMF_HOST || process.env.TARGET_HOST;
  }
  if (!zOSMFPort) {
    zOSMFPort = (process.env.ZOSMF_PORT && parseInt(process.env.ZOSMF_PORT, 10)) || 443;
  }

  if (!options) {
    options = {};
  }
  if (!options.headers) {
    options.headers = {
      'Authorization': getBasicAuthorizationHeaderValue(),
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

  return body['cmd-response'];
};

/**
 * Return JES2 Spool Status
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
    percent: null,
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
      response.percent = parseFloat(m[1]);
    }
  });

  return response;
};

/**
 * Return JES2 Checkpoint Space
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
 * Purge JES2 Job Outputs
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
