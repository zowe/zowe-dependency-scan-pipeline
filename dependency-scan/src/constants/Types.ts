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

export const TYPES = {
    // Application Wide
    App: Symbol("ScanApplication"),
    Logger: Symbol("Logger"),

    // Manifest, Metadata, and related help
    ZoweManifest: Symbol("ZoweManifest"),
    DependencyDecision: Symbol("DependencyDecision"),
    RepoRules: Symbol("RepositoryRules"),
    RepoRulesData: Symbol("RepositoryRulesData"),

    // Actions
    CloneAction: Symbol("CloneAction"),
    InstallAction: Symbol("InstallAction"),
    LicenseScanAction: Symbol("LicenseScanAction"),
    LicenseReportAction: Symbol("LicenseReportAction"),
    OwaspScanReportAction: Symbol("OwaspScanAction"),
    OwaspPublishAction: Symbol("OwaspPublishAction")
};
