import { existsSync, readFileSync, writeFile, writeFileSync } from "fs";
import makeDir = require("make-dir");
import { dirname } from "path";
import * as core from "pullpoor-core";
import { promisify } from "util";
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

const writeFileAsync = promisify(writeFile);

export const saveAsync = () => {
    if (!existsSync(dirname(CacheFilePath))) {
        makeDir.sync(dirname(CacheFilePath));
    }
    const cacheData = JSON.stringify(core.get()) || { };
    writeFileAsync(CacheFilePath, cacheData, FILE_OPTIONS);
};
