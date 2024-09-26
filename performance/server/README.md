# Zowe Metrics Server (ZMS)

## Build on Your Local

- Prerequisites

  * Node.js [v10.x LTS](https://nodejs.org/docs/latest-v10.x/api/index.html) or above

- Install dependencies

  ```
  npm install
  ```

- Start the project

  ```
  npm start
  ```

Finally, navigate to https://localhost:19000 and you should see the home page shows `zms`. Navigate to https://localhost:19000/metrics to see the most recent metrics.

## Start on z/OS

**Notes:**

- `NODE_HOME` or `NVM_BIN` environment variable is required to start ZMS with `bin/start.sh`.
- Default ports is `19000` (https) and `19001` (http).
- You can find the latest development build from [Zowe Artifactory org.zowe.metrics-server Folder](https://zowe.jfrog.io/zowe/webapp/#/artifacts/browse/tree/General/libs-snapshot-local/org/zowe/metrics-server/).

### Install and Start Independently

- Upload the pax file to the server where Zowe is running.
- Create directory `zms` under your favorite directory.
- Change to the new created folder and extract the pax file: `pax -rf /path/to/zms.pax`.
- Run `./bin/start.sh` to start the server.
- If you want to keep the ZMS running after you exit USS, run `nohup ./bin/start.sh &` instead. _Remember to kill your ZMS process if you don't need it._
- If you want to modify configurations, `configs/index.yaml` is the file to go.

### Install and Start with Zowe

_Note: this way requires the Zowe runtime user (ZWESVUSR) has SDSF permission._

- Upload the pax file to the server where Zowe is running.
- Create directory `zms` under `<zowe-root-dir>/components`.
- Change to the new created folder and extract the pax file: `pax -rf /path/to/zms.pax`.
- Find the `instance.env` in your Zowe instance directory and edit `EXTERNAL_COMPONENTS=` line to `EXTERNAL_COMPONENTS="${ROOT_DIR}/components/zms/bin"`.
- Restart Zowe.

### Start ZMS in Debug Mode

- Locate the `zms` folder and edit `bin/start.sh`, find line of `$NODE_BIN $ZMS_ROOT_DIR/dist/app.js` and change to `LOG_LEVEL=debug $NODE_BIN $ZMS_ROOT_DIR/dist/app.js` or `LOG_LEVEL=silly $NODE_BIN $ZMS_ROOT_DIR/dist/app.js`.
- Restart Zowe if you run ZMS with Zowe, restart ZMS if you run it as independent process.

## Start ZMS in Docker Container

We temporarily published Zowe Metrics Server docker image as `jackjiaibm/zowe-metrics-server`.

**Please note, running Zowe Metrics Server in Docker doesn't support SDSF collectors, only RMF-DDS collector is supported.**

To start the container,

```
docker run --rm \
  -e RMF_DDS_HOST=<your-rmf-dds-server> \
  -p 19000:19000 -p 19001:19001 \
  jackjiaibm/zowe-metrics-server 
```

You can overwrite your RMF-DDS server with these environment variables based on your server settings:

- **RMF_DDS_PROTOCOL**: optional, default is `http`. This is the protocol of your RMF-DDS server. You can change it to `https` if you have SSL connection.
- **RMF_DDS_HOST**: required. This is the host name / domain of your RMF-DDS server.
- **RMF_DDS_PORT**: optional, default is `8803`. This is the port of your RMF-DDS server.
- **RMF_DDS_USERNAME**: optional, default is empty. This is the username connecting to your RMF-DDS server.
- **RMF_DDS_PASSWORD**: optional, default is empty. This is the password connecting to your RMF-DDS server.

To enable debug mode, you can define environment variable `LOG_LEVEL` and assign it with `debug` or `silly`.

Here is an example with all those variables in place:

```
docker run --rm \
  -e RMF_DDS_PROTOCOL=https \
  -e RMF_DDS_HOST=<your-rmf-dds-server> \
  -e RMF_DDS_PORT=8803 \
  -e RMF_DDS_USERNAME=jack \
  -e RMF_DDS_PASSWORD=beanstlk \
  -e LOG_LEVEL=debug \
  -p 19000:19000 -p 19001:19001 \
  jackjiaibm/zowe-metrics-server 
```
