
export const exit = (msg: string | string[], code = 1) => {
    const msgs = Array.isArray(msg) ? msg : [msg];
    process.stderr.write(msgs.join(" "));
    process.exit(1);
};
