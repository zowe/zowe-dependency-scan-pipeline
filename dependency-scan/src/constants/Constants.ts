/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import * as path from "path";
import { Utilities } from "../utils/Utilities";

export class Constants {

    public static readonly LICENSE_FINDER_DIR: string = path.resolve(__dirname, '../../../', 'LicenseFinder');

    public static readonly BASE_WORK_DIR: string = path.join(".", "build");

    public static readonly BUILD_RESOURCES_DIR: string = path.join(Constants.BASE_WORK_DIR, "resources");

    public static readonly SOURCE_RESOURCES_DIR: string = path.join(".", "resources");

    public static readonly CLONE_DIR: string = path.join(Constants.BASE_WORK_DIR, "clone_repositories");

    public static readonly LOG_DIR: string = path.join(Constants.BASE_WORK_DIR, "logs");

    public static readonly LICENSE_REPORTS_DIR: string = path.join(Constants.BASE_WORK_DIR, "license_reports");

    public static readonly OWASP_REPORTS_DIR: string = path.join(Constants.BASE_WORK_DIR, "owasp_reports");

    public static readonly ZOWE_MANIFEST_PATH: string = path.join(Constants.BUILD_RESOURCES_DIR, "zowe-manifest.json");

    public static readonly REPO_RULE_PATH: string = path.join(".", "resources", "repoRules.json");

    public static readonly DEPENDENCY_DECISIONS_YAML: string = path.join(Constants.BUILD_RESOURCES_DIR, "dependency_decisions.yml");

    public static readonly SCAN_AGGREGATE_REPORT_FILE: string = path.join(Constants.LICENSE_REPORTS_DIR,
        "dependency_approval_action_aggregates.json");

    public static readonly PARALLEL_CLONE_COUNT: number = 4;

    public static readonly PARALLEL_INSTALL_COUNT: number = 6;

    public static readonly PARALLEL_SCAN_COUNT: number = 1;

    public static readonly PARALLEL_REPORT_COUNT: number = 1;

    public static readonly CLEAN_REPO_DIR_ON_START: boolean = true;

    public static readonly CLEAN_LOGS_ON_START: boolean = true;

    public static readonly APP_LICENSE_SCAN: boolean = Utilities.getExclusiveEnv("APP_LICENSE_SCAN", "APP_OWASP_SCAN", true);

    public static readonly APP_OWASP_SCAN: boolean = Utilities.getEnv("APP_OWASP_SCAN", false);

    public static readonly OWASP_CLI_BIN_PATH: string = Utilities.getEnvStr("OWASP_CLI_BIN_PATH", "~/dependency-check");

    // Typical flow: get metadata, clone, perform installs, run scans, generate reports
    // set steps to false to skip them (partial runs)
    // If you skip step (n), you should skip all (n-1, n-2, etc.) steps.

    // only change if re-running builds / modifying manifest or other metadata locally
    public static readonly DOWNLOAD_MANIFEST: boolean = Utilities.getEnv("ZOWE_DL_MANIFEST", true);

    public static readonly ZOWE_MANIFEST_BRANCH: string = Utilities.getEnvStr("ZOWE_MANIFEST_BRANCH", "staging");

    public static readonly EXEC_CLONE: boolean = Utilities.getEnv("ZOWE_STEP_CLONE", true);

    public static readonly EXEC_INSTALLS: boolean = Utilities.getEnv("ZOWE_STEP_INSTALL", true);

    public static readonly EXEC_SCANS: boolean = Utilities.getEnv("ZOWE_STEP_SCAN", true);

    public static readonly EXEC_REPORTS: boolean = Utilities.getEnv("ZOWE_STEP_REPORT", true);

    public static readonly SCAN_INDIVIDUALS: boolean = Utilities.getEnv("ZOWE_SCAN_INDIVIDUAL", true);

    public static readonly SCAN_AGGREGATE: boolean = Utilities.getEnv("ZOWE_SCAN_AGGREGATE", true);
}
