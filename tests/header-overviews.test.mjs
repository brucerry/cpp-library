import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseHeaderOverview } from "../scripts/header-overviews.mjs";
import { validOverview, validIndex } from "../src/reference-data.js";
import { overviewContent } from "../src/header-overview.js";

test("overview import preserves macro tables and synopsis text without embedding HTML", () => {
    const result = parseHeaderOverview(
        `<h1 id="firstHeading">Limits</h1><div id="mw-content-text"><div class="t-navbar">Ignore navigation</div><script>alert(1)</script><h3>Macros</h3><table><tr><td>CHAR_BIT</td><td>Width of a byte</td></tr></table><h3>Synopsis</h3><div class="mw-geshi"><pre>#define CHAR_BIT /* implementation-defined */</pre></div></div>`,
    );
    assert.equal(result.title, "Limits");
    assert.equal(
        result.blocks.find((block) => block.type === "table").rows[0].cells[0]
            .text,
        "CHAR_BIT",
    );
    assert.equal(
        result.blocks.find((block) => block.type === "code").text,
        "#define CHAR_BIT /* implementation-defined */",
    );
    assert.ok(!JSON.stringify(result).includes("alert"));
    assert.ok(!JSON.stringify(result).includes("Ignore navigation"));
});
test("version-table history expands row spans, excludes drafts, and filters selected releases", () => {
    const result = parseHeaderOverview(
        `<h1 id="firstHeading">Feature macros</h1><div id="mw-content-text"><h3>Language features</h3><p>Exclude this section</p><h3>Library features</h3><table><tr><th>Name</th><th>Value</th><th>Std</th></tr><tr><td rowspan="3">__cpp_lib_test</td><td>201907L</td><td>(C++20)</td></tr><tr><td>202207L</td><td>(C++23)</td></tr><tr><td>202403L</td><td>(C++26)<br>(DR20)</td></tr></table><h3>Example</h3><p>Exclude this example</p></div>`,
        { introduced: "20", section: "Library features" },
    );
    const rows = result.blocks.find((block) => block.type === "table").rows;
    assert.equal(rows.length, 3);
    assert.equal(rows[2].cells[0].text, "__cpp_lib_test");
    const data = {
        header: "version",
        canonical: "version",
        documents: [
            {
                ...result,
                source: "https://en.cppreference.com/w/cpp/feature_test",
            },
        ],
    };
    assert.ok(validOverview(data, { header: "version" }));
    const rendered = overviewContent(data, "20");
    assert.ok(rendered.includes("201907L"));
    assert.ok(!rendered.includes("202207L"));
    assert.ok(!JSON.stringify(result).includes("202403L"));
    assert.ok(!JSON.stringify(result).includes("Exclude"));
});
test("every available header without function pages has a validated local overview", async () => {
    const index = JSON.parse(
        await readFile("public/data/library-index.json", "utf8"),
    );
    assert.ok(validIndex(index));
    for (const library of index.libraries) {
        const pages = index.entries.filter(
            (entry) =>
                entry.headers.includes(library.header) ||
                (library.aliasOf && entry.headers.includes(library.aliasOf)),
        );
        if (pages.length) continue;
        assert.ok(library.overview, library.header);
        const data = JSON.parse(
            await readFile(`public/data/${library.overview}`, "utf8"),
        );
        assert.ok(validOverview(data, library), library.header);
        const text = JSON.stringify(data);
        if (library.header === "climits")
            assert.ok(text.includes("CHAR_BIT") && text.includes("INT_MIN"));
        if (library.header === "numbers")
            assert.ok(text.includes("pi_v") && text.includes("Euler"));
        if (library.header === "cstdint")
            assert.ok(text.includes("int32_t") && text.includes("INT32_MAX"));
        if (library.header === "version")
            assert.ok(
                text.includes("__cpp_lib_math_constants") &&
                    !text.includes("C++26"),
            );
    }
});
test("overview validation rejects script-bearing source links and corrupt table data", () => {
    const document = {
        title: "Overview",
        source: "javascript:alert(1)",
        blocks: [{ type: "paragraph", text: "Test" }],
    };
    const data = {
        header: "numbers",
        canonical: "numbers",
        documents: [document],
    };
    assert.equal(validOverview(data, { header: "numbers" }), false);
    document.source = "https://en.cppreference.com/w/cpp/header/numbers";
    document.blocks = [
        {
            type: "table",
            rows: [{ since: "26", cells: [{ text: "test", heading: false }] }],
        },
    ];
    assert.equal(validOverview(data, { header: "numbers" }), false);
});

test("a version badge on a single named type filters that type in earlier editions", () => {
    const result = parseHeaderOverview(
        `<h1 id="firstHeading">I/O</h1><div id="mw-content-text"><table><tr><td>basic_istream</td><td>Stream</td></tr><tr><td>basic_spanstream <span class="t-mark-rev t-since-cxx23">(C++23)</span></td><td>Span stream</td></tr></table></div>`,
    );
    const data = {
        header: "iosfwd",
        canonical: "iosfwd",
        documents: [
            {
                ...result,
                source: "https://en.cppreference.com/w/cpp/header/iosfwd",
            },
        ],
    };
    assert.ok(!overviewContent(data, "11").includes("basic_spanstream"));
    assert.ok(overviewContent(data, "23").includes("basic_spanstream"));
});
