import CFonts = require("cfonts");
import { command, getArgv } from "./argv";

const argv = getArgv();

if (argv.v) {
    // tslint:disable-next-line:no-var-requires
    require("./commands/version").handler();
    process.exit();
}

if (argv.h) {
    // tslint:disable-next-line:no-var-requires
    require("./commands/help").handler();
    process.exit();
}

switch (command) {
    case "prompt":
    case "save":
        CFonts.say("UUPERS", { align: "left", font: "block" });
    case "help":
    case "version":
        // tslint:disable-next-line:no-var-requires
        require(`./commands/${command}`).handler();
        break;
    default:
        CFonts.say("UUPERS", { align: "left", font: "block" });
        // tslint:disable-next-line:no-var-requires
        require("./commands/prompt").handler();
        break;
}
