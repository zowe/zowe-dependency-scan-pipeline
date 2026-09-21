import * as fs from "fs";
import { Constants } from "../../constants/Constants";

export class OrtBaseAction {
    constructor() {
        if (!fs.existsSync(Constants.ORT_PROG_FILE)) {
            throw new Error(`Program file 'ort' was not found at '${Constants.ORT_PROG_FILE}'. Environment variable ORT_BIN must point to the directory containing the ort executable.`);
        }
    }
}