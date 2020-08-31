# Zowe Performance Test Client

Perform performance test on the target server.

## Programming Language And Main Testing Method

- Node.js [v12.x LTS](https://nodejs.org/docs/latest-v12.x/api/index.html) or above
- [Jest](https://jestjs.io/)

## Run Test Cases On Your Local

### Prepare NPM Packages

Run `npm install` to install dependencies.

### Start Test

```
DEBUG=zowe-performance-test:* \
ZMS_HOST=<your-zms-host> \
ZMS_PORT=19000 \
TARGET_HOST=<your-target-test-host> \
TARGET_PORT=<your-target-test-port> \
TEST_AUTH_USER=<username> \
TEST_AUTH_PASSWORD=<username> \
npm run test
```

The environment variables are:

- **DEBUG**: Optional. If you specify a value like `zowe-performance-test:*`, the test will expose all debugging information. You can limit it to one set of debugging information like assigning a value like `zowe-performance-test:wrk-testcase`.
- **ZMS_HOST** and **ZMS_PORT**: Optional. If you want to collect server side metrics, you need to specify where is the Zowe Metrics Server started. Usually it should has same value as your target test server. **ZMS_PORT** is optional and has default value `19000`, which is the default port of Zowe Metrics Server.
- **TARGET_HOST** and **TARGET_PORT**: This is required for `WrkTestCase`. It's the test server and port you want to test. Usually **TARGET_PORT** is the Zowe API Mediation Layer Gateway port.
- **TEST_AUTH_USER** and **TEST_AUTH_PASSWORD**: Many `WrkTestCase` will require authentication. These are the username and password to call the API you want to test.

The test report will be saved in `reports` folder by default. This can be customized in `jest.config.js`.

### What Happens When Running a Test

The process of running a test can be illustrated with these steps:

- Start the test case
- If the test case has `fetchZoweVersions` enabled, it will try to fetch Zowe instance version.
- If the test case has `fetchZoweVersions` enabled, after retrieved Zowe version, it will try to cool down with time defined as `<TestCase>.cooldown` (default value is `DEFAULT_TEST_COOLDOWN`).
- Execute the actions defined for this test case, and also polling both server and client side metrics.
- After reaches the duration of the test case, it will wait for another cool down time defined by `<TestCase>.serverMetricsCollectorOptions.cooldown` (default value is `DEFAULT_SERVER_METRICS_COLLECTOR_COOLDOWN_TIME`) or `<TestCase>.clientMetricsCollectorOptions.cooldown` (default value is `DEFAULT_CLIENT_METRICS_COLLECTOR_COOLDOWN_TIME`) before collecting last metrics.
- Wait for another `<TestCase>.cooldown` (default value is `DEFAULT_TEST_COOLDOWN`) seconds before starting next test.

## Write Test Cases

Currently we support 2 type of test cases: `BaseTestCase` and `WrkTestCase`. They are defined in `src/testcase` folder. `WrkTestCase` is inherited from `BaseTestCase`.

### Define a Generic Test Case

We can extend from `BaseTestCase` to define a generic test. When we extend, we have option to customize what you want to do before, during and after the test.

Here is an example to define a generic test case.

```typescript
// depends on your relative folder from where "testcase/base" is located
import BaseTestCase from "../../../testcase/base";

class MyTest extends BaseTestCase {
  // name/purpose of the test
  name = "I have a special purpose for this test";

  // fetch Zowe instance version information
  // this can be turned on if TARGET_PORT is Zowe APIML Gateway port
  fetchZoweVersions = true;

  // test will last 10 minutes
  duration = 600;

  // my custom property
  myTestOption: string = "value";

  async before(): Promise<void> {
    // call parent
    await super.before();

    // prepare my environment before I start
    await howToPrepareMyTest(this.myTestOption);
  }

  async after(): Promise<void> {
    // call parent
    await super.after();

    // clean up my environment after my test
    await howToCleanup(this.myTestOption);
  }

  async run(): Promise<void> {
    // I simply do nothing, just collecting metrics
    await sleep(this.duration * 1000);
  }
};

// init test case, this is required
new MyTest().init();
```

### Define an API Test Case

We can extend from `WrkTestCase` to define a customized API test. This is an example to test Zowe explorer data set API endpoint.

```typescript
// depends on your relative folder from where "testcase/base" is located
import WrkTestCase from "../../../testcase/wrk";
import { getBasicAuthorizationHeader } from "../../../utils";
import { DEFAULT_CLIENT_METRICS } from "../../../constants";

class ExplorerApiDatasetContentTest extends WrkTestCase {
  // name/purpose of the test
  name = "Test explorer data sets api endpoint /datasets/{ds}/content";

  // fetch Zowe instance version information
  // this can be turned on if TARGET_PORT is Zowe APIML Gateway port
  fetchZoweVersions = true;

  // example: 15 minutes
  duration = 15 * 60;

  // required. endpoint we want to test
  endpoint = '/api/v1/datasets/MYUSER.MYDS(MYMEMBER)/content';

  // optional. example to overwrite default collector options
  serverMetricsCollectorOptions = {
    // interval 0 will disable server side metrics collecting
    // this value 10 means we poll server metrics every 10 seconds
    interval: 10,

    // example to define customized metrics
    metrics: [
      // my special metrics
      "my-special-metric-a", "my-special-metric-b",
      // example to collect CPU time for processes matching "MY*"
      // this is regular expression, please be aware of the special escape characters
      "cpu\\{source=\"rmf.dds\",item=\"MY.*\".+\\}",
    ],
    // also customize what metrics will be used for cpu time calculation
    cputimeMetrics: [
      "cpu\\{source=\"rmf.dds\",item=\"MY.*\".+\\}",
    ],
  };

  // optional. example to overwrite default collector options
  clientMetricsCollectorOptions = {
    // interval 0 will disable server side metrics collecting
    interval: 0,

    // example to define customized metrics
    metrics: [
      ...DEFAULT_CLIENT_METRICS,
      // I also want to collect memory usage
      "memory.heapTotal", "memory.heapUsed",
    ],
  };

  // optional. we can add customized headers
  headers: string[] = ["X-Special-Header: value"];

  async before(): Promise<void> {
    await super.before();

    // this test requires authentication header
    this.headers.push(getBasicAuthorizationHeader());
  }
};

// init test case, this is required
new ExplorerApiDatasetContentTest().init();
```
