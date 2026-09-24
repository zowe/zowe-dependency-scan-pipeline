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

import * as async from "async";
import * as spawn from "cross-spawn";
import * as fs from "fs";
import { injectable, inject } from "inversify";
import * as path from "path";
import "reflect-metadata";
import * as YAML from "yaml";
import { Constants } from "../../constants/Constants";
import { TYPES } from "../../constants/Types";
import { Logger } from "../../utils/Logger";
import { Utilities } from "../../utils/Utilities";
import { IAction } from "../IAction";

type PackageManager = "pnpm" | "npm";

interface WorkspaceMember {
    name: string;
    version: string;
    absolutePath: string;
    isPrivate: boolean;
}

// peerDependencies is intentionally excluded: a peer dependency declares a compatibility *range*, not an
// install-time pin, so rewriting it to an exact version would misrepresent it. Combined with running the npm
// regen with --legacy-peer-deps below, peer ranges elsewhere in the graph are also never a resolution blocker.
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "optionalDependencies"];

/**
 * ORT models npm/pnpm workspace members as first-party "projects", not "packages" - so a workspace member that's a
 * real, published, production dependency of a sibling (e.g. an API package consumed by a VS Code extension in the
 * same monorepo) is excluded from packages/notices/SBOM entirely, since those are built from "packages" only.
 *
 * Rather than patching that after the fact per-report (which only fixed one report and not the SBOM/packages view),
 * this rewrites the checkout *before* ORT's analyzer ever runs: any non-private workspace member that's a direct
 * production dependency of a sibling has its directory excluded from the workspace declaration, every "workspace:"
 * (or otherwise local) reference to it is rewritten to its own real, published version, and the lockfile is
 * regenerated - so ORT's analyzer resolves it as a genuine external registry package everywhere, the same way
 * pnpm/npm's own publish tooling converts workspace-protocol ranges to real ones at publish time.
 */
@injectable()
export class WorkspaceExternalizeAction implements IAction {

    @inject(TYPES.Logger) private readonly log: Logger;
    private readonly queue: async.AsyncQueue<any> = async.queue(this.externalizeProject.bind(this), Constants.PARALLEL_WORKSPACE_EXTERNALIZE_COUNT);

    public run(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const projectDirs: string[] = Utilities.getSubDirs(Constants.CLONE_DIR);
            this.queue.push(projectDirs);
            this.queue.drain = () => {
                resolve(true);
            };
        });
    }

    private externalizeProject(projectDir: string, cb: (error: any, val?: any) => void): void {
        const debugTag = `[workspace-externalize] ${projectDir}`;
        const absDir = path.join(Constants.CLONE_DIR, projectDir);

        let manager: PackageManager | null = null;
        if (fs.existsSync(path.join(absDir, "pnpm-workspace.yaml"))) {
            manager = "pnpm";
        } else if (fs.existsSync(path.join(absDir, "package.json"))) {
            const rootPkgJson = JSON.parse(fs.readFileSync(path.join(absDir, "package.json"), "utf-8"));
            if (rootPkgJson.workspaces) {
                manager = "npm";
            }
        }

        if (manager == null) {
            cb(null);
            return;
        }

        try {
            const members = WorkspaceExternalizeAction.listWorkspaceMembers(manager, absDir);
            if (members.length === 0) {
                cb(null);
                return;
            }

            const rootPkgJsonPath = path.join(absDir, "package.json");
            const allPkgJsonPaths = [rootPkgJsonPath, ...members.map((m) => path.join(m.absolutePath, "package.json"))];
            const pkgJsonCache = new Map<string, any>();
            allPkgJsonPaths.forEach((p) => pkgJsonCache.set(p, JSON.parse(fs.readFileSync(p, "utf-8"))));

            const memberNames = new Set(members.map((m) => m.name));
            const consumersOf = new Map<string, number>();
            members.forEach((member) => {
                const pkg = pkgJsonCache.get(path.join(member.absolutePath, "package.json"));
                Object.keys(pkg.dependencies ?? {}).forEach((depName) => {
                    if (depName !== member.name && memberNames.has(depName)) {
                        consumersOf.set(depName, (consumersOf.get(depName) ?? 0) + 1);
                    }
                });
            });

            const toExternalize = members.filter((m) => !m.isPrivate && (consumersOf.get(m.name) ?? 0) > 0);
            console.log(`${debugTag}: ${members.length} workspace member(s), ${toExternalize.length} to externalize: ${toExternalize.map((m) => m.name).join(", ") || "(none)"}`);

            if (toExternalize.length === 0) {
                cb(null);
                return;
            }

            const memberPathToName = new Map<string, string>();
            members.forEach((m) => memberPathToName.set(path.join(m.absolutePath, "package.json"), m.name));

            const dirtyPkgJsonPaths = new Set<string>();
            toExternalize.forEach((sibling) => {
                allPkgJsonPaths.forEach((pkgJsonPath) => {
                    const pkg = pkgJsonCache.get(pkgJsonPath);
                    DEPENDENCY_FIELDS.forEach((field) => {
                        if (pkg[field] && Object.prototype.hasOwnProperty.call(pkg[field], sibling.name)) {
                            pkg[field][sibling.name] = sibling.version;
                            dirtyPkgJsonPaths.add(pkgJsonPath);
                        }
                    });
                });
            });

            const excludePatterns = toExternalize.map((sibling) =>
                "!" + path.relative(absDir, sibling.absolutePath).split(path.sep).join("/"));

            if (manager === "pnpm") {
                const workspaceYamlPath = path.join(absDir, "pnpm-workspace.yaml");
                const workspaceYaml = YAML.parse(fs.readFileSync(workspaceYamlPath, "utf-8")) ?? {};
                workspaceYaml.packages = [...(workspaceYaml.packages ?? []), ...excludePatterns];
                fs.writeFileSync(workspaceYamlPath, YAML.stringify(workspaceYaml));
            } else {
                const rootPkgJson = pkgJsonCache.get(rootPkgJsonPath);
                if (Array.isArray(rootPkgJson.workspaces)) {
                    rootPkgJson.workspaces.push(...excludePatterns);
                } else if (Array.isArray(rootPkgJson.workspaces?.packages)) {
                    rootPkgJson.workspaces.packages.push(...excludePatterns);
                }
                dirtyPkgJsonPaths.add(rootPkgJsonPath);
            }

            dirtyPkgJsonPaths.forEach((p) => {
                fs.writeFileSync(p, JSON.stringify(pkgJsonCache.get(p), null, 2) + "\n");
            });

            // Scope the regen to just the workspace members whose dependency spec actually changed, rather than
            // the whole workspace - both pnpm's `--filter` and npm's `--workspace` limit resolution/rewriting to
            // that subset (verified: an unrelated third project's lockfile section came back byte-identical).
            // "--filter ." (pnpm only) covers the rare case where the root package.json itself was a consumer.
            const affectedMemberNames = [...dirtyPkgJsonPaths]
                .map((p) => memberPathToName.get(p))
                .filter((name): name is string => name != null);

            const lockfileCmd = manager === "pnpm"
                ? {
                    cmd: "pnpm",
                    args: ["install", ...affectedMemberNames.flatMap((n) => ["--filter", n]), "--filter", ".",
                        "--lockfile-only", "--no-frozen-lockfile", "--ignore-scripts"],
                }
                : {
                    cmd: "npm",
                    args: ["install", ...affectedMemberNames.map((n) => `--workspace=${n}`),
                        "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund", "--legacy-peer-deps"],
                };

            console.log(`${debugTag}: regenerating lockfile via '${lockfileCmd.cmd} ${lockfileCmd.args.join(" ")}'`);
            const result = spawn.sync(lockfileCmd.cmd, lockfileCmd.args, { cwd: absDir, env: process.env, shell: true });
            this.log.logOutputSync(result, projectDir, "workspace_externalize");

            if (result.status !== 0) {
                console.log(`${debugTag}: WARN lockfile regeneration exited with code ${result.status} - the analyzer step for this repo may now fail. See build/logs/workspace_externalize for details.`);
            } else {
                console.log(`${debugTag}: externalized ${toExternalize.map((m) => `${m.name}@${m.version}`).join(", ")}`);
            }

            cb(null);
        } catch (error) {
            console.log(`${debugTag}: WARN failed to externalize workspace members: ${error}`);
            cb(null);
        }
    }

    private static listWorkspaceMembers(manager: PackageManager, absDir: string): WorkspaceMember[] {
        if (manager === "pnpm") {
            const result = spawn.sync("pnpm", ["-r", "list", "--depth", "0", "--json"], { cwd: absDir, env: process.env, shell: true, encoding: "utf-8" });
            const entries: any[] = JSON.parse(result.stdout || "[]");
            return entries
                .filter((entry) => entry.version != null && path.resolve(entry.path) !== path.resolve(absDir))
                .map((entry) => ({
                    name: entry.name,
                    version: entry.version,
                    absolutePath: entry.path,
                    isPrivate: entry.private === true,
                }));
        }

        const result = spawn.sync("npm", ["query", ".workspace", "--package-lock-only", "--json"], { cwd: absDir, env: process.env, shell: true, encoding: "utf-8" });
        const entries: any[] = JSON.parse(result.stdout || "[]");
        return entries.map((entry) => ({
            name: entry.name,
            version: entry.version,
            absolutePath: entry.path,
            isPrivate: entry.private === true,
        }));
    }
}
