# Zowe Metrics Server (ZMS)

## Build on Your Local

- Install dependencies

```
npm install
```

- Start the project

```
npm start
```

Finally, navigate to https://localhost:19000 and you should see the home page shows `Hello World!`. Navigate to https://localhost:19000/metrics to see the most recent metrics.

## Start on z/OS

**Notes:**

- `NODE_HOME` environment vairable is required to start ZMS.
- Default ports is `19000` (https) and `19001` (http).

### Install and Start Independently

- Upload the pax file to the server where Zowe is running.
- Create directory `zms` under your favorite directory.
- Change to the new created folder and extract the pax file: `pax -rf /path/to/zms.pax`.
- Run `./bin/start.sh` to start the server.
- If you want to keep the ZMS running after you exit USS, run `nohup ./bin/start.sh &` instead. _Remember to kill your ZMS process if you don't need it._

### Install and Start with Zowe

_Note: this way requires the Zowe runtime user (ZWESVUSR) has SDSF permission._

- Upload the pax file to the server where Zowe is running.
- Create directory `zms` under `<zowe-root-dir>/components`.
- Change to the new created folder and extract the pax file: `pax -rf /path/to/zms.pax`.
- Find the `instance.env` in your Zowe instance directory and edit `EXTERNAL_COMPONENTS=` line to `EXTERNAL_COMPONENTS="${ROOT_DIR}/components/zms/bin"`.
- Restart Zowe.

### Start ZMS in Debug Mode

- Locate the `zms` folder and edit `bin/start.sh`, find line of `$NODE_BIN $ZMS_ROOT_DIR/src/app.js` and change to `LOG_LEVEL=debug $NODE_BIN $ZMS_ROOT_DIR/src/app.js` or `LOG_LEVEL=silly $NODE_BIN $ZMS_ROOT_DIR/src/app.js`.
- Restart Zowe if you run ZMS with Zowe, restart ZMS if you run it as independent process.
