import inquirer = require("inquirer");
import { commands } from "../constants";

export const handler = async () => {
    const firstUpWordFn = (word) => {
        return word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase();
    };
    const choices = commands
        .filter((cmd) => ["version", "prompt"].indexOf(cmd) === -1)
        .map((cmd) => cmd.replace(/^./, firstUpWordFn));
    const { action } = await inquirer.prompt({
        choices: (choices as any[]).concat([new inquirer.Separator(), "Exit"]),
        message: "What do you need to do?",
        name: "action",
        type: "list",
    }) as { action: string; };
    if (action === "Exit") {
        process.exit();
    }
    switch (action) {
        case "Save":
            const { p } = await inquirer.prompt({
                message: "Please enter the file save path",
                name: "p",
                type: "input",
            }) as { p: string; };
            require(`./${action}`).handler(p);
            break;
        default:
            require(`./${action}`).handler();
            break;
    }
};
