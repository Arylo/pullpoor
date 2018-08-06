import { isAbsolute, resolve } from "path";
import { exit } from "./exit";

export const realPath = (p?: string) => {
    if (!p) {
        exit("Invalid Path");
    }
    p += "";
    if (!isAbsolute(p)) {
        p = resolve(process.cwd(), p);
        if (!isAbsolute(p)) {
            exit("Invalid Path");
        }
    }
    return p;
};
