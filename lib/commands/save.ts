import { existsSync, readFileSync, writeFileSync } from "fs";
import makeDir = require("make-dir");
import minimist = require("minimist");
import ora = require("ora");
import { tmpdir } from "os";
import { dirname, resolve } from "path";
import * as core from "pullpoor-core";
import { getArgv } from "../argv";
import { realPath } from "../helpers/realPath";

interface IArgv extends minimist.ParsedArgs {
    useCache: boolean;
    format: "json" | "plain";
}

const argv = getArgv({
    boolean: ["useCache"],
    default: {
        format: "json",
        useCache: true
    },
    string: ["format"]
}) as IArgv;

const CacheFilePath = resolve(tmpdir(), "uupers/pullpoor", "db.json");

const FILE_OPTIONS = {
    encoding: "utf-8"
};

export const handler = async (p = argv._[1]) => {
    if (!p) {
        // TODO:
        return;
    }
    let spinner;

    if (argv.useCache && existsSync(CacheFilePath)) {
        spinner = ora("Loading Cache File").start();
        try {
            core.init(JSON.parse(readFileSync(CacheFilePath, FILE_OPTIONS)));
            spinner.succeed("Loaded Cache File");
        } catch (error) {
            spinner.fail();
        }
    }

    try {
        spinner = ora("Catching Notes").start();
        const list = await core.catchNotes();
        spinner.succeed(`Catched ${list.length} Notes`);
    } catch (error) {
        spinner.fail();
    }

    if (argv.useCache) {
        spinner = ora("Saving Cache File").start();
        if (!existsSync(dirname(CacheFilePath))) {
            makeDir.sync(dirname(CacheFilePath));
        }
        const cacheData = JSON.stringify(core.get()) || { };
        try {
            writeFileSync(CacheFilePath, cacheData, FILE_OPTIONS);
            spinner.succeed(`Saved Cache File to ${CacheFilePath}`);
        } catch (error) {
            spinner.fail();
        }
    }

    try {
        spinner = ora("Saving File").start();
        const filePath = realPath(p);
        if (!existsSync(dirname(filePath))) {
            makeDir.sync(dirname(filePath));
        }
        const data = JSON.stringify({
            createdAt: Date.now(),
            length: core.getNotes().length,
            list: core.getNotes()
        }, null, 2);
        writeFileSync(filePath, data, FILE_OPTIONS);
        spinner.succeed(`Saved File to ${filePath}`);
    } catch (error) {
        spinner.fail();
        throw error;
    }
    return true;
};
