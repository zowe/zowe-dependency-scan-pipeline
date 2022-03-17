import asyncio
import json
import pprint
import random
import string
from logging import exception
from os import fsync, path
from types import SimpleNamespace
from typing import Any

import requests

import const
from errors import RequestError
from foss_session import FossSession
from fossology.obj import AccessLevel, Folder, ReportFormat

FOSS_CLONE_TASK_COUNT = 4
FOSS_SCAN_TASK_COUNT = 2

foss_session = FossSession().session

class JobScan:

    def __init__(self, folder, upload, job_spec):
        self.folder = folder
        self.upload = upload
        self.job_spec = job_spec


async def scan_and_report_worker(name: string, queue: asyncio.Queue):
    while True:
        scan_job: JobScan = await queue.get()
        print(f'Scanning {scan_job.upload.uploadname}')

        _ = foss_session.schedule_jobs(scan_job.folder, scan_job.upload,
                                                  scan_job.job_spec, wait=True)

        report_id = foss_session.generate_report(
            scan_job.upload, ReportFormat.SPDX2TV)

        report_content, _ = foss_session.download_report(report_id)

        f = open(f'{const.OUTPUT_DIR}{path.sep}{scan_job.upload.uploadname}.spdx', "a")
        f.write(str(report_content, "utf-8"))
        f.close()
        queue.task_done()


async def clone_worker(name: string, queue: asyncio.Queue):
    while True:
        vcs_root = await queue.get()
        print(f'Cloning {vcs_root["vcsName"]}')
        vcs_res = foss_session.upload_file(
            foss_session.rootFolder,
            vcs=vcs_root,
            description=f'Upload {vcs_root["vcsName"]}',
            access_level=AccessLevel.PUBLIC,
        )
        queue.task_done()


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

    for dependency in manifestJson.sourceDependencies:
        for repository in dependency.entries:
            foss_vcs_roots.append({
                "vcsType": "git",
                "vcsUrl": f'https://github.com/zowe/{repository.repository}',
                "vcsName": f'{repository.repository}-{repository.tag}',
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

    for vcsRoot in foss_vcs_roots[2:4]:
        foss_clone_queue.put_nowait(vcsRoot)

    await foss_clone_queue.join()

    vcs_up, pages = foss_session.list_uploads()

    for upload in vcs_up:

     
        job_scan = JobScan(Folder(upload.folderid, upload.foldername, "", ""),
                           upload,
                           const.JOB_SPEC_NO_NOMOS)

        foss_scan_queue.put_nowait(job_scan)

    await foss_scan_queue.join()

asyncio.run(main())
