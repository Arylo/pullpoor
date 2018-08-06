import * as minimist from "minimist";

const DEFAULT_ARGV_OPTIONS: minimist.Opts = {
    alias: {
        h: "help",
        v: "version"
    },
    boolean: [ "help", "version"  ]
};

export const getArgv = (opts = DEFAULT_ARGV_OPTIONS) => {
    return minimist(process.argv.slice(2), opts);
};

export const command = getArgv()._[0];
