import * as date from "dtss";
import fs = require("fs");
import lodash = require("lodash");
import rimraf = require("rimraf");
import gitModule = require("simple-git");
import { argv } from "./args";
import { DB_STORY_PATH } from "./db";

export const process = lodash.debounce(async () => {
    const token: string = argv.publish;
    await rimraf.sync(`${DB_STORY_PATH}/.git`);
    fs.createReadStream(`${DB_STORY_PATH}/../README.md`)
        .pipe(fs.createWriteStream(`${DB_STORY_PATH}/README.md`));
    const branchname = `bran${Date.now()}`;
    gitModule(DB_STORY_PATH)
        .init()
        .add(`${DB_STORY_PATH}/*`)
        .commit("Update Stories")
        .checkout(["-b", branchname])
        .addRemote("origin", `https://${token}@github.com/uupers/pullpoor.git`)
        .fetch("origin")
        .push(["origin", `${branchname}:static`, "-f"]);
    return true;
}, date.s(30));
