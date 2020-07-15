# Zowe Performance Test Client

Perform performance test on the target server.

## Programming Language And Main Testing Method

- Node.js, with recommended [v12.x LTS](https://nodejs.org/docs/latest-v10.x/api/index.html)
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

The test report will be saved in `reports` folder by default. This can be customized in `jest.config.js`.

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

  // test will last 10 minutes
  duration = 600;

  // my custom property
  myTestOption: string = "value";

  async before(): Promise<any> {
    // call parent
    await super.before();

    // prepare my environment before I start
    await howToPrepareMyTest(this.myTestOption);
  }

  async after(): Promise<any> {
    // call parent
    await super.after();

    // clean up my environment after my test
    await howToCleanup(this.myTestOption);
  }

  async run(): Promise<any> {
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
  name = "Test explorer api endpoint /datasets/{ds}/content";

  // example: 15 minutes
  duration = 15 * 60;

  // endpoint we want to test
  endpoint = '/api/v1/datasets/MYUSER.MYDS(MYMEMBER)/content';

  // example to overwrite default collector options
  serverMetricsCollectorOptions = {
    // interval 0 will disable server side metrics collecting
    // this value 10 means we poll server metrics every 10 seconds
    interval: 10,

    // example to define customized metrics
    metrics: [
      // my special metrics
      "my-special-metric-a", "my-special-metric-b",
      // example to collect CPU time for processes matching "MY*"
      "CPU\\{process=\"MY.*\"\\}",
    ],
  };

  // example to overwrite default collector options
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

  // we can add customized headers
  headers: string[] = ["X-Special-Header: value"];

  async before(): Promise<any> {
    await super.before();

    // this test requires authentication header
    this.headers.push(getBasicAuthorizationHeader());
  }
};

// init test case, this is required
new ExplorerApiDatasetContentTest().init();
```
