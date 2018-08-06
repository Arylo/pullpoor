import { binPath, commands, p0, version } from "../constants";

export const handler = () => {
    process.stdout.write([
        "",
        `Usage: ${p0} <command>`,
        "",
        "where <command> is one of",
        `  ${commands.join(", ")}`,
        "",
        `${p0}@${version} ${binPath}`
    ].join("\n"));
};
