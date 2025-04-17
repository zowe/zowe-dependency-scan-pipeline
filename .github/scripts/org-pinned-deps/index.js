
import * as fs from 'fs';
import { Octokit } from 'octokit';
import * as cp from 'child_process'
import * as path from 'path';

const octokit = new Octokit({ auth: process.env['GITHUB_TOKEN'] });


async function main() {


  const reportsDir = path.resolve('.','.reports');


  /**
   *  Returns data like:
   * 
   *  [ 
   *   {
   *     ...
   *     "full_name": "zowe/repo"
   *   },
   *   ...
   *  ] 
   */
  const zoweRepos = await octokit.paginate(
    octokit.rest.repos.listForOrg,
    {
      org: 'zowe',
    }
  );
 if (fs.existsSync(reportsDir)) {
    fs.rmSync(reportsDir, {force: true, recursive: true})
  }
  fs.mkdirSync(reportsDir);
  const scansComplete = [];
  for (const repo of zoweRepos) {
    const fullName = repo.full_name;
    const shortName = repo.name
    console.log(`Running scorecard for ${fullName}`);
    const scan = cp.exec(`scorecard --repo=github.com/${fullName} --checks=Pinned-Dependencies --format=json -o=${reportsDir}/${shortName}_scorecard.json --show-details < /dev/null`);
    scansComplete.push(new Promise((resolve) => {
      scan.on('exit', () => resolve());
      scan.on('close', () => resolve());
    }));
  }

  await Promise.all(scansComplete)

  // Build summary table for pinned deps 
  let summaryCsv = 'Repository,Unpinned GH Actions,Unpinned ThirdParty Actions,Other Unpinned Dependencies,Total Unpinned\n'
  const dirContents = fs.readdirSync(reportsDir).filter((item)=> !item.endsWith('csv'));
  for (const entry of dirContents) {
    const file = path.resolve(reportsDir, entry);
    const reportJson = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const repo = reportJson.repo.name;
    const checks = reportJson.checks[0];
    let reportLine = `${repo},`
    if (checks.details == null) {
      // no workflows or pinnable deps found
      reportLine += ',,,\n';
    } else {
      // test in order, otherRegex will pick up the first two regex's

      let unpinnedActions = 0;
      let unpinnedTpActions = 0;
      let unpinnedOther = 0;
      const summarizedOutputs = checks.details.filter((item) => item.trim().startsWith('Info:'))
      for (const summary of summarizedOutputs) {
        const ghaRegex = /(\d+)\s+out of\s+(\d+)\s+GitHub-owned GitHubAction/gm;
        const tpRegex = /(\d+)\s+out of\s+(\d+)\s+third-party GitHubAction/gm;
        const otherRegex = /(\d+)\s+out of\s+(\d+)\s+(.*?)dependencies pinned/gm;
        let matches;
        if ((matches = ghaRegex.exec(summary)) !== null) {
          unpinnedActions = Number(matches[2]) - Number(matches[1]);
        } else if ((matches = tpRegex.exec(summary)) !== null) {
          unpinnedTpActions = Number(matches[2]) - Number(matches[1]);
        } else if ((matches = otherRegex.exec(summary)) !== null) {
          unpinnedOther += Number(matches[2]) - Number(matches[1]);   
        } 
      }
      reportLine+=`${unpinnedActions},${unpinnedTpActions},${unpinnedOther},${unpinnedActions+unpinnedOther+unpinnedTpActions}\n`;
    }

    summaryCsv += reportLine;
  }
  // use _ to ensure summary is the top file in the final report dir that's archived
  fs.writeFileSync(path.resolve(reportsDir, '_summary.csv'), summaryCsv);
}

main();

