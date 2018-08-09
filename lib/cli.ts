import CFonts = require("cfonts");
import updateNotifier = require("update-notifier");
import { commands, getCopyright, PKG } from "./constants";
import { command, getArgv } from "./helpers/argv";

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
        updateNotifier({ pkg: PKG }).notify();
        CFonts.say(getCopyright(), { align: "left", font: "block" });
    }
    // tslint:disable-next-line:no-var-requires
    require(`./commands/${command}`).handler();
} else {
    updateNotifier({ pkg: PKG }).notify();
    CFonts.say(getCopyright(), { align: "left", font: "block" });
    // tslint:disable-next-line:no-var-requires
    require("./commands/prompt").handler();
}
