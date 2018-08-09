import { existsSync, statSync, writeFileSync } from "fs";
import makeDir = require("make-dir");
import minimist = require("minimist");
import ora = require("ora");
import { dirname } from "path";
import ProgressBar = require("progress");
import * as core from "pullpoor-core";
import { CacheFilePath, CHECK_THREAD, CHECK_TIMEOUT, VERSION } from "../constants";
import { getArgv } from "../helpers/argv";
import * as cache from "../helpers/cache";
import * as checker from "../helpers/checker";
import { exit } from "../helpers/exit";
import { FILE_OPTIONS } from "../helpers/options";
import { realPath } from "../helpers/realPath";

interface IArgv extends minimist.ParsedArgs {
    useCache: boolean;
    format: "json" | "plain";
    timeout: number;
    thread: number;
    check: boolean;
}

const argv = getArgv({
    boolean: ["useCache", "check"],
    default: {
        check: false,
        format: "json",
        thread: CHECK_THREAD,
        timeout: CHECK_TIMEOUT,
        useCache: true
    },
    string: ["format", "thread"]
}) as IArgv;

if (argv.check && typeof argv.timeout !== "number" || argv.timeout < 0) {
    exit("Timeout Field must number");
}

if (argv.check && typeof argv.thread !== "number" || argv.thread <= 0) {
    exit("Thread Field must number");
}

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

    if (argv.check) {
        const list = core.getNotes();
        const bar = new ProgressBar("Checking [:bar] :rate/ips :percent :etas", {
            total: list.length,
            width: 20
        });
        checker.setTimeout(argv.timeout);
        await checker.checkNotes(list, argv.thread, {
            noteCb: () => {
                bar.tick();
            }
        });
        ora(`Have ${checker.getTrueList().length} Notes`).start().info();
    }

    try {
        spinner = ora("Saving File").start();
        if (!existsSync(dirname(filePath))) {
            makeDir.sync(dirname(filePath));
        }
        const list = argv.check ? checker.getTrueList() : core.getNotes();
        const data = JSON.stringify({
            createdAt: Date.now(),
            length: list.length,
            list,
            version: VERSION
        }, null, 2);
        writeFileSync(filePath, data, FILE_OPTIONS);
        spinner.succeed(`Saved File to ${filePath}`);
    } catch (error) {
        spinner.fail();
        throw error;
    }
    return true;
};
