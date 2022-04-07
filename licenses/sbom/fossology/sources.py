import asyncio
import json
import os
import pprint
import random
import string
import sys
from logging import exception
from os import fsync, path
from types import SimpleNamespace
from typing import Any

import requests
from tenacity import TryAgain
from tryagain import retries

import const
from errors import RequestError
from foss_session import FossSession
from fossology.obj import AccessLevel, Folder, ReportFormat

FOSS_CLONE_TASK_COUNT = 4
FOSS_SCAN_TASK_COUNT = 2

foss_client = FossSession()
foss_session = foss_client.session


class JobScan:

    def __init__(self, folder, upload, job_spec):
        self.folder = folder
        self.upload = upload
        self.job_spec = job_spec
        self.fail_count = 0


async def check_jobs_complete(upload):
    allJobsComplete = False
    while not allJobsComplete:
        allJobsComplete = True
        job_detail = foss_session.list_jobs(upload)
        for job in job_detail[0]:
            if (job.status == 'Queued' or job.status == "Starting") or job.eta > 0:
                allJobsComplete = False
                await asyncio.sleep(max(job.eta / 3, 10))


async def scan_and_report_worker(name: string, queue: asyncio.Queue):
    while True:
        scan_job: JobScan = await queue.get()
        if scan_job.fail_count > 3:
            print(
                f'{scan_job.upload.uploadname} exceeded failure threshold', flush=True)
            queue.task_done()
        else:
            try:
                print(f'Scanning {scan_job.upload.uploadname}', flush=True)

                _ = foss_session.schedule_jobs(scan_job.folder, scan_job.upload,
                                            scan_job.job_spec, wait=False)

                await check_jobs_complete(scan_job.upload)

                report_id = foss_session.generate_report(
                    scan_job.upload, ReportFormat.SPDX2TV)

                await check_jobs_complete(scan_job.upload)

                report_content, _ = foss_session.download_report(report_id)

                f = open(
                    f'{const.OUTPUT_DIR}{path.sep}{scan_job.upload.uploadname}.spdx', "a")
                f.write(str(report_content, "utf-8"))
                f.close() 
                queue.task_done()
            except TryAgain:
                scan_job.fail_count+=1
                print(
                    f'Exception in scan and report worker for {scan_job.upload.uploadname}, Retrying: {scan_job.fail_count}', flush=True)
                queue.put_nowait(scan_job)
                queue.task_done()


async def clone_worker(name: string, queue: asyncio.Queue):
    while True:
        vcs_root = await queue.get()

        print(
            f'Checking if {vcs_root["vcsName"]} already exists...', flush=True)
        try:
            uploads = foss_session.list_uploads(
                foss_session.rootFolder, name=f'{vcs_root["vcsName"]}', all_pages=True)
            uploadFound = False
            for upload in uploads[0]:
                if upload.uploadname == vcs_root["vcsName"]:
                    uploadFound = True
            if uploadFound:
                print(f'Already exists: {vcs_root["vcsName"]}', flush=True)
                queue.task_done()
            else:
                print(f'Cloning {vcs_root["vcsName"]}', flush=True)
                try:
                    vcs_res = foss_session.upload_file(
                        foss_session.rootFolder,
                        vcs=vcs_root,
                        description=f'{vcs_root["vcsName"]}',
                        access_level=AccessLevel.PUBLIC
                    )
                    await asyncio.sleep(5)
                    queue.task_done()
                except:
                    sys.exit(
                        f'Failed to clone {vcs_root["vcsName"]}, quitting...')

        except:
            # nothing
            print('Existing upload not found.')
            


async def main():

    ZOWE_SOURCES_MANIFEST_URL = "https://raw.githubusercontent.com/zowe/zowe-install-packaging/" + \
        const.ZOWE_SOURCES_VERSION+"/manifest.json.template"

    mReq = requests.get(ZOWE_SOURCES_MANIFEST_URL)

    if 200 != mReq.status_code:
        raise RequestError("Unable to download manifest json",
                           str(mReq.content, "utf-8"))

    manifestJson = json.loads(
        mReq.text, object_hook=lambda d: SimpleNamespace(**d))

    foss_vcs_roots = []

    try:
        for dependency in manifestJson.sourceDependencies:
            for repository in dependency.entries:

                sanitized_tag = repository.tag.replace('/', '_')

                foss_vcs_roots.append({
                    "vcsType": "git",
                    "vcsUrl": f'https://github.com/zowe/{repository.repository}',
                    "vcsName": f'{repository.repository}-{sanitized_tag}',
                    "vcsBranch": f'{repository.tag}',
                })

        foss_clone_queue = asyncio.Queue(foss_vcs_roots.__len__())
        foss_scan_queue = asyncio.Queue(foss_vcs_roots.__len__())
        foss_tasks = []

        for i in range(FOSS_CLONE_TASK_COUNT):
            asyncio.create_task(clone_worker(f'worker{i}', foss_clone_queue))
        for i in range(FOSS_SCAN_TASK_COUNT):
            asyncio.create_task(scan_and_report_worker(
                f'scan_worker_{i}', foss_scan_queue))

        # Temp hard-code
        for vcsRoot in foss_vcs_roots:
            # print('skip clone', flush=True)
            foss_clone_queue.put_nowait(vcsRoot)

        await foss_clone_queue.join()

        vcs_up, pages = foss_session.list_uploads()

        for upload in vcs_up:

            job_scan = JobScan(Folder(upload.folderid, upload.foldername, "", ""),
                               upload,
                               const.JOB_SPEC_WITH_NOMOS)

            foss_scan_queue.put_nowait(job_scan)

        await foss_scan_queue.join()
    except:
        raise TryAgain

asyncio.run(main())
