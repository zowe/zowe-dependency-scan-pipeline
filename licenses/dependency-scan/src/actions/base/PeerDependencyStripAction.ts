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

import * as fs from "fs";
import { injectable } from "inversify";
import * as path from "path";
import "reflect-metadata";
import { Constants } from "../../constants/Constants";
import { Utilities } from "../../utils/Utilities";
import { IAction } from "../IAction";

const SKIPPED_DIRS = new Set(["node_modules", ".git"]);

/**
 * ORT's NPM analyzer builds a project's production "dependencies" scope from the `dependencies`,
 * `optionalDependencies` *and* `peerDependencies` of its package.json. Zowe CLI plug-ins declare `@zowe/imperative`
 * as a peer dependency (it's supplied by the host CLI at runtime) and also as a devDependency (so it's installed for
 * building/testing) - so it's always installed, and ORT then attributes it and its entire dependency tree to the
 * plug-in's production scope, where the "devDependencies" scope exclude can't reach it.
 *
 * A first-party package's peer dependencies are by definition provided by the consumer, never shipped with it, so
 * this strips `peerDependencies` (and `peerDependenciesMeta`) from every first-party package.json that ORT will
 * analyze with NPM before the analyzer runs. Anything that's also a devDependency stays in the (excluded)
 * devDependencies scope; anything that's also a real dependency stays in the production scope.
 *
 * The lockfile is left untouched: `npm ci` only requires that the ideal tree built from package.json is a subset of
 * the lockfile, which dropping edges from package.json can't violate. pnpm, Yarn and Bun projects are skipped - their
 * ORT analyzers don't treat peers as production dependencies, and pnpm's frozen-lockfile check also covers peers.
 */
@injectable()
export class PeerDependencyStripAction implements IAction {

    public run(): Promise<boolean> {
        Utilities.getSubDirs(Constants.CLONE_DIR).forEach((projectDir) => {
            const debugTag = `[peer-dependency-strip] ${projectDir}`;
            const absDir = path.join(Constants.CLONE_DIR, projectDir);
            try {
                PeerDependencyStripAction.findPackageJsonFiles(absDir)
                    .filter((pkgJsonPath) => PeerDependencyStripAction.isNpmManaged(path.dirname(pkgJsonPath), absDir))
                    .forEach((pkgJsonPath) => {
                        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
                        const peerNames = Object.keys(pkg.peerDependencies ?? {});
                        if (peerNames.length === 0) {
                            return;
                        }
                        delete pkg.peerDependencies;
                        delete pkg.peerDependenciesMeta;
                        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n");
                        const relPath = path.relative(absDir, pkgJsonPath).split(path.sep).join("/");
                        console.log(`${debugTag}: stripped peerDependencies from ${relPath}: ${peerNames.join(", ")}`);
                    });
            } catch (error) {
                console.log(`${debugTag}: WARN failed to strip peer dependencies: ${error}`);
            }
        });
        return Promise.resolve(true);
    }

    private static findPackageJsonFiles(dir: string): string[] {
        const results: string[] = [];
        fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
            const entryPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !SKIPPED_DIRS.has(entry.name)) {
                results.push(...PeerDependencyStripAction.findPackageJsonFiles(entryPath));
            } else if (entry.isFile() && entry.name === "package.json") {
                results.push(entryPath);
            }
        });
        return results;
    }

    /**
     * Walks up from the package.json's directory to the repo root; the first lockfile found (the project's own, or its
     * workspace root's) decides the package manager. With no lockfile at all, ORT falls back to NPM.
     */
    private static isNpmManaged(pkgDir: string, repoRoot: string): boolean {
        const root = path.resolve(repoRoot);
        let dir = path.resolve(pkgDir);
        while (true) {
            if (Utilities.hasNpmLockfile(dir)) {
                return true;
            }
            if (Utilities.hasPnpmLockFile(dir) || Utilities.hasYarnLockfile(dir)
                || fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))
                || fs.existsSync(path.join(dir, "bun.lock")) || fs.existsSync(path.join(dir, "bun.lockb"))) {
                return false;
            }
            if (dir === root || path.dirname(dir) === dir) {
                return true;
            }
            dir = path.dirname(dir);
        }
    }
}
