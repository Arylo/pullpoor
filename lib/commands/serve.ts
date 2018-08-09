import express = require("express");
import { existsSync } from "fs";
import { difference, merge, sample, sampleSize } from "lodash";
import schedule = require("node-schedule");
import ora = require("ora");
import { networkInterfaces } from "os";
import * as core from "pullpoor-core";
import request = require("request");
import { CacheFilePath } from "../constants";
import { getArgv } from "../helpers/argv";
import * as cache from "../helpers/cache";
import { getNote, list, setNoteStatus } from "../helpers/checker";
import { exit } from "../helpers/exit";
import { checkNotes } from "./../helpers/checker";

const argv = getArgv({
    alias: {
        p: "port"
    },
    default: {
        port: 7000 + parseInt(`${Math.random() * 3000}`, 10),
        thread: 250,
        timeout: 3000
    },
    string: ["port", "thread", "timeout"]
});

if (typeof argv.port !== "number" || argv.port < 0) {
    exit("Port Field must number");
}

if (typeof argv.timeout !== "number" || argv.timeout < 0) {
    exit("Timeout Field must number");
}

if (typeof argv.thread !== "number" || argv.thread <= 0) {
    exit("Thread Field must number");
}

export const handler = async () => {
    let spinner;
    await init();

    spinner = ora("Setup Timer").start();
    startTimer();
    spinner.succeed();

    const app = express();
    const keys = [
        "domain",
        "headers",
        "url",
        "method",
        "baseUrl",
        "originalUrl",
        "params",
        "query"
    ];

    app.use((req, res) => {
        const opts = merge(keys.reduce((obj, key) => {
            obj[key] = req[key];
            return obj;
        }, { } as any), {
            proxy: getNote(),
            timeout: argv.timeout
        });
        request(opts, (err) => {
            setNoteStatus(opts.proxy, !!err);
            if (err) {
                res.status(502);
                res.end();
            }
            return;
        }).pipe(res);
    });

    spinner = ora("Setup Server").start();
    return app.listen(argv.p, "0.0.0.0", (err) => {
        if (err) {
            spinner.fail();
            exit(err);
        }
        spinner.succeed();
        const urlsText = Object.keys(networkInterfaces())
            .reduce((arr, device) => {
                const addresses = networkInterfaces()[device]
                    .filter((info) => info.family === "IPv4")
                    .map((info) => info.address)
                    .sort();
                arr.push(...addresses);
                return arr;
            }, [ ])
            .map((ip) => `  http://${ip}:${argv.p}`)
            .join("\n");
        process.stdout.write(`Proxy Server Urls:\n${urlsText}\n`);
    });
};

export const init = async () => {
    let spinner;
    if (existsSync(CacheFilePath)) {
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
        const noteList = await core.catchNotes();
        spinner.succeed(`Catched ${noteList.length} Notes`);
    } catch (error) {
        spinner.fail();
    }

    cache.saveAsync();

    spinner = ora("Some Notes Checking").start();
    const num = Math.max(Math.ceil(core.getNotes().length * 0.2), argv.thread);
    const checkList = sampleSize(core.getNotes(), num);
    await checkNotes(checkList, argv.thread);
    spinner.succeed("Some Notes Checked");
    ora(`Have ${list.checked.length - list.blocked.length} Notes`).start().info();
};

export const startTimer = () => {
    const isRunningMap = {
        catch: false,
        check: false
    };
    const j = schedule.scheduleJob("*/15 * * * *", async () => {
        if (isRunningMap.catch) {
            return;
        }
        isRunningMap.catch = true;
        try {
            await core.catchNotes();
            cache.saveAsync();
        // tslint:disable-next-line:no-empty
        } catch (error) { }
        isRunningMap.catch = false;
    });
    schedule.scheduleJob("*/2 * * * *", async () => {
        if (isRunningMap.check) {
            return;
        }
        isRunningMap.check = true;
        // 新增检查
        const newList = difference(core.getNotes(), list.checked);
        const num = Math.max(Math.ceil(core.getNotes().length * 0.2), argv.thread);
        await checkNotes(sampleSize(newList, num), argv.thread);
        // 二次检查
        const blockList = [ ];
        const checkList = difference(list.checked, newList, list.blocked);
        await checkNotes(sampleSize(checkList, Math.ceil(checkList.length * 0.2)), argv.thread, {
            noteCb: (err, uri) => {
                if (err) {
                    blockList.push(uri);
                }
            }
        });
        // 败者复活
        checkNotes(sampleSize(difference(list.blocked, blockList), 10), 10);
        isRunningMap.check = false;
    });
};
