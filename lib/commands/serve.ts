import express = require("express");
import { existsSync } from "fs";
import { merge, sample } from "lodash";
import ora = require("ora");
import { networkInterfaces } from "os";
import * as core from "pullpoor-core";
import request = require("request");
import { CacheFilePath } from "../constants";
import { getArgv } from "../helpers/argv";
import * as cache from "../helpers/cache";
import { exit } from "../helpers/exit";

const argv = getArgv({
    alias: {
        p: "port"
    },
    default: {
        port: 7000 + parseInt(`${Math.random() * 3000}`, 10)
    },
    string: ["port"]
});

export const handler = async () => {
    await init();

    // TODO: 启动定时获取

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
        const proxyUri = sample(core.getNotes());
        const opts = merge(keys.reduce((obj, key) => {
            obj[key] = req[key];
            return obj;
        }, { } as any), {
            proxy: proxyUri,
            timeout: 5000
        });
        request(opts, (err) => {
            if (err) {
                res.status(502);
                res.end();
            }
            return;
        }).pipe(res);
    });

    const spinner = ora("Setup Server").start();
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
        const list = await core.catchNotes();
        spinner.succeed(`Catched ${list.length} Notes`);
    } catch (error) {
        spinner.fail();
    }

    cache.saveAsync();

    // TODO: 检查代理可用性
};
