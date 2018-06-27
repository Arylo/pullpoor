import cheerio = require("cheerio");
import * as date from "dtss";
import { getHTML } from "../utils";
import { BaseBank } from "./base";

class Bank extends BaseBank {

    protected addrs = [
        "http://ip.yqie.com/ipproxy.htm"
    ];

    protected expiredAt = date.h(3);

    protected async getBanknotes(addr: string) {
        const list: string[] = [ ];
        const tables = await getHTML(addr)
            .then(($) => $("table"));
        for (let i = 0; i < tables.length - 1; i++) {
            const table = tables.eq(i);
            const trs = cheerio("tbody tr", table);
            for (let j = 1; j < trs.length; j++) {
                const tr = trs.eq(j);
                const tds = cheerio("td", tr);
                const texts =
                    [4, 0, 1].map((index) => tds.eq(index).text());
                const url =
                    `${texts[0].toLowerCase()}://${texts[1]}:${texts[2]}`;
                list.push(url);
            }
        }
        return list;
    }

}

export const bank = new Bank();
