import os

ZOWE_SOURCES_VERSION = os.getenv('ZOWE_SOURCES_VERSION', default='rc')

#   Zowe PAX should be downloaded 
# 
#ZOWE_ZOS_VERSION = os.getenv('ZOWE_ZOS_VERSION')
#
#if None == ZOWE_ZOS_VERSION:
#    raise os.error("Please set ZOWE_ZOS_VERSION environment variable.")

ZOWE_CLI_VERSION = os.getenv('ZOWE_CLI_VERSION')

OUTPUT_DIR = os.getenv("OUTPUT_DIR", ".")

JOB_SPEC_NO_NOMOS = {
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

JOB_SPEC_WITH_NOMOS = {
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
