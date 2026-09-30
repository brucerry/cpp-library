import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    validIndex,
    validDetail,
    readCache,
    CACHE_KEY,
    fetchIndex,
    clearCache,
    inEdition,
} from "../src/reference-data.js";

const snapshot = JSON.parse(
    await readFile("public/data/library-index.json", "utf8"),
);
const report = JSON.parse(await readFile("public/data/coverage.json", "utf8"));
const storage = () => {
    const values = new Map();
    return {
        get length() {
            return values.size;
        },
        key: (index) => [...values.keys()][index],
        getItem: (key) => values.get(key) || null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
    };
};

test("released header inventory and generated page links are complete within the imported dataset", async () => {
    assert.ok(validIndex(snapshot));
    assert.deepEqual(snapshot.standards, [
        "98",
        "03",
        "11",
        "14",
        "17",
        "20",
        "23",
    ]);
    assert.deepEqual(report.missingHeaders, []);
    assert.equal(snapshot.entries.length, report.importedPages);
    assert.ok(snapshot.entries.length > 4000);
    for (const entry of snapshot.entries) {
        const detail = JSON.parse(
            await readFile(`public/data/${entry.detail}`, "utf8"),
        );
        assert.ok(validDetail(detail, entry), entry.name);
        assert.ok(
            !/[\u3400-\u9fff\uf900-\ufaff]/.test(JSON.stringify(detail)),
            `English-only display: ${entry.name}`,
        );
        for (const declaration of detail.declarations)
            assert.ok(declaration.code.trim(), entry.name);
        for (const example of detail.examples)
            assert.ok(!example.code.includes("\t"), entry.name);
    }
});
test("known introductions, removals, and C++03 availability are modeled correctly", () => {
    const lookup = (name) =>
        snapshot.entries.find((entry) => entry.name === name);
    assert.equal(lookup("std::sort").introduced, "98");
    assert.ok(snapshot.entries.some((entry) => entry.name === "NAN"));
    assert.ok(
        snapshot.entries.some((entry) => entry.name.includes("std::nan")),
    );
    assert.equal(lookup("std::clamp").introduced, "17");
    assert.ok(inEdition(lookup("std::sort"), "03", "available"));
    assert.ok(!inEdition(lookup("std::clamp"), "14", "available"));
    assert.ok(inEdition(lookup("std::clamp"), "17", "introduced"));
    assert.ok(
        !inEdition({ introduced: "98", removed: "17" }, "17", "available"),
    );
    assert.ok(
        !snapshot.libraries.some((library) =>
            ["simd", "inplace_vector", "hive"].includes(library.header),
        ),
    );
    assert.ok(
        snapshot.libraries.some(
            (library) =>
                library.header === "expected" && library.introduced === "23",
        ),
    );
});
test("bad cache and blocked storage cannot prevent reading", () => {
    assert.equal(
        readCache({
            getItem() {
                throw new Error("blocked");
            },
        }),
        null,
    );
    const cache = storage();
    cache.setItem(CACHE_KEY, '{"schemaVersion":999}');
    assert.equal(readCache(cache), null);
    assert.equal(cache.getItem(CACHE_KEY), null);
    cache.setItem(CACHE_KEY, JSON.stringify(snapshot));
    assert.equal(readCache(cache).archiveSha256, snapshot.archiveSha256);
});
test("reject duplicate pages and unsafe detail URLs", () => {
    assert.equal(
        validIndex({
            ...snapshot,
            entries: [snapshot.entries[0], snapshot.entries[0]],
        }),
        false,
    );
    assert.equal(
        validIndex({
            ...snapshot,
            entries: [{ ...snapshot.entries[0], detail: "../../unsafe.json" }],
        }),
        false,
    );
});
test("revalidation validates before replacing a last-good index", async (context) => {
    const cache = storage();
    context.mock.method(
        globalThis,
        "fetch",
        async () => new Response(JSON.stringify(snapshot)),
    );
    await fetchIndex("/", cache);
    const saved = cache.getItem(CACHE_KEY);
    context.mock.method(globalThis, "fetch", async () => new Response("{}"));
    await assert.rejects(fetchIndex("/", cache));
    assert.equal(cache.getItem(CACHE_KEY), saved);
});
test("departure cleanup only clears keys owned by this project", () => {
    const cache = storage();
    cache.setItem("unrelated", "preserve");
    cache.setItem(CACHE_KEY, "data");
    cache.setItem("cpp-library:reference/page", "detail");
    clearCache(cache);
    assert.equal(cache.length, 1);
    assert.equal(cache.getItem("unrelated"), "preserve");
});

test("every page has direct code or a traceable related standalone recommendation", async () => {
    const pages = await Promise.all(
        snapshot.entries.map(async (entry) =>
            JSON.parse(await readFile(`public/data/${entry.detail}`, "utf8")),
        ),
    );
    const byId = new Map(pages.map((page) => [page.id, page]));
    let direct = 0;
    let related = 0;
    for (const page of pages) {
        if (page.examples.length || page.guides?.length) {
            direct++;
            assert.ok(!page.recommendedExamples?.length, page.name);
            continue;
        }
        related++;
        assert.equal(page.recommendedExamples?.length, 1, page.name);
        const example = page.recommendedExamples[0];
        const source = byId.get(example.recommendation.id);
        assert.ok(source, page.name);
        assert.ok(
            page.headers.some((header) => source.headers.includes(header)),
            page.name,
        );
        assert.equal(example.recommendation.source, source.source);
        const unsafe = structuredClone(page);
        unsafe.recommendedExamples[0].recommendation.source =
            "javascript:alert(1)";
        assert.equal(validDetail(unsafe, { id: page.id }), false);
        assert.match(example.code, /\bint\s+main\s*\(/);
        assert.ok(!example.code.includes("\t"));
        assert.ok(
            [
                ...source.examples.map((item) => item.code),
                ...(source.guides || []).map((item) => item.example),
            ].includes(example.code),
            page.name,
        );
        assert.equal(
            snapshot.entries.find((entry) => entry.id === page.id).hasExample,
            false,
        );
    }
    assert.equal(direct, report.withExamples);
    assert.equal(related, report.withRecommendations);
    assert.equal(direct + related, snapshot.entries.length);
    assert.deepEqual(report.withoutAnyExample, []);
});
