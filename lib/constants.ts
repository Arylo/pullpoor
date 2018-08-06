import findUp = require("find-up");
import { readdirSync } from "fs";
import { dirname, resolve } from "path";

export const rootPath = dirname(findUp.sync("package.json"));

export const p0 = readdirSync(resolve(rootPath, "bin"))[0];

// tslint:disable-next-line:no-var-requires
export const pkg = require(resolve(rootPath, "package.json"));

export const binPath = resolve(rootPath, "bin", p0);

export const version = pkg.version;

export const commands = readdirSync(resolve(__dirname, "commands"))
    .filter((fileName) => /\.js$/.test(fileName))
    .map((fileName) => fileName.replace(/\.js$/, ""));
