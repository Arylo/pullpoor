import debug = require("debug");
import * as date from "dtss";
import { EventEmitter } from "events";
import isUrl = require("is-url");
import * as lodash from "lodash";
import * as path from "path";
import stackTrace = require("stack-trace");
import { URL } from "url";
import { dbMemery } from "../db";
import { sleep } from "../utils";

export interface IBanknote {
    /** 编码 */
    id: string;
    /** 生产日期 */
    createdAt: number;
}

const StoreEvent = {
    ADD: Symbol("ADD"),
    BROKEN: Symbol("BROKEN")
};

export class Store extends EventEmitter {
    /** 有效时间 */
    private readonly VALID_PERIOD = date.d(3);
    private source: string;
    /** 票库记录列表 */
    private list: IBanknote[] = [ ];
    private updatedAt = 0;

    constructor(source: string) {
        super();
        this.source = source;
        try {
            // 加载旧记录
            const obj = dbMemery.get("banks").get(source).value();
            this.list = obj.list;
            this.updatedAt = obj.updatedAt;
        // tslint:disable-next-line:no-empty
        } catch (error) { }
    }

    private brokenFakeBanknote() {
        const now = Date.now();
        const list = lodash.remove(this.list, (m) => {
            return (m.createdAt + this.VALID_PERIOD) < now;
        });
        if (list.length !== 0) {
            this.emit(StoreEvent.BROKEN, this.source);
        }
    }

    public add(ids: string[] = [ ]) {
        this.brokenFakeBanknote();
        const banknoteSet = new Set<string>(
            lodash.flatMap(this.list, (obj) => obj.id)
        );
        const newBanknotes = ids.filter((m) => !banknoteSet.has(m));
        if (newBanknotes.length === 0) {
            this.emit(StoreEvent.ADD, this.source, newBanknotes.length);
            return this;
        }
        this.updatedAt = Date.now();
        this.list.push(...lodash.map(newBanknotes, (m) => {
            return { id: m, createdAt: this.updatedAt };
        }));
        this.save();
        this.emit(StoreEvent.ADD, this.source, newBanknotes.length);
        return this;
    }

    public get() {
        return {
            length: this.list.length,
            list: this.list,
            source: this.source,
            updatedAt: this.updatedAt
        };
    }

    private save() {
        dbMemery.get("banks").set(this.source, this.get()).write();
    }
}

export const BankEvent = {
    CACHED: Symbol("CACHED"),
    END: Symbol("END"),
    FAIL: Symbol("FAIL"),
    RETRY: Symbol("RETRY"),
    SKIP: Symbol("SKIP"),
    START: Symbol("START"),
    SUCCESS: Symbol("SUCCESS"),
};

// tslint:disable-next-line:max-classes-per-file
export abstract class BaseBank extends EventEmitter {

    protected readonly RECONNECT_NUM = 10;
    protected readonly DISTANCE_TIME = 200;
    /** 行名 */
    protected readonly NAME = this.getName();

    private log = debug(`bandits:banks:${this.NAME}`);
    protected skip = false;
    /** 地址 */
    protected addrs: string[] = [ ];
    /** 票库 */
    protected store = new Store(this.NAME);
    protected expiredAt = date.m(5);

    private getName() {
        const trace = stackTrace.get();
        // 0: BaseBank.getName
        // 1: class BaseBank
        // 2: child class
        const filename = trace[2].getFileName();
        return path.basename(filename).replace(/\.[tj]s$/, "");
    }

    protected getAddrs(): PromiseLike<string[]> {
        return Promise.resolve([ ]);
    }

    protected getBanknotes(addr: string): PromiseLike<string[]> {
        return Promise.resolve([ ]);
    }

    private async runGetAddrs(index = 0): Promise<string[]> {
        try {
            return await this.getAddrs();
        } catch (error) {
            if (index < this.RECONNECT_NUM) {
                return this.runGetAddrs(++index);
            }
            return [ ];
        }
    }

    private async runGetBanknotes(addr: string, index = 0): Promise<string[]> {
        try {
            return await this.getBanknotes(addr);
        } catch (error) {
            if (index < this.RECONNECT_NUM) {
                return this.runGetBanknotes(addr, ++index);
            }
            return [ ];
        }
    }

    public readonly start = async (index = 0): Promise<Store> => {
        if (this.skip) {
            this.log("Skip");
            this.emit(BankEvent.SKIP, this.NAME);
            return this.store;
        }
        if ((Date.now() - this.store.get().updatedAt) <= this.expiredAt) {
            this.log("Use Cache");
            this.emit(BankEvent.CACHED, this.NAME);
            return this.store;
        }
        if (index === 0) {
            this.emit(BankEvent.START, this.NAME);
        }
        const list: string[] = [ ];
        try {
            const addrs =
                this.addrs.length !== 0 ? this.addrs : await this.runGetAddrs();
            for (const addr of addrs) {
                await sleep(this.DISTANCE_TIME);
                const notes = (await this.runGetBanknotes(addr))
                    .filter((m) => isUrl(m));
                list.push(...notes);
            }
        } catch (error) {
            if (this.RECONNECT_NUM >= index) {
                this.log(`RETRY`);
                this.emit(BankEvent.RETRY, this.NAME, index);
                return this.start();
            }
            this.log("Get Fail");
            this.emit(BankEvent.FAIL, this.NAME);
            this.emit(BankEvent.END, this.NAME);
            throw error;
        }
        this.store.once(StoreEvent.ADD, (name, length) => {
            if (length === 0) {
                this.log("Use Cache");
                this.emit(BankEvent.CACHED, this.NAME);
            } else {
                this.log("Get %s Banknotes", length);
                this.emit(BankEvent.SUCCESS, this.NAME);
            }
            this.emit(BankEvent.END, this.NAME);
        });
        return this.store.add(list);
    }

}
