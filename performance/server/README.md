# Zowe Performance Server

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

## Install and Start with Zowe

- Upload the pax file to the server where Zowe is running.
- Create directory `zms` under `<zowe-root-dir>/components`.
- Change to the new created folder and extract the pax file: `pax -rf /path/to/zms.pax`.
- Find the `instance.env` in your Zowe instance directory and edit `EXTERNAL_COMPONENTS=` line to `EXTERNAL_COMPONENTS="${ROOT_DIR}/components/zms/bin"`.
- Restart Zowe.
