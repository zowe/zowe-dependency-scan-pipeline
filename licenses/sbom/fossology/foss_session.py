import random
import string
from time import sleep

from fossology import Fossology, fossology_token
from fossology.obj import TokenScope

FOSSOLOGY_SERVER = "http://localhost:8081/repo"
FOSSOLOGY_USER = "fossy"
FOSSOLOGY_PASSWORD = "fossy"


class FossSession:

    def __init__(self):
        TOKEN_NAME = "token".join(random.choice(
            string.ascii_lowercase) for i in range(6))
        token = fossology_token(
            FOSSOLOGY_SERVER,
            FOSSOLOGY_USER,
            FOSSOLOGY_PASSWORD,
            TOKEN_NAME,
            TokenScope.WRITE
        )
        self.session = Fossology(FOSSOLOGY_SERVER, token, FOSSOLOGY_USER)

    def waitForUploadJobs(self, upload):
        allJobsDone = False
        while allJobsDone == False:
            allJobsDone = True
            all_jobs = self.session.list_jobs(upload, page=0, all_pages=True)
            for job in all_jobs[0]:
                if (job.status == 'Queued' or job.status == "Starting") or job.eta > 0:
                    allJobsDone = False
                    print(
                        f'Waiting on {job.__str__()} to complete, will wait ETA of {job.eta}', flush=True)
                    tryAgainTimer = max(job.eta/3, 20)
                    sleep(tryAgainTimer)

    def waitForAllJobs(self):
        self.waitForUploadJobs(None)
