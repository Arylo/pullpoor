import { existsSync, readFileSync, writeFileSync } from "fs";
import makeDir = require("make-dir");
import { dirname } from "path";
import * as core from "pullpoor-core";
import { CacheFilePath } from "../constants";
import { FILE_OPTIONS } from "./options";

export const load = () => {
    return core.init(JSON.parse(readFileSync(CacheFilePath, FILE_OPTIONS)));
};

export const save = () => {
    if (!existsSync(dirname(CacheFilePath))) {
        makeDir.sync(dirname(CacheFilePath));
    }
    const cacheData = JSON.stringify(core.get()) || { };
    writeFileSync(CacheFilePath, cacheData, FILE_OPTIONS);
};
