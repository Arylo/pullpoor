import { binPath, commands, p0, VERSION } from "../constants";

export const handler = () => {
    process.stdout.write([
        "",
        `Usage: ${p0} <command>`,
        "",
        "where <command> is one of",
        `  ${commands.join(", ")}`,
        "",
        `${p0}@${VERSION} ${binPath}`
    ].join("\n"));
};
