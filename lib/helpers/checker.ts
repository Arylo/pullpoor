import { difference, sample } from "lodash";
import * as core from "pullpoor-core";
import request = require("request");
import { CHECK_TIMEOUT } from "../constants";

const list = {
    blocked: [ ],
    checked: [ ]
};
let timeout = CHECK_TIMEOUT;

const getCheckedNote = (index = 0): string => {
    let note: string;
    if (index >= 10) {
        note = sample(difference(list.checked, list.blocked));
        return note ? note : sample(core.getNotes());
    }
    note = sample(core.getNotes());
    if (list.checked.length === list.blocked.length) {
        return note;
    }
    if (list.blocked.indexOf(note) !== -1) {
        return getCheckedNote(index + 1);
    }
    return note;
};

export const getNote = () => {
    return getCheckedNote();
};

export const setNoteStatus = (note: string, isBlock: boolean) => {
    if (list.checked.indexOf(note) === -1) {
        list.checked.push(note);
    }
    const index = list.blocked.indexOf(note);
    if (isBlock && index === -1) {
        list.blocked.push(note);
    } else if (!isBlock && index !== -1) {
        list.blocked.splice(index, 1);
    }
};

const getCheckUrl = () => {
    return sample([
        "http://ip-api.com/json",
        "http://www.baidu.com",
        "http://www.qq.com",
        "http://www.ip138.com"
    ]);
};

export const checkNotes = async (notes: string[], threadNum: number, cbs?) => {
    if (cbs && typeof cbs === "function") {
        cbs = {
            groupCb: cbs
        };
    }
    const l = Math.ceil(notes.length / threadNum);
    for (let i = 0; i < l; i++) {
        const start = i * threadNum;
        const end = Math.min(start + threadNum, notes.length);
        const arr = [ ];
        for (const uri of notes.slice(start, end)) {
            const opts = { timeout, proxy: uri };
            const p = new Promise((resolve) => {
                request.head(getCheckUrl(), opts, (err) => {
                    setNoteStatus(uri, !!err);
                    if (typeof (cbs || { }).noteCb === "function") {
                        cbs.noteCb(err, uri);
                    }
                    resolve();
                });
            });
            arr.push(p);
        }
        await Promise.all(arr);
        if (typeof (cbs || { }).groupCb === "function") {
            cbs.groupCb();
        }
    }
};

export const getBlockList = () => {
    return list.blocked;
};

export const getCheckList = () => {
    return list.checked;
};

export const getTrueList = () => {
    return difference(list.checked, list.blocked);
};

export const setTimeout = (num: number) => {
    timeout = num;
};
