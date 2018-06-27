import minimist = require("minimist");

export const argv = minimist(process.argv.slice(2), {
    boolean: ["deploy", "useCache", "detach"],
    default: {
        deploy: false,
        useCache: true
    },
    string: ["publish"]
});
