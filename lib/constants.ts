import findUp = require("find-up");
import { readdirSync, statSync } from "fs";
import { tmpdir } from "os";
import { dirname, resolve } from "path";

export const rootPath = dirname(findUp.sync("package.json"));

export const p0 = readdirSync(resolve(rootPath, "bin"))[0];

// tslint:disable-next-line:no-var-requires
export const pkg = require(resolve(rootPath, "package.json"));

export const binPath = resolve(rootPath, "bin", p0);

export const CacheFilePath = resolve(tmpdir(), "uupers/pullpoor", "db.json");

export const version = pkg.version;

const commandsPath = resolve(__dirname, "commands");
export const commands = readdirSync(commandsPath)
    .filter((fileName) => /\.js$/.test(fileName))
    .filter((fileName) => statSync(resolve(commandsPath, fileName)).isFile())
    .map((fileName) => fileName.replace(/\.js$/, ""));
