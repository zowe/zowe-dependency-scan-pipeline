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

Finally, navigate to https://localhost:19000 and you should see the template being served and rendered locally!

## Start on z/OS

**Notes:**

- `NODE_HOME` environment vairable is required to start ZMS.
- Default ports is `19000` (https) and `19001` (http).

### Install and Start Independently

- Upload the pax file to the server where Zowe is running.
- Create directory `zms` under your favorite directory.
- Change to the new created folder and extract the pax file: `pax -rf /path/to/zms.pax`.
- Run `./bin/start.sh` or `./bin/start.sh &` to start in background.

### Install and Start with Zowe

_Note: this way requires the Zowe runtime user (ZWESVUSR) has SDSF permission._

- Upload the pax file to the server where Zowe is running.
- Create directory `zms` under `<zowe-root-dir>/components`.
- Change to the new created folder and extract the pax file: `pax -rf /path/to/zms.pax`.
- Find the `instance.env` in your Zowe instance directory and edit `EXTERNAL_COMPONENTS=` line to `EXTERNAL_COMPONENTS="${ROOT_DIR}/components/zms/bin"`.
- Restart Zowe.

### Start ZMS in Debug Mode

- Locate the `zms` folder and edit `bin/start.sh`, find line of `$NODE_BIN $SERVER_DIR/src/app.js` and change to `LOG_LEVEL=debug $NODE_BIN $SERVER_DIR/src/app.js` or `LOG_LEVEL=silly $NODE_BIN $SERVER_DIR/src/app.js`.
- Restart Zowe.
