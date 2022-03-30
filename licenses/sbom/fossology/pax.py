
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

print(f'Uploading Pax from mount point...')

pax_upload = foss_session.upload_file(folder=foss_session.rootFolder,
                                      server=server,
                                      description="Upload PAX from Server",
                                      access_level=AccessLevel.PUBLIC,
                                      wait_time=70)  # Retries 10 times, 70s x 10 = 11 minute total timeout

job_specification = {
    "analysis": {
        "bucket": True,
        "copyright_email_author": True,
        "ecc": True,
        "keyword": True,
        "mime": True,
        "monk": False,
        "nomos": False,
        "ojo": False,
        "package": True,
        "specific_agent": True,
    },
    "decider": {
        "nomos_monk": False,
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

print('Scanning PAX...')
scan_res = foss_session.schedule_jobs(
    foss_session.rootFolder, pax_upload, job_specification, wait=True)

print('Generating report...')
pax_report = foss_session.generate_report(pax_upload, ReportFormat.SPDX2TV)
report_content, report_name = foss_session.download_report(pax_report)

print(f'Writing report to {const.OUTPUT_DIR}{os.path.sep}zowe-pax.spdx')
f = open(f'{const.OUTPUT_DIR}{os.path.sep}zowe-pax.spdx', "a")
f.write(str(report_content, "utf-8"))
f.close()
