import * as date from "dtss";
import { URL } from "url";
import { getHTML } from "../utils";
import { BaseBank } from "./base";

class Bank extends BaseBank {

    protected addrs =  [
        // 全国
        "on",
        // 电信
        "%B5%E7%D0%C5",
        // 联通
        "%C1%AA%CD%A8",
        // 移动
        "%D2%C6%B6%AF"
    ].map((item) => {
            const url = new URL("http://www.89ip.cn/tiqv.php");
            url.searchParams.set("sxb", "");
            url.searchParams.set("tqsl", "1000");
            url.searchParams.set("ports", "");
            url.searchParams.set("ktip", "");
            url.searchParams.set("submit", "%CC%E1++%C8%A1");
            url.searchParams.set("xl", item);
            return url.toString();
        });

    protected expiredAt = date.m(30);

    protected getBanknotes(addr: string) {
        return getHTML(addr)
            .then(($) => $(".mass").html().replace(/\s+/g, ""))
            .then((html) => {
                return html
                    .match(/(\d+\.){3}\d+:\d+(?!:<br>)/gi)
                    .map((item) => item.toString())
                    .map((item) => `http://${item}`);
            });
    }
}

export const bank = new Bank();
