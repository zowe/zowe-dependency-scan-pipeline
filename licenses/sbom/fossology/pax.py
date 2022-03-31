
import os

import const
from foss_session import FossSession
from fossology.obj import AccessLevel, ReportFormat

foss_session = FossSession().session
output_dir = os.getenv("OUTPUT_DIR", ".")
upload_path = os.getenv("UPLOAD_DIR", "/tmp/upload")
upload_name = os.getenv("UPLOAD_NAME", "default_up_name")
server = {
    "path": upload_path,
    "name": upload_name,
}

print(f'Uploading File(s) from mount point...', flush=True)

foss_upload = foss_session.upload_file(folder=foss_session.rootFolder,
                                      server=server,
                                      description="Upload File(s) from Server",
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
foss_upload = foss_session.list_uploads(name=upload_name)[0][0]

print('Scanning Upload...', flush=True)
scan_res = foss_session.schedule_jobs(
    foss_session.rootFolder, foss_upload, job_specification, wait=True, timeout=60)

# Keep waiting on jobs while they are in progress. If any job ETA > 0, this keeps looping
# This will wait (sleep) for jobs to complete based on their reported ETA
allJobsDone = False
while allJobsDone == False:
    allJobsDone = True
    all_jobs = foss_session.list_jobs(None, page=0, all_pages=True)
    for job in all_jobs[0]:
        if job.eta > 0:
            allJobsDone = False
            print(
                f'Waiting on {job.__str__()} to complete, will wait ETA of {job.eta}', flush=True)
            foss_session.detail_job(job.id, wait=True, timeout=job.eta)


print('Generating report...', flush=True)
spdx_report = foss_session.generate_report(foss_upload, ReportFormat.SPDX2TV)
report_content, report_name = foss_session.download_report(spdx_report)

upload_filename = upload_name.replace(' ', '_')

print(
    f'Writing report to {const.OUTPUT_DIR}{os.path.sep}{upload_filename}.spdx', flush=True)
f = open(f'{const.OUTPUT_DIR}{os.path.sep}{upload_filename}.spdx', "a")
f.write(str(report_content, "utf-8"))
f.close()