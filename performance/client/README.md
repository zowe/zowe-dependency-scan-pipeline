# Zowe Performance Test Client

Perform performance test on the target server.

## Blocking issue

This project is not currently in use, and JSON.lua was removed due to licensing considerations. [See here](./src/wrk-lua-scripts/JSON.lua.README).


## Programming Language And Main Testing Method

- Node.js [v12.x LTS](https://nodejs.org/docs/latest-v12.x/api/index.html) or above
- [Jest](https://jestjs.io/)

## Environment Variables Used By Test

- **DEBUG**: Optional.If you specify a value like `zowe-performance-test:*`, the test will expose all debugging information. You can limit it to one set of debugging information like assigning a value like `zowe-performance-test:wrk-testcase`.
- **ZMS_HOST** and **ZMS_PORT**: Optional. If you want to collect server side metrics, you need to specify where is the Zowe Metrics Server started. Usually it should has same value as your target test server. **ZMS_PORT** is optional and has default value `19000`, which is the default port of Zowe Metrics Server.
- **TARGET_HOST** and **TARGET_PORT**: This is required for `WrkTestCase`. It's the test server and port you want to test. **TARGET_PORT** is optional, and has default value `7554`, which is the default Zowe API Mediation Layer Gateway port.
- **TEST_AUTH_USER** and **TEST_AUTH_PASSWORD**: Many `WrkTestCase` will require authentication. These are the username and password to call the API you want to test.
- **ZOSMF_HOST** and **ZOSMF_PORT** z/OSMF host name and port. Default value of `ZOSMF_HOST` is same as `TARGET_HOST`, and default value of `ZOSMF_PORT` is `443`. Correct z/OSMF information is required if your test needs to communicate with z/OSMF. It could be used to cleanup JES job outputs, run TSO command on the server, etc.
- **ZOSMF_AUTH_USER** and **ZOSMF_AUTH_PASSWORD**: z/OSMF authentication user and password. Default value is same as `TEST_AUTH_USER` and `TEST_AUTH_PASSWORD`.

## Run Test Cases with Docker

We temporarily published performance test client docker image as `jackjiaibm/zowe-performance-test-client`.

```
docker run -it --rm \
  -e DEBUG=zowe-performance-test:* \
  -e ZMS_HOST=<your-zms-host> \
  -e ZMS_PORT=<your-zms-port> \
  -e TARGET_HOST=<your-target-test-host> \
  -e TARGET_PORT=<your-target-test-port> \
  -e TEST_AUTH_USER=<your-user> \
  -e TEST_AUTH_PASSWORD=<your-password> \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd):/app/reports \
  jackjiaibm/zowe-performance-test-client \
  -- <test-to-run>
```

The `-v /var/run/docker.sock:/var/run/docker.sock` option in the command is to allow usage of docker inside the container. This is required to run WRK API tests. The test report will be exposed in your current directory with `-v $(pwd):/app/reports` command option.

`<test-to-run>` is to specific a small set of test cases to run. These tests usually are located in `dist/__tests__/` folder. For example, `dist/__tests__/examples/idle/`.

Here is an example to run the idle test case:

```
docker run -it --rm \
  -e ZMS_HOST=<your-zms-host> \
  -e TARGET_HOST=<your-target-test-host> \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd):/app/reports \
  jackjiaibm/zowe-performance-test-client \
  -- dist/__tests__/examples/idle/
```

You can have you customized test cases and run them with this docker image. For example, you have these sub-directories:

```
- my-new-tests
- reports
```

You can run your tests like this:

```
docker run -it --rm \
  -e ZMS_HOST=<your-zms-host> \
  -e TARGET_HOST=<your-target-test-host> \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd)/reports:/app/reports \
  -v $(pwd)/my-new-tests:/app/src/__tests/my-new-tests \
  jackjiaibm/zowe-performance-test-client \
  -- dist/__tests__/my-new-tests/
```

Please note:

- The source code is mounted with option `-v $(pwd)/my-new-tests:/app/src/__tests/my-new-tests`, and it will be compiled before starting the test.
- The test is started with `dist/__tests__/my-new-tests/` option. That's where the compiled version of your test.
- Please be careful about the related folder structure in `src` folder.

## Run Test Cases On Your Local

### Prepare NPM Packages

Run `npm install` to install dependencies.

### Start Test

```
DEBUG=zowe-performance-test:* \
ZMS_HOST=<your-zms-host> \
ZMS_PORT=<your-zms-port> \
TARGET_HOST=<your-target-test-host> \
TARGET_PORT=<your-target-test-port> \
TEST_AUTH_USER=<username> \
TEST_AUTH_PASSWORD=<username> \
npm test <test-to-run>
```

The test report will be saved in `reports` folder by default. This can be customized in `jest.config.js`.

### What Happens When Running a Test

The process of running a test can be illustrated with these steps:

- Start the test case
- If the test case has `fetchZoweVersions` enabled, it will try to fetch Zowe instance version.
- Wait for `<TestCase>.cooldown` (default value is `DEFAULT_TEST_COOLDOWN`) seconds before starting test.
- Execute the actions defined for this test case, and also polling both server and client side metrics.
- After reaches the duration of the test case, it will wait for another cool down time defined by `<TestCase>.serverMetricsCollectorOptions.cooldown` (default value is `DEFAULT_SERVER_METRICS_COLLECTOR_COOLDOWN_TIME`) or `<TestCase>.clientMetricsCollectorOptions.cooldown` (default value is `DEFAULT_CLIENT_METRICS_COLLECTOR_COOLDOWN_TIME`) before collecting last metrics.

## Write Test Cases

Depends on the purpose of the test, you may extend your test case from one of below base test cases.

- `BaseTestCase`: This is generic test which you can customize how to run your test. For example, [src/__tests__/examples/idle/index.ts](src/__tests__/examples/idle/index.ts).
- `WrkTestCase`: This is basic API test which you can test one endpoint. For example, [src/__tests__/examples/api-get/data-set-content.ts](src/__tests__/examples/api-get/data-set-content.ts).
- `WrkSequentialEndpointsTestCase`: This is API test which you can define multiple endpoints and make requests one by one. For example, [src/__tests__/examples/api-multiple/sequential-endpoints.ts](src/__tests__/examples/api-multiple/sequential-endpoints.ts).
- `WrkWeightedEndpointsTestCase`: This is API test which you can define multiple endpoints with weight. The test will randomly pick one of them based on the weight and make request to your target server. For example, [src/__tests__/examples/api-multiple/weighted-endpoints.ts](src/__tests__/examples/api-multiple/weighted-endpoints.ts).

## Troubleshooting Failures

In test reports, there are several sections you should pay attention for failures:

- `summary.failed`: This indicates there are failures in some tests if it's not `0`.
- `tests.*.result.failed_requests`: Even though your all tests passed, some tests may not be trustworthy if this value exists and is not `0`. Normally you can enable `debug` mode by setting the `debug = true;` for the test case to find where the failures come from. Another good source is checking `SDSF.LOG` panel.

### $HASP690 COMMAND REJECTED - SOURCE OF COMMAND HAS IMPROPER AUTHORITY

If you see this error message in the console log of your test, that means the user doesn't have enough authority to run certain operator commands from TSO. This could be `$PO TSU1-9999` command we are trying to run.

To fix this error, you need to permit `UPDATE` for your user to `OPERCMDS JES%.**` profile. These commands may help you:

```
SETR GENERIC(OPERCMDS)
RDEFINE OPERCMDS JES%.** UACC(UPDATE)
PERMIT JES%.** CL(OPERCMDS) ID(IBMUSER) ACCESS(UPDATE)
SETROPTS RACLIST(OPERCMDS) REFRESH
```

### IEE345I MODIFY   AUTHORITY INVALID, FAILED BY MVS

If you see this error message in the console log of your test, that means the user doesn't have enough authority to run certain operator commands from TSO. This could be the `F CEA,D,S` command we are trying to run.

To fix this error, you need to permit `UPDATE` for your user to `OPERCMDS MVS.MODIFY.**` profile. These commands may help you:

```
SETR GENERIC(OPERCMDS)
RDEFINE OPERCMDS MVS.MODIFY.** UACC(UPDATE)
PERMIT MVS.MODIFY.** CL(OPERCMDS) ID(IBMUSER) ACCESS(UPDATE)
SETROPTS RACLIST(OPERCMDS) REFRESH
```

### CEA0403I in SDSF.LOG panel

If you see error message `CEA0403I` like this in `SDSF.LOG` panel,

```
M 4040000 TIVLP46  21052 14:32:33.17 STC00815 00000090  CEA0403I A USER REQUEST TO CREATE A TSO ADDRESS SPACE HAS BEEN DECLINED
S                                                       886                                                                    
D                                         886 00000090  BECAUSE THE MAXIMUM NUMBER OF SESSIONS HAS BEEN REACHED ON THIS SYSTEM.
E                                         886 00000090  CEAPRMXX STATEMENT MAXSESSIONS MUST BE INCREASED TO ALLOW THIS REQUEST.
```

That means the CEA parameter MAXSESSIONS is not good enough for your test. Check more details from the error code page here (https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.ieam400/msg-CEA0403I.htm)[https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.ieam400/msg-CEA0403I.htm].

To fix this error, increase `MAXSESSIONS` until you don't see failures during your test. You may find the parameter in `SYS1.PARMLIB(CEAPRM00)`, but still depends on how your system is configured. To manually check current CEA parameters, run `F CEA,D,PARMS` command.

### $HASP050 JES2 RESOURCE SHORTAGE OF BERT

If you see error messages like this,

```
<host>  : H *$HASP050 JES2 RESOURCE SHORTAGE OF BERT - 100% UTILIZATION REACHED,
<host>  : H *$HASP052 JES2 BERT resource shortage is critical --,
<host>  : H           IMMEDIATE action required,
<host>  : H           DO NOT TERMINATE JES2 OR IPL.  Doing so may result in a COLD,
<host>  : H           start.,
<host>  : H           CURRENT BERTNUM=1600, Free BERTs=0,
<host>  : H           Correct BERT shortage by --,
<host>  : H             - $T CKPTSPACE,BERTNUM=nnnn (increase BERTs),
<host>  : H             - $P Jnnnn (purge pre-execution jobs),
```

### HASP050 JES2 RESOURCE SHORTAGE OF JOES (or JQES)

If you see error messages like this,

```
N 4040000 TIVLP46  21053 21:16:20.82          00000090 *$HASP050 JES2 RESOURCE SHORTAGE OF JQES - 100% UTILIZATION REACHED 
N 4040000 TIVLP46  21053 21:16:44.82          00000090 *$HASP050 JES2 RESOURCE SHORTAGE OF JOES - 99% UTILIZATION REACHED  
```

At this time,

```
$DSPL                                                              
$HASP893 VOLUME(LP4601)  STATUS=ACTIVE,PERCENT=58                  
$HASP893 VOLUME(LP460S)  STATUS=ACTIVE,PERCENT=17                  
$HASP646 24.9105 PERCENT SPOOL UTILIZATION                         
$D JOBDEF                                                          
$HASP835 JOBDEF 577                                                
$HASP835 JOBDEF  ACCTFLD=OPTIONAL,BAD_JOBNAME_CHAR=?,              
$HASP835         CNVT_ENQ=FAIL,DEF_CLASS=A,INTERPRET=INIT,         
$HASP835         CISUB_PER_AS=5,CNVT_SCHENV=IGNORE,JNUMBASE=1027,  
$HASP835         JNUMFREE=7999,JNUMWARN=80,JOBFREE=0,JOBNUM=2000,  
$HASP835         JOBWARN=80,PRTYHIGH=10,PRTYJECL=YES,PRTYJOB=NO,   
$HASP835         PRTYLOW=1,PRTYRATE=1,RANGE=(1,9999),RASSIGN=YES,  
$HASP835         JOBRBLDQ=NONE,DUPL_JOB=DELAY,LOGMSG=ASIS,         
$HASP835         SUP_EVENTLOG_SMF=NO                               
```
