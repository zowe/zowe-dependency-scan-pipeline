## Usage

`yarn install`

`yarn build && node lib/index.js`

Executing `node lib/index.js` from npm script context will not work (with either npm or yarn as invocation method). ENV's are populated which interfere with cloned project dependency resolutions.

This project requires the [ORT CLI](https://github.com/oss-review-toolkit/ort) version 12+ to be installed and available on the PATH.

This project requires any of the following to be installed in order for ORT to scan projects within Zowe:

* Node 16+
* Java 11 or Java 17. Newer Javas could work but are untested.
* Rust + Cargo
* Cargo packages: `cargo-license` and `get-license-helper`

Alternatively to installing the above pre-reqs, you can build and run the Dockerfile in `.dockerfiles/ort.Dockerfile`, and then mount/run the dependency scan tool from there.
