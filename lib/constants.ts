import findUp = require("find-up");
import { readdirSync, statSync } from "fs";
import { tmpdir } from "os";
import { dirname, resolve } from "path";

export const ROOT_PATH = dirname(findUp.sync("package.json"));

export const p0 = readdirSync(resolve(ROOT_PATH, "bin"))[0];

// tslint:disable-next-line:no-var-requires
export const PKG = require(resolve(ROOT_PATH, "package.json"));

export const binPath = resolve(ROOT_PATH, "bin", p0);

export const CacheFilePath = resolve(tmpdir(), "uupers/pullpoor", "db.json");

export const VERSION = PKG.version;

const commandsPath = resolve(__dirname, "commands");
export const commands = readdirSync(commandsPath)
    .filter((fileName) => /\.js$/.test(fileName))
    .filter((fileName) => statSync(resolve(commandsPath, fileName)).isFile())
    .map((fileName) => fileName.replace(/\.js$/, ""));

const DEFAULT_COPYRIGHT = "pullpoor";
let copyright = DEFAULT_COPYRIGHT;

export const setCopyright = (str = DEFAULT_COPYRIGHT) => {
    copyright = str;
};

export const getCopyright = () => copyright;

export const CHECK_THREAD = 100;
export const CHECK_TIMEOUT = 3000;
