
import os

import const
from foss_session import FossSession
from fossology.obj import AccessLevel, ReportFormat

foss_session = FossSession().session
output_dir = os.getenv("OUTPUT_DIR", ".")

server = {
    "path": "/tmp/zowe_pax",
    "name": "Zowe PAX",
}

print(f'Uploading Pax from mount point...', flush=True)

pax_upload = foss_session.upload_file(folder=foss_session.rootFolder,
                                      server=server,
                                      description="Upload PAX from Server",
                                      access_level=AccessLevel.PUBLIC,
                                      wait_time=140)  # Retries 10 times, 140s x 10 = 23.33 minute total timeout

job_specification = {
    "analysis": {
        "bucket": True,
        "copyright_email_author": True,
        "ecc": True,
        "keyword": True,
        "mime": True,
        "monk": True,
        "nomos": True,
        "ojo": False,
        "package": True,
        "specific_agent": True,
    },
    "decider": {
        "nomos_monk": True,
        "bulk_reused": True,
        "new_scanner": True,
        "ojo_decider": True,
    },
    "reuse": {
        "reuse_upload": 0,
        "reuse_group": 0,
        "reuse_main": True,
        "reuse_enhanced": True,
        "reuse_report": True,
        "reuse_copyright": True,
    },
}
pax_upload = foss_session.list_uploads(name="Zowe PAX")[0][0]

print('Scanning PAX...', flush=True)
scan_res = foss_session.schedule_jobs(
     foss_session.rootFolder, pax_upload, job_specification, wait=True,timeout=60)

# Keep waiting on jobs while they are in progress. If any job ETA > 0, this keeps looping
# This will wait (sleep) for jobs to complete based on their reported ETA
allJobsDone = False
while allJobsDone == False:
    allJobsDone = True
    all_jobs = foss_session.list_jobs(None, page=0, all_pages=True)
    for job in all_jobs[0]:
        if job.eta > 0:
            allJobsDone = False
            print(f'Waiting on {job.__str__()} to complete, will wait ETA of {job.eta}', flush=True)
            foss_session.detail_job(job.id, wait=True, timeout=job.eta)


print('Generating report...', flush=True)
pax_report = foss_session.generate_report(pax_upload, ReportFormat.SPDX2TV)
report_content, report_name = foss_session.download_report(pax_report)

print(f'Writing report to {const.OUTPUT_DIR}{os.path.sep}zowe-pax.spdx', flush=True)
f = open(f'{const.OUTPUT_DIR}{os.path.sep}zowe-pax.spdx', "a")
f.write(str(report_content, "utf-8"))
f.close()
