import { URL } from "url";

import cheerio = require("cheerio");
import { merge } from "lodash";
import ua = require("random-useragent");
import rp = require("request-promise");

export const sleep = (time: number) => {
    return new Promise((reslove) => {
        setTimeout(reslove, time);
    });
};

const getOptions = {
    headers: {
        "Cache-Control": "max-age=0",
        "Connection": "keep-alive"
    },
    method: "GET",
    timeout: 60 * 1000
};

export const getHTML = (url: string, opts?) => {
    const options = merge({ }, getOptions, {
        headers: {
            "Host": new URL(url).host,
            "Referer": url,
            "User-Agent": ua.getRandom()
        },
        uri: url,
        transform(body) {
            return cheerio.load(body);
        }
    }, opts);
    return rp(options);
};

export const getJSON = (url: string, opts?) => {
    const options = merge({ }, getOptions, {
        headers: {
            "Host": new URL(url).host,
            "Referer": url,
            "User-Agent": ua.getRandom()
        },
        uri: url,
        transform(body) {
            return typeof body === "string" ? JSON.parse(body) : body;
        }
    }, opts);
    return rp(options);
};
