import { fetchDevelopmentStatus } from "./development-status.mjs";
import { load } from "cheerio";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, readdir, rename } from "node:fs/promises";
import { dirname, posix } from "node:path";
import { execFileSync } from "node:child_process";
import { entries as curated } from "../src/catalog.js";
import { format } from "@wasm-fmt/clang-format";
import { supplementalExamples } from "../src/supplemental-examples.js";
import { familyExamples } from "../src/family-examples.js";
import { recommendExamples } from "./recommend-examples.mjs";

const codeStyle = await readFile(".clang-format", "utf8");
const formatCode = (code) =>
    format(code.replaceAll("\t", "    "), "example.cpp", codeStyle).trim();

const releaseApi =
    "https://api.github.com/repos/PeterFeicht/cppreference-doc/releases/latest";
const fetchOptions = {
    headers: { "User-Agent": "cpp-library-reference-importer" },
    signal: AbortSignal.timeout(120000),
};
async function download(url) {
    const response = await fetch(url, {
        ...fetchOptions,
        signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response;
}
const release = await (await download(releaseApi)).json();
const asset = release.assets.find((item) =>
    /^html-book-\d+\.tar\.xz$/.test(item.name),
);
if (!asset) throw new Error("English reference archive not found");
const cache = `.tmp/reference/${release.tag_name}`;
await mkdir(cache, { recursive: true });
const archive = `${cache}/${asset.name}`;
try {
    await readFile(archive);
} catch {
    await writeFile(
        archive,
        Buffer.from(
            await (await download(asset.browser_download_url)).arrayBuffer(),
        ),
    );
}
const archiveHash = createHash("sha256")
    .update(await readFile(archive))
    .digest("hex");
try {
    await readFile(`${cache}/indexed/index.json`);
} catch {
    execFileSync(process.platform === "win32" ? "python" : "python3", [
        "scripts/extract-archive.py",
        archive,
        `${cache}/indexed`,
    ]);
}
const pageFiles = JSON.parse(
    await readFile(`${cache}/indexed/index.json`, "utf8"),
);
const readPage = (path) => {
    const file = pageFiles[path];
    if (!file) throw new Error(`Archive page missing: ${path}`);
    return readFile(`${cache}/indexed/pages/${file}`, "utf8");
};
const clean = (text) =>
    text
        .replace(/\u00a0/g, " ")
        .replace(/[\u200b\u200e\u200f]/g, "")
        .trim();
const compact = (text) => clean(text).replace(/\s+/g, " ");
const english = (text) =>
    text.replace(
        /[\u3400-\u9fff\uf900-\ufaff]/g,
        (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
    );
const year = (value) =>
    ({ 98: 1998, "03": 2003 })[value] || 2000 + Number(value);
const version = (text) => text?.match(/C\+\+(98|03|11|14|17|20|23|26|29)/)?.[1];
const hash = (text) =>
    createHash("sha256").update(text).digest("hex").slice(0, 16);
const pathFromLink = (from, href) => {
    if (!href || /^(https?:|#|mailto:)/.test(href)) return null;
    return posix.normalize(posix.join(posix.dirname(from), href.split("#")[0]));
};

const headerDocument = load(await readPage("cpp/header.html"));
headerDocument(".t-navbar, .t-nv").remove();
const libraries = [];
const futureHeaders = new Set();
headerDocument("#mw-content-text .t-dsc").each((_, row) => {
    const cells = headerDocument(row).children("td");
    const first = compact(cells.first().text());
    const header = first.match(/^<([^>]+)>/)?.[1];
    if (!header) return;
    const introduced = first.match(/\(C\+\+(\d+)\)/)?.[1] || "98";
    if (year(introduced) > 2023) {
        futureHeaders.add(header);
        return;
    }
    libraries.push({
        id: header.replaceAll(".", "-"),
        header,
        introduced,
        removed: first.match(/removed in C\+\+(\d+)/)?.[1] || null,
        deprecated: first.match(/deprecated in C\+\+(\d+)/)?.[1] || null,
        summary: english(compact(cells.last().text())),
        source: `https://en.cppreference.com/w/cpp/header/${header}`,
    });
});
const libraryByHeader = new Map(
    libraries.map((library) => [library.header, library]),
);
const assignedHeaders = new Map();
for (const library of libraries) {
    let document;
    try {
        document = load(await readPage(`cpp/header/${library.header}.html`));
    } catch {
        continue;
    }
    document(".t-navbar, .t-nv").remove();
    document("#mw-content-text .t-dsc td:first-child a").each((_, anchor) => {
        const path = pathFromLink(
            `cpp/header/${library.header}.html`,
            document(anchor).attr("href"),
        );
        if (!path?.startsWith("cpp/") || path.startsWith("cpp/header/")) return;
        if (!assignedHeaders.has(path)) assignedHeaders.set(path, new Set());
        assignedHeaders.get(path).add(library.header);
    });
}

const pages = new Map();
const excluded = {
    future: [],
    expositionOnly: [],
    nonLibrary: [],
    withoutDeclarations: [],
};
const blocks = ($, element) => {
    const clone = $(element).clone();
    clone.find("br").replaceWith("\n");
    return clean(clone.text());
};
const examplesFrom = ($) =>
    $(".t-example")
        .map((_, element) => {
            const code = $(element).find(".source-cpp pre").first();
            if (!code.length) return null;
            const output = $(element)
                .find(".source-text pre, .t-example-output pre")
                .first();
            const text = clean(code.text()).replaceAll("\t", "    ");
            return {
                code: formatCode(english(text)),
                output: output.length ? english(clean(output.text())) : null,
                outputKind: $(element).text().includes("Possible output:")
                    ? "Possible output"
                    : output.length
                      ? "Expected output"
                      : "Behavior demonstrated in code",
                unicodeEscaped: /[\u3400-\u9fff\uf900-\ufaff]/.test(
                    text + output.text(),
                ),
            };
        })
        .get()
        .filter(Boolean);
const allPaths = Object.keys(pageFiles).sort();
let processed = 0;
for (const path of allPaths) {
    if (++processed % 1000 === 0)
        console.log(`Reading reference page ${processed}/${allPaths.length}`);
    if (
        /^cpp\/(?:language|experimental|named_req|keyword|feature_test|freestanding|compiler_support|header)\//.test(
            path,
        )
    ) {
        excluded.nonLibrary.push(path);
        continue;
    }
    const html = await readPage(path);
    const canonicalMatch = html.match(/"wgPageName":("(?:\\.|[^"\\])*")/);
    const canonicalName = canonicalMatch
        ? JSON.parse(canonicalMatch[1]).replaceAll(" ", "_")
        : path.slice(0, -5);
    const $ = load(html);
    $(
        ".t-navbar, .t-nv, #toc, .t-example-live-link, .editsection, script, style",
    ).remove();
    const content = $("#mw-content-text");
    const children = content.children();
    const firstHeading = children
        .toArray()
        .findIndex((element) => /^h[234]$/.test(element.tagName));
    const lead = firstHeading < 0 ? children : children.slice(0, firstHeading);
    const declarationTable = lead.filter(".t-dcl-begin");
    const rows = declarationTable.find("tr.t-dcl");
    if (!rows.length) {
        excluded.withoutDeclarations.push(path);
        continue;
    }
    const allHeaderNames = declarationTable
        .find(".t-dsc-header a")
        .map(
            (_, e) =>
                $(e)
                    .text()
                    .match(/^<([^>]+)>$/)?.[1],
        )
        .get();
    if (
        allHeaderNames.length &&
        allHeaderNames.every((header) => futureHeaders.has(header))
    ) {
        excluded.future.push(path);
        continue;
    }
    if (
        /^cpp\/(?:concepts\/boolean-testable|iterator\/is-integer-like|memory\/(?:voidify|ranges\/nothrow_concepts)|numeric\/simd|standard_library\/(?:decay-copy|synth-three-way))\.html$/.test(
            path,
        )
    ) {
        excluded.expositionOnly.push(path);
        continue;
    }
    const declarations = rows
        .map((_, row) => {
            const cells = $(row).children("td");
            const notes = compact(cells.last().text());
            const ownClass = $(row).attr("class") || "";
            return {
                code: formatCode(english(blocks($, cells.first()))),
                notes,
                since:
                    notes.match(/\(since C\+\+(\d+)\)/)?.[1] ||
                    ownClass.match(/t-since-cxx(\d+)/)?.[1] ||
                    null,
                until:
                    notes.match(/\(until C\+\+(\d+)\)/)?.[1] ||
                    ownClass.match(/t-until-cxx(\d+)/)?.[1] ||
                    null,
            };
        })
        .get();
    const explicitHeaders = declarationTable
        .find(".t-dsc-header a")
        .map(
            (_, e) =>
                $(e)
                    .text()
                    .match(/^<([^>]+)>$/)?.[1],
        )
        .get()
        .filter((header) => libraryByHeader.has(header));
    const introElements = lead.not(".t-dcl-begin");
    const intro = introElements
        .not("table.t-dcl-begin")
        .map((_, element) => blocks($, element))
        .get()
        .filter(Boolean)
        .join("\n\n");
    const sections = [];
    content.children("h2, h3, h4").each((_, heading) => {
        const title = compact($(heading).text()).replace("[edit]", "").trim();
        if (
            /Example|See also|Defect reports|External links|References/.test(
                title,
            )
        )
            return;
        const text = $(heading)
            .nextUntil("h2,h3,h4")
            .map((_, element) => blocks($, element))
            .get()
            .filter(Boolean)
            .join("\n\n");
        if (text) sections.push({ title, text: english(text) });
    });
    const name = compact($("#firstHeading").text());
    pages.set(path, {
        path,
        id: `ref-${hash(path)}`,
        name,
        declarations,
        headers: [...new Set(explicitHeaders)],
        intro: english(intro),
        sections,
        examples: examplesFrom($),
        parent: path.replace(/\/[^/]+\.html$/, ".html"),
        summary: english(
            compact(introElements.filter("p,div").first().text()),
        ).slice(0, 400),
        source: `https://en.cppreference.com/w/${encodeURI(canonicalName)}`,
    });
}

function resolvePage(page, ancestors = new Set()) {
    if (page.resolved) return;
    if (ancestors.has(page.path)) throw new Error(`Parent cycle: ${page.path}`);
    ancestors.add(page.path);
    const parent = pages.get(page.parent);
    if (parent) resolvePage(parent, ancestors);
    if (!page.headers.length)
        page.headers = parent?.headers.length
            ? [...parent.headers]
            : [...(assignedHeaders.get(page.path) || [])];
    const headerVersion =
        page.headers
            .map((header) => libraryByHeader.get(header).introduced)
            .sort((a, b) => year(a) - year(b))[0] || "98";
    const inherited = parent?.introduced || headerVersion;
    for (const declaration of page.declarations)
        declaration.since ||= inherited;
    page.introduced = page.declarations
        .map((item) => item.since)
        .sort((a, b) => year(a) - year(b))[0];
    page.declarations = page.declarations.filter(
        (item) => year(item.since) <= 2023,
    );
    page.removed =
        page.declarations.length &&
        page.declarations.every((item) => item.until)
            ? page.declarations
                  .map((item) => item.until)
                  .sort((a, b) => year(b) - year(a))[0]
            : null;
    page.resolved = true;
}
for (const page of pages.values()) resolvePage(page);

const cAliases = {
    "assert.h": "cassert",
    "ctype.h": "cctype",
    "errno.h": "cerrno",
    "fenv.h": "cfenv",
    "float.h": "cfloat",
    "inttypes.h": "cinttypes",
    "limits.h": "climits",
    "locale.h": "clocale",
    "math.h": "cmath",
    "setjmp.h": "csetjmp",
    "signal.h": "csignal",
    "stdarg.h": "cstdarg",
    "stddef.h": "cstddef",
    "stdint.h": "cstdint",
    "stdio.h": "cstdio",
    "stdlib.h": "cstdlib",
    "string.h": "cstring",
    "time.h": "ctime",
    "uchar.h": "cuchar",
    "wchar.h": "cwchar",
    "wctype.h": "cwctype",
    "complex.h": "complex",
    "tgmath.h": "cmath",
    ccomplex: "complex",
    ctgmath: "cmath",
};
for (const library of libraries)
    library.aliasOf = cAliases[library.header] || null;
const nodeHandle = pages.get("cpp/container/node_handle.html");
if (nodeHandle)
    nodeHandle.headers = ["map", "set", "unordered_map", "unordered_set"];
const formattingOverview = pages.get("cpp/utility/format.html");
if (formattingOverview) {
    formattingOverview.headers = ["format"];
    formattingOverview.introduced = "20";
}

const curatedPaths = {
    sort: "algorithm/sort",
    find: "algorithm/find",
    count: "algorithm/count",
    reverse: "algorithm/reverse",
    accumulate: "algorithm/accumulate",
    sqrt: "numeric/math/sqrt",
    "all-of": "algorithm/all_any_none_of",
    "any-of": "algorithm/all_any_none_of",
    "to-string": "string/basic_string/to_string",
    iota: "algorithm/iota",
    "make-unique": "memory/unique_ptr/make_unique",
    exchange: "utility/exchange",
    clamp: "algorithm/clamp",
    gcd: "numeric/gcd",
    lcm: "numeric/lcm",
    size: "iterator/size",
    midpoint: "numeric/midpoint",
    "starts-with": "string/basic_string/starts_with",
    "ends-with": "string/basic_string/ends_with",
    popcount: "numeric/popcount",
    contains: "string/basic_string/contains",
    byteswap: "numeric/byteswap",
    "to-underlying": "utility/to_underlying",
    print: "io/print",
};
for (const guide of curated) {
    const page = pages.get(`cpp/${curatedPaths[guide.id]}.html`);
    if (page) {
        page.guides ||= [];
        page.guides.push(guide);
    }
}

const unclassified = [];
const included = [];
for (const example of [...supplementalExamples, ...familyExamples]) {
    for (const path of example.paths) {
        const page = pages.get(`cpp/${path}.html`);
        if (!page || page.examples.length) continue;
        page.examples.push({
            code: formatCode(example.example),
            output: example.output,
            title: "Practical example",
            input: example.input,
            outputKind: "Expected output",
            curated: true,
            minimumStandard: example.version,
        });
    }
}
for (const page of pages.values()) {
    if (
        excluded.future.some((path) =>
            page.path.startsWith(path.slice(0, -5) + "/"),
        )
    ) {
        excluded.future.push(page.path);
        continue;
    }
    if (year(page.introduced) > 2023 || !page.declarations.length) {
        excluded.future.push(page.path);
        continue;
    }
    if (!page.headers.length) {
        unclassified.push(page.path);
        continue;
    }
    if (!page.summary)
        page.summary =
            page.intro.split("\n")[0] ||
            `Declarations and requirements for ${page.name}.`;
    included.push(page);
}

const withoutAnyExample = recommendExamples(included);
if (withoutAnyExample.length) {
    throw new Error(
        `No example recommendation for: ${withoutAnyExample.join(", ")}`,
    );
}

const reference = await (
    await download(
        "https://raw.githubusercontent.com/cplusplus/draft/n4950/source/lib-intro.tex",
    )
).text();
const officialHeaders = [
    ...new Set(
        [...reference.matchAll(/\\tcode\{<([a-z0-9_.]+)>\}/g)].map(
            (match) => match[1],
        ),
    ),
];
const missingHeaders = officialHeaders.filter(
    (header) => !libraryByHeader.has(header),
);
if (missingHeaders.length)
    throw new Error(
        `Released standard headers missing: ${missingHeaders.join(", ")}`,
    );

const outputRoot = `public/data/reference/${release.tag_name}`;
await mkdir(outputRoot, { recursive: true });
const index = [];
for (const page of included) {
    const { resolved, parent, ...detail } = page;
    const detailText = JSON.stringify(detail);
    const filename = `${page.id}-${hash(detailText)}.json`;
    await writeFile(`${outputRoot}/${filename}`, detailText + "\n");
    index.push({
        id: page.id,
        name: page.name,
        headers: page.headers,
        introduced: page.introduced,
        removed: page.removed,
        summary: page.guides?.[0]?.summary || page.summary.slice(0, 220),
        detail: `reference/${release.tag_name}/${filename}`,
        hasExample: page.examples.length > 0 || !!page.guides?.length,
        hasGuide: !!page.guides?.length,
        hasRecommendation: !!page.recommendedExamples?.length,
    });
}
const report = {
    archive: release.html_url,
    archiveSha256: archiveHash,
    generatedAt: new Date().toISOString(),
    officialHeaderSource:
        "https://github.com/cplusplus/draft/blob/n4950/source/lib-intro.tex",
    officialHeaders: officialHeaders.length,
    missingHeaders,
    libraries: libraries.length,
    importedPages: index.length,
    withExamples: index.filter((entry) => entry.hasExample).length,
    withRecommendations: index.filter((entry) => entry.hasRecommendation)
        .length,
    withoutAnyExample,
    missingExamples: included
        .filter((page) => !page.examples.length && !page.guides?.length)
        .map((page) => ({ id: page.id, name: page.name, source: page.source })),
    unclassified,
    excluded,
    exhaustiveSymbolAudit: false,
};
const previousManifest = JSON.parse(
    await readFile("public/data/library-index.json", "utf8"),
);
const manifest = {
    development: await fetchDevelopmentStatus({
        previous: previousManifest.development,
    }),
    schemaVersion: 2,
    syncedAt: report.generatedAt,
    archiveDate: release.tag_name.slice(1),
    release: release.html_url,
    archiveSha256: archiveHash,
    standards: ["98", "03", "11", "14", "17", "20", "23"],
    libraries,
    entries: index.sort((a, b) => a.name.localeCompare(b.name, "en")),
    coverage: {
        officialHeaders: report.officialHeaders,
        missingHeaders,
        withExamples: report.withExamples,
        withRecommendations: report.withRecommendations,
        withoutAnyExample: withoutAnyExample.length,
        missingExamples: report.missingExamples.length,
        unclassified: unclassified.length,
        exhaustiveSymbolAudit: false,
    },
};
await writeFile(
    "public/data/library-index.json.tmp",
    JSON.stringify(manifest) + "\n",
);
await rename(
    "public/data/library-index.json.tmp",
    "public/data/library-index.json",
);
await writeFile(
    "public/data/coverage.json",
    JSON.stringify(report, null, 4) + "\n",
);
console.log(
    JSON.stringify(
        {
            libraries: libraries.length,
            pages: index.length,
            withExamples: report.withExamples,
            withRecommendations: report.withRecommendations,
            withoutAnyExample: withoutAnyExample.length,
            missingExamples: report.missingExamples.length,
            unclassified: unclassified.length,
            missingHeaders,
        },
        null,
        4,
    ),
);
