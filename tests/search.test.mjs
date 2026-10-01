import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { searchPlan, rankEntries } from "../src/search.js";
const libraries = ["algorithm", "vector", "bit", "bitset", "string"].map(
    (header) => ({ id: header, header }),
);
const entry = (id, name, summary = "", headers = ["algorithm"]) => ({
    id,
    name,
    summary,
    headers,
});
const examples = [
    entry("related", "std::rearrange", "Can sort a collection"),
    entry("typo", "std::srot"),
    entry("partial", "std::stable_sort"),
    entry("exact", "std::sort"),
    entry("wrong-header", "std::sort", "", ["vector"]),
];
test("header search handles incomplete brackets, escaped brackets, and typos", () => {
    for (const query of [
        "<vector>",
        "<vec",
        "<vecott",
        "vector",
        "VECTOR",
        " <vector> ",
        "\\<vec",
    ]) {
        const plan = searchPlan(query, libraries);
        assert.equal(plan.libraries[0].header, "vector");
        assert.equal(plan.text, "");
    }
    assert.deepEqual(
        searchPlan("<bit>", libraries).libraries.map((item) => item.header),
        ["bit", "bitset"],
    );
    assert.equal(searchPlan("<unknown>", libraries).libraries.length, 0);
    assert.equal(searchPlan("<vecott", libraries).approximate, true);
    assert.equal(searchPlan("sort", libraries).headerSearch, false);
});
test("space-separated tokens combine in either order while headers stay scoped", () => {
    for (const query of [
        "sort <algo",
        "<algo sort",
        "sort \\<algo",
        "sort <algorithm>",
        String.raw`sort \\\<algo`,
        "  SORT   <algo  ",
        "algorithm sort",
    ]) {
        assert.deepEqual(
            rankEntries(examples, searchPlan(query, libraries)).map(
                (item) => item.id,
            ),
            ["exact", "partial", "typo", "related"],
        );
    }
    assert.equal(
        rankEntries(examples, searchPlan("sort <unknown>", libraries)).length,
        0,
    );
    assert.equal(
        rankEntries(examples, searchPlan("sort nonexistent", libraries)).length,
        0,
    );
});
test("ranking uses exact, partial, typo, then description matches independent of input order", () => {
    const plan = searchPlan("sort <algorithm>", libraries);
    assert.deepEqual(
        rankEntries([...examples].reverse(), plan).map((item) => item.id),
        ["exact", "partial", "typo", "related"],
    );
    const headers = searchPlan("<bit>", libraries);
    assert.deepEqual(
        rankEntries(
            [
                entry("partial", "std::bitset", "", ["bitset"]),
                entry("exact", "std::popcount", "", ["bit"]),
            ],
            headers,
        ).map((item) => item.id),
        ["exact", "partial"],
    );
    assert.equal(
        rankEntries(examples, searchPlan("srot <algo", libraries))[0].id,
        "typo",
    );
});
test("real catalog supports the requested mixed searches and retains full library context", () => {
    const catalog = JSON.parse(
        readFileSync("public/data/library-index.json", "utf8"),
    );
    for (const query of [
        "sort <algo",
        "<vec end",
        "end <vec",
        "<vecott end",
        "<vector> push_back",
    ]) {
        const plan = searchPlan(query, catalog.libraries);
        const results = rankEntries(catalog.entries, plan);
        assert.ok(results.length > 0, query);
        const header = query.includes("algo") ? "algorithm" : "vector";
        assert.ok(
            results.every((item) => item.headers.includes(header)),
            query,
        );
        assert.ok(
            results[0].name.includes(
                query.includes("sort")
                    ? "sort"
                    : query.includes("push_back")
                      ? "push_back"
                      : "end",
            ),
            query,
        );
    }
    assert.equal(
        rankEntries(
            catalog.entries,
            searchPlan("sort <algo", catalog.libraries),
        )[0].name,
        "std::sort",
    );
});
