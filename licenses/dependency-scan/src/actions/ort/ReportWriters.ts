/*
 Defines how we organize reports by componentGroup or destinations in manifest.json

 This produces a fixed number of sbom and license reports, which need to be manually entered at this time into the 
  github action in order to publish them to Artifactory.

 */

import path = require("path");
import { Constants } from "../../constants/Constants";
import * as fs from 'fs-extra';

export class ReportWriters {

    private static readonly SBOM_AGG_REPORT = path.resolve(Constants.SBOM_REPORTS_DIR, "sbom_aggregate.spdx.yml");
    private static readonly SBOM_CLI_REPORT = path.resolve(Constants.SBOM_REPORTS_DIR, "sbom_cli.spdx.yml");
    private static readonly SBOM_VSCODE_REPORT = path.resolve(Constants.SBOM_REPORTS_DIR, "sbom_vscode.spdx.yml");
    private static readonly SBOM_ZOS_REPORT = path.resolve(Constants.SBOM_REPORTS_DIR, "sbom_zos.spdx.yml");
    private static readonly SBOM_PYTHON_REPORT = path.resolve(Constants.SBOM_REPORTS_DIR, "sbom_pythonsdk.spdx.yml");

    private static readonly NOTICES_AGG = path.join(Constants.NOTICE_REPORTS_DIR, "notices_aggregate.txt");
    private static readonly NOTICES_CLI = path.join(Constants.NOTICE_REPORTS_DIR, "notices_cli.txt");
    private static readonly NOTICES_VSCODE = path.join(Constants.NOTICE_REPORTS_DIR, "notices_vscode.txt");
    private static readonly NOTICES_ZOS = path.join(Constants.NOTICE_REPORTS_DIR, "notices_zos.txt");
    private static readonly NOTICES_PYTHON = path.join(Constants.NOTICE_REPORTS_DIR, "notices_pythonsdk.txt");

    public static sbomReporters: ((componentGroup: string, core: boolean, sbomFilePath: string) => void)[] = [
        (c,co, s) => { if(co) { fs.appendFileSync(ReportWriters.SBOM_AGG_REPORT, fs.readFileSync(s).toString())}}, // "core projects -> all"
        (c,co, s) => { if (c.includes("CLI")) { fs.appendFileSync(ReportWriters.SBOM_CLI_REPORT, fs.readFileSync(s).toString()) }}, // "cli"
        (c,co, s) => { if (c.includes("Visual Studio Code")) { fs.appendFileSync(ReportWriters.SBOM_VSCODE_REPORT, fs.readFileSync(s).toString()) }}, // "vscode"
        (c,co, s) => { if (c.includes("PAX")) { fs.appendFileSync(ReportWriters.SBOM_ZOS_REPORT, fs.readFileSync(s).toString()) }}, // "zos"
        (c,co, s) => { if (c.includes("Python")) { fs.appendFileSync(ReportWriters.SBOM_PYTHON_REPORT, fs.readFileSync(s).toString()) }}, // "zos"
    ]

    public static noticeReporters: ((componentGroup: string, core: boolean, noticeFile: string) => void)[] = [
        (c, co, n) => { if (co) { fs.appendFileSync(ReportWriters.NOTICES_AGG, fs.readFileSync(n).toString())}},
        (c, co, n) => { if (c.includes("CLI")) { fs.appendFileSync(ReportWriters.NOTICES_CLI, fs.readFileSync(n).toString())}},
        (c, co, n) => { if (c.includes("Visual Studio Code")) { fs.appendFileSync(ReportWriters.NOTICES_VSCODE, fs.readFileSync(n).toString())}},
        (c, co, n) => { if (c.includes("PAX")) { fs.appendFileSync(ReportWriters.NOTICES_ZOS, fs.readFileSync(n).toString())}},
        (c, co, n) => { if (c.includes("Python")) { fs.appendFileSync(ReportWriters.NOTICES_PYTHON, fs.readFileSync(n).toString())}}
    ]


}