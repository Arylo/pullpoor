import test from "ava";
import { Store } from "../../lib/banks/base";

test("Get Method", (t) => {
    const store = new Store("Test");
    t.deepEqual(store.get(), {
        length: 0,
        list: [ ],
        source: "Test",
        updatedAt: 0
    });
});

test("Add Empty ID Array", (t) => {
    const store = new Store("Empty ID Array");
    store.add([ ]);
    t.deepEqual(store.get(), {
        length: 0,
        list: [ ],
        source: "Empty ID Array",
        updatedAt: 0
    });
});

test("Add ID Array", (t) => {
    const store = new Store("ID Array");
    store.add([ "709394" ]);
    t.is(store.get().length, 1);
    t.true(store.get().updatedAt <= Date.now());
    const updatedAt = store.get().updatedAt;
    t.is(store.get().list[0].id, "709394");
    t.is(store.get().list[0].createdAt, updatedAt);
});
