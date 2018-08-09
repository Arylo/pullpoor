import { resolve } from "path";
import * as core from "pullpoor-core";
import * as constants from "../constants";

export const handler = () => {
    process.stdout.write([
        `Cli:  ${constants.VERSION}`,
        `Core: ${core.version()}`
    ].join("\n"));
};
