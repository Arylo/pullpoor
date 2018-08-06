import CFonts = require("cfonts");
import updateNotifier = require("update-notifier");
import { command, getArgv } from "./argv";
import { commands, pkg } from "./constants";

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

if (command && commands.indexOf(command) !== -1) {
    if (["help", "version"].indexOf(command) === -1) {
        updateNotifier({ pkg }).notify();
        CFonts.say("UUPERS", { align: "left", font: "block" });
    }
    // tslint:disable-next-line:no-var-requires
    require(`./commands/${command}`).handler();
} else {
    updateNotifier({ pkg }).notify();
    CFonts.say("UUPERS", { align: "left", font: "block" });
    // tslint:disable-next-line:no-var-requires
    require("./commands/prompt").handler();
}
