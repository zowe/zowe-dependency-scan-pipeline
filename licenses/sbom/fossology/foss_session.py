import random
import string

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

 