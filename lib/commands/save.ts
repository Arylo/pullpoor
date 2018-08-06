import { existsSync, readFileSync, statSync, writeFileSync } from "fs";
import makeDir = require("make-dir");
import minimist = require("minimist");
import ora = require("ora");
import { dirname } from "path";
import * as core from "pullpoor-core";
import { getArgv } from "../argv";
import { CacheFilePath } from "../constants";
import * as cache from "../helpers/cache";
import { exit } from "../helpers/exit";
import { FILE_OPTIONS } from "../helpers/options";
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

export const handler = async (p = argv._[1]) => {
    if (!p) {
        exit("Miss the file path");
        return;
    }
    let spinner;
    const filePath = realPath(p);

    if (existsSync(filePath) && !statSync(filePath).isFile()) {
        exit("The path isn't a file path");
        return;
    }

    if (argv.useCache && existsSync(CacheFilePath)) {
        spinner = ora("Loading Cache File").start();
        try {
            cache.load();
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
        try {
            cache.save();
            spinner.succeed(`Saved Cache File to ${CacheFilePath}`);
        } catch (error) {
            spinner.fail();
        }
    }

    try {
        spinner = ora("Saving File").start();
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
