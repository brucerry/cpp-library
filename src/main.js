import { themeControl, installThemes } from "./themes.js";
import { modePicker, installModePicker } from "./mode-picker.js";
import { installDetailTabs } from "./detail-tabs.js";
import { installCursorParticles } from "./cursor-particles.js";
import "./style.css";
import { icon, escape, highlight } from "./ui.js";
import { functionLink } from "./routes.js";
import { searchPlan, rankEntries } from "./search.js";
import {
    CACHE_PREFIX,
    CACHE_KEY,
    standards,
    year,
    readCache,
    fetchIndex,
    fetchDetail,
    clearCache,
    inEdition,
} from "./reference-data.js";

const base = import.meta.env.BASE_URL;
let storage;
try {
    storage = sessionStorage;
} catch {
    storage = { length: 0, getItem: () => null, setItem() {}, removeItem() {} };
}
let catalog = readCache(storage);
let query = "";
let mode = "introduced";
const collapsedVersions = new Set();
let pageNumber = 1;
let layout = "grid";
try {
    layout =
        storage.getItem(`${CACHE_PREFIX}layout`) === "list" ? "list" : "grid";
} catch {}
let status = catalog ? "Using session cache" : "Checking for updates";
let refreshing = false;
let renderToken = 0;
const mobile = matchMedia("(max-width: 820px)");
const formatNumber = (number) => number.toLocaleString("en-US");
const edition = (value) => (value === "all" ? "All releases" : `C++${value}`);
const routeLink = (version, library) =>
    `#/version/${version}${library ? `/library/${library}` : ""}`;
const main = () => document.querySelector("#main");
function route() {
    const parts = (location.hash.slice(1) || "/").split("/").filter(Boolean);
    if (parts[0] === "function")
        return {
            type: "function",
            id: parts[1],
            version: parts[2] || "all",
            section: parts[3] || "definition",
            library: parts[4] === "library" ? parts[5] : null,
        };
    if (parts[0] === "development")
        return { type: "development", version: parts[1] };
    if (parts[0] === "about") return { type: "about", version: "all" };
    if (parts[0] === "coverage") return { type: "coverage", version: "all" };
    if (
        parts[0] === "version" &&
        (standards.includes(parts[1]) || parts[1] === "all")
    )
        return {
            type: "browse",
            version: parts[1],
            library: parts[2] === "library" ? parts[3] : null,
        };
    return {
        type: parts.length ? "missing" : "browse",
        version: "all",
        library: null,
    };
}

document.querySelector("#app").innerHTML = `
    <aside class="sidebar" id="sidebar">
        <a class="brand" href="#/">${icon("code")}<span>cpp<span class="brand-light">library</span><span class="brand-dot">.</span></span></a>
        <p class="side-label">Standard library reference</p>
        <a class="overview" href="#/">${icon("grid")} All releases</a>
        <div class="nav-heading">RELEASED STANDARDS</div>
        <nav aria-label="Released C++ versions" id="versions"></nav><nav id="development-nav" aria-label="Development versions"></nav>
        <a class="sidebar-coverage" href="#/coverage">Coverage ${icon("arrow")}</a>

    </aside>
    <div class="workspace">
        <header class="topbar">
            <button class="icon-button mobile-menu" aria-label="Toggle navigation" aria-expanded="false" aria-controls="sidebar">${icon("menu")}</button>
            <nav class="breadcrumb" id="crumb" aria-label="Breadcrumb">All releases</nav>
            <div class="top-actions"><span class="sync-status" role="status" id="sync-label">${escape(status)}</span><button id="refresh-data" class="icon-button" aria-label="Check for data updates">${icon("refresh")}</button><a class="icon-button github-link" href="https://github.com/brucerry/cpp-library" target="_blank" rel="noreferrer" aria-label="Project on GitHub">${icon("github")}</a>${themeControl()}</div>
        </header>
        <main id="main" tabindex="-1"></main>
        <footer><span>CPP Library</span><a href="#/about">Sources &amp; attribution ${icon("arrow")}</a></footer>
    </div><nav class="scroll-controls" aria-label="Page position"><button class="icon-button" data-scroll="top" aria-label="Scroll to top" title="Scroll to top">${icon("to-top")}</button><button class="icon-button" data-scroll="bottom" aria-label="Scroll to bottom" title="Scroll to bottom">${icon("to-bottom")}</button></nav><div class="toast" role="status" aria-live="polite"></div>`;
installThemes(storage, CACHE_PREFIX);
installCursorParticles();
const decorations = document.createElement("div");
decorations.className = "jelly-background";
decorations.setAttribute("aria-hidden", "true");
const backgroundIcons = [
    "code",
    "cube",
    "book",
    "spark",
    "cloud",
    "paint",
    "sun",
    "moon",
    "grid",
    "search",
    "copy",
    "list",
];
decorations.innerHTML = Array.from({ length: 64 }, (_, index) => {
    const column = index % 8;
    const row = Math.floor(index / 8);
    return `<span class="jelly-decoration" style="--column:${column};--row:${row};--tilt:${((index * 13) % 35) - 17}deg;--delay:-${index % 14}s;--hue:${index % 6}">${icon(backgroundIcons[(index * 5) % backgroundIcons.length])}</span>`;
}).join("");
document.body.prepend(decorations);
installModePicker((value) => {
    mode = value;
    pageNumber = 1;
    render();
});
function breadcrumbs(items = []) {
    const all = [{ label: "All releases", href: "#/" }, ...items];
    document.querySelector("#crumb").innerHTML = all
        .map(
            (item, index) =>
                `${index ? '<span aria-hidden="true">/</span>' : ""}<a href="${escape(item.href)}" ${index === all.length - 1 ? 'aria-current="page"' : ""}>${escape(item.label)}</a>`,
        )
        .join("");
}
function editionCrumbs(version) {
    return version === "all"
        ? []
        : [{ label: edition(version), href: routeLink(version) }];
}
function developmentLinks() {
    return (catalog?.development?.editions || [])
        .map(
            (item) =>
                `<a class="filter-chip development-chip" href="#/development/${item.version}">${edition(item.version)} <span>Under development</span></a>`,
        )
        .join("");
}
function libraryEntries(library, version, selectedMode = mode) {
    const headers = library.aliasOf
        ? [library.header, library.aliasOf]
        : [library.header];
    return catalog.entries.filter(
        (entry) =>
            entry.headers.some((header) => headers.includes(header)) &&
            inEdition(entry, version, selectedMode),
    );
}
function librariesFor(version) {
    return catalog.libraries.filter(
        (library) =>
            version === "all" ||
            (mode === "introduced"
                ? year(library.introduced) <= year(version) &&
                  (library.introduced === version ||
                      libraryEntries(library, version).length > 0)
                : year(library.introduced) <= year(version) &&
                  (!library.removed || year(library.removed) > year(version))),
    );
}
function headerBreakdown(version, libraries = librariesFor(version)) {
    const added = libraries.filter(
        (library) => library.introduced === version,
    ).length;
    return { added, updated: libraries.length - added };
}
function countDescription(version) {
    if (!catalog) return "Loading headers";
    if (mode === "available")
        return `${librariesFor(version).length} available headers, including earlier editions and excluding removals`;
    const { added, updated } = headerBreakdown(version);
    return `${added} new headers + ${updated} existing headers with new facilities`;
}
function renderNav() {
    const current = route();
    document.querySelector("#development-nav").innerHTML = developmentLinks();
    document.querySelector("#versions").innerHTML = standards
        .map((version) => {
            const count = catalog ? librariesFor(version).length : undefined;
            const active = current.version === version;
            return `<div class="nav-release"><a class="version-button ${active ? "active" : ""}" href="${routeLink(version)}" data-version="${version}" aria-expanded="${active && !collapsedVersions.has(version)}" ${active ? `aria-controls="libraries-${version}"` : ""} ${active ? 'aria-current="page"' : ""}><span class="version-mark">${version}</span><span>${edition(version)}</span><span class="count" title="${countDescription(version)}">${count ?? "—"}</span></a>${
                active && catalog
                    ? `<div class="nav-libraries" id="libraries-${version}" ${collapsedVersions.has(version) ? "hidden" : ""}>${
                          librariesFor(version)
                              .map(
                                  (library) =>
                                      `<a href="${routeLink(version, library.id)}" class="${current.library === library.id ? "active" : ""}"><code>&lt;${escape(library.header)}&gt;</code><span>${libraryEntries(library, version).length}</span></a>`,
                              )
                              .join("") ||
                          "<p>No new headers in this edition.</p>"
                      }</div>`
                    : ""
            }</div>`;
        })
        .join("");
}
function updateStatus() {
    document.querySelector("#sync-label").textContent = status;
    document.querySelector("#refresh-data").disabled = refreshing;
}
function setMenu(open) {
    const sidebar = document.querySelector(".sidebar");
    if (!open && mobile.matches && sidebar.contains(document.activeElement))
        document.querySelector(".mobile-menu").focus();
    sidebar.classList.toggle("open", open);
    sidebar.inert = mobile.matches && !open;
    document
        .querySelector(".mobile-menu")
        .setAttribute("aria-expanded", String(open));
}
mobile.addEventListener("change", () => setMenu(false));
setMenu(false);

function controls(version) {
    return `<div class="browse-controls"><label class="search-box">${icon("search")}<input id="search" type="search" autocomplete="off" placeholder="Search functions, types, or headers" aria-label="Search the library" value="${escape(query)}"><kbd>/</kbd></label>${modePicker(mode)}</div><nav class="filter-row" aria-label="Filter by released version">${["all", ...standards].map((value) => `<a class="filter-chip ${value === version ? "selected" : ""}" href="${routeLink(value)}" ${value === version ? 'aria-current="page"' : ""}>${edition(value)}</a>`).join("")}${developmentLinks()}</nav>`;
}
function browse(current) {
    const library = catalog.libraries.find(
        (item) => item.id === current.library,
    );
    if (current.library && !library) return missing();
    document.title = `CPP Library - ${edition(current.version)}${library ? ` - <${library.header}>` : ""}`;
    breadcrumbs([
        ...editionCrumbs(current.version),
        ...(library
            ? [
                  {
                      label: `<${library.header}>`,
                      href: routeLink(current.version, library.id),
                  },
              ]
            : []),
    ]);
    main().innerHTML = `${current.version === "all" && !library ? "" : `<section class="page-heading"><a class="back-link" href="${library ? routeLink(current.version) : "#/"}">← ${library ? edition(current.version) + " libraries" : "All releases"}</a><h1>${library ? `&lt;${escape(library.header)}&gt;` : edition(current.version)}</h1><p>${library ? escape(library.summary) : current.version === "03" ? "Maintenance release. Choose Available to browse existing libraries." : ""}</p>${library ? `<div class="detail-badges"><span class="version-badge">Header introduced in ${edition(library.introduced)}</span>${library.removed ? `<span class="version-badge">Removed in ${edition(library.removed)}</span>` : ""}${library.aliasOf ? `<span>Compatibility header for &lt;${escape(library.aliasOf)}&gt;</span>` : ""}</div>` : ""}</section>`}<section class="explorer" aria-labelledby="explore-heading"><div class="section-title"><div><h2 id="explore-heading">${library ? "Functions &amp; types" : "Browse libraries"}</h2></div><div class="layout-toggle" role="group" aria-label="Library layout"><button data-layout="grid" aria-label="Grid layout" aria-pressed="${layout === "grid"}">${icon("grid")}</button><button data-layout="list" aria-label="List layout" aria-pressed="${layout === "list"}">${icon("list")}</button></div></div>${controls(current.version)}<div class="results-heading"><span id="result-count" aria-live="polite"></span><span id="scope-note"></span></div><div id="results"></div></section>`;
    renderResults();
}
function renderResults() {
    const current = route();
    const library = catalog.libraries.find(
        (item) => item.id === current.library,
    );
    const results = document.querySelector("#results");
    if (!results) return;
    if (library || query.trim()) {
        const plan = searchPlan(
            query,
            catalog.libraries.filter((item) =>
                inEdition(item, current.version, "available"),
            ),
        );
        const suggestions = plan.libraries.length
            ? `<div class="header-suggestions"><p>${plan.approximate ? "Closest libraries" : "Matching libraries"}</p>${plan.libraries.map((item) => `<a class="filter-chip" data-available href="${routeLink(current.version, item.id)}">&lt;${escape(item.header)}&gt;</a>`).join("")}</div>`
            : "";
        let entries = library
            ? libraryEntries(library, current.version)
            : catalog.entries.filter((entry) =>
                  inEdition(entry, current.version, mode),
              );
        entries = rankEntries(entries, plan);
        document.querySelector("#result-count").textContent =
            `${formatNumber(entries.length)} matching reference pages`;
        document.querySelector("#scope-note").textContent = query.trim()
            ? "Exact → partial → typo suggestions → related"
            : "Related overloads share a page";
        const pageCount = Math.max(1, Math.ceil(entries.length / 36));
        pageNumber = Math.min(pageNumber, pageCount);
        results.innerHTML =
            suggestions +
            (entries.length
                ? `<div class="function-list">${entries
                      .slice((pageNumber - 1) * 36, pageNumber * 36)
                      .map(
                          (entry) =>
                              `<a class="function-row" href="${functionLink(entry.id, current.version, library?.id || plan.libraries.find((item) => entry.headers.includes(item.header) || entry.headers.includes(item.aliasOf))?.id)}"><div><h3>${escape(entry.name)}</h3><p>${escape(entry.summary)}</p><div class="function-meta"><span>${edition(entry.introduced)}</span>${entry.headers
                                  .slice(0, 3)
                                  .map(
                                      (header) =>
                                          `<code>&lt;${escape(header)}&gt;</code>`,
                                  )
                                  .join(
                                      "",
                                  )}${entry.hasGuide ? '<span class="guide-badge">Plain-English guide</span>' : ""}${entry.removed ? `<span>Removed in ${edition(entry.removed)}</span>` : ""}</div></div>${icon("arrow")}</a>`,
                      )
                      .join(
                          "",
                      )}</div>${pageCount > 1 ? `<div class="pagination"><button data-page="${pageNumber - 1}" ${pageNumber === 1 ? "disabled" : ""}>← Previous</button><span>Page ${pageNumber} of ${pageCount}</span><button data-page="${pageNumber + 1}" ${pageNumber === pageCount ? "disabled" : ""}>Next →</button></div>` : ""}`
                : `<div class="empty-state">${icon("search")}<h3>${library && !query ? "No new reference entries in this edition" : "No matching functions"}</h3><p>${library && !query ? "Try “Available in this version” to see existing facilities. Some headers define only macros or forward declarations." : "Try a function name, a header, or a simpler search."}</p><button class="primary-button" id="reset-filters">${library && !query ? "Show available facilities" : "Clear search"}</button></div>`);
        return;
    }
    const libraries = librariesFor(current.version);
    document.querySelector("#result-count").textContent =
        current.version === "all"
            ? mode === "available"
                ? "Available libraries by release"
                : "New headers and facilities by release"
            : `${libraries.length} libraries · ${mode === "introduced" ? "new headers or facilities in" : "available in"} ${edition(current.version)}`;
    document.querySelector("#scope-note").textContent = "";
    const groups =
        current.version === "all"
            ? standards.map((version) => ({
                  version,
                  libraries: librariesFor(version),
              }))
            : [{ version: current.version, libraries }];
    results.innerHTML = groups
        .map(
            (group) =>
                `<section class="library-group" data-version="${group.version}"><div class="group-heading"><h3>${edition(group.version)}</h3><span>${current.version === "all" ? `${group.libraries.length} headers` : `${group.libraries.length} libraries`}${mode === "introduced" ? ` · ${headerBreakdown(group.version, group.libraries).added} new + ${headerBreakdown(group.version, group.libraries).updated} updated` : ""}</span></div>${
                    group.libraries.length
                        ? `<div class="library-grid ${layout === "list" ? "list-layout" : ""}">${group.libraries
                              .map((item) => {
                                  const count = libraryEntries(
                                      item,
                                      group.version,
                                  ).length;
                                  return `<a class="library-card" href="${routeLink(group.version, item.id)}"><div class="card-top"><span class="category-icon">${icon("book")}</span><span class="version-badge">${edition(item.introduced)}</span></div><h3>&lt;${escape(item.header)}&gt;</h3><p>${escape(item.summary)}</p><div class="card-bottom"><span>${count} reference ${count === 1 ? "page" : "pages"}</span>${icon("arrow")}</div></a>`;
                              })
                              .join("")}</div>`
                        : `<div class="edition-note">No new headers in C++03. <a href="${routeLink("03")}" data-available>Browse available libraries →</a></div>`
                }</section>`,
        )
        .join("");
}

function codeBlock(code, title, key) {
    return `<div class="code-block"><div class="code-toolbar"><span>${escape(title)}</span>${key ? `<button class="copy-button" data-copy="${key}" aria-label="Copy ${escape(title)}">${icon("copy")} Copy</button>` : ""}</div><pre tabindex="0"><code>${highlight(code)}</code></pre></div>`;
}
function paragraphs(text) {
    return text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((paragraph) => `<p>${escape(paragraph)}</p>`)
        .join("");
}
let copyValues = new Map();
async function detail(current, token) {
    const legacy = {
        sort: "std::sort",
        clamp: "std::clamp",
        "starts-with": "std::basic_string<CharT,Traits,Allocator>::starts_with",
    };
    const entry =
        catalog.entries.find((item) => item.id === current.id) ||
        catalog.entries.find((item) => item.name === legacy[current.id]);
    if (!entry) return missing();
    const lib = current.library
        ? catalog.libraries.find(
              (item) =>
                  item.id === current.library &&
                  (entry.headers.includes(item.header) ||
                      entry.headers.includes(item.aliasOf)),
          )
        : catalog.libraries.find((item) => item.header === entry.headers[0]);
    if (!lib) return missing();
    main().innerHTML = `<div class="loading-state" role="status"><span class="loader"></span>Loading ${escape(entry.name)}…</div>`;
    document.title = `CPP Library - ${entry.name}`;
    try {
        const data = await fetchDetail(base, storage, entry);
        if (token !== renderToken) return;
        copyValues = new Map();
        const guides = (data.guides || []).filter(
            (item) =>
                !item.header ||
                item.header === lib.header ||
                item.header === lib.aliasOf,
        );
        const guide = guides[0];
        const declarations =
            current.version !== "all"
                ? data.declarations.filter(
                      (item) =>
                          year(item.since) <= year(current.version) &&
                          (!item.until ||
                              year(item.until) > year(current.version)),
                  )
                : data.declarations;
        const examples = [
            ...guides.map((item) => ({
                code: item.example,
                output: item.output,
                title: item.summary,
                input: item.input,
                outputKind: "Expected output",
                curated: true,
                minimumStandard: item.version === "98" ? "11" : item.version,
            })),
            ...data.examples,
            ...(data.recommendedExamples || []),
        ];
        declarations.forEach((item, index) =>
            copyValues.set(`declaration-${index}`, item.code),
        );
        examples.forEach((item, index) =>
            copyValues.set(`example-${index}`, item.code),
        );
        main().innerHTML = `<article class="detail"><a class="back-link" href="${routeLink(current.version, lib.id)}">← Back to &lt;${escape(lib.header)}&gt;</a><div class="detail-badges"><span class="version-badge">Introduced in ${edition(entry.introduced)}</span>${(current.library ? [lib.header] : entry.headers).map((header) => `<code>&lt;${escape(header)}&gt;</code>`).join("")}${entry.removed ? `<span class="version-badge">Removed in ${edition(entry.removed)}</span>` : ""}</div><h1>${escape(data.name)}</h1>${guide ? `<p class="detail-summary">${escape(guide.summary)}</p><div class="plain-english">${icon("sun")}<div><h2>In everyday terms</h2><p>${escape(guide.analogy)}</p></div></div>` : ""}<nav class="page-toc" aria-label="On this page"><a href="#definition" data-section="definition">Definition</a><a href="#declarations" data-section="declarations">Declarations</a><a href="#examples" data-section="examples">Examples</a><a href="#source" data-section="source">Source</a></nav><section id="definition"><h2>What it does</h2><div class="definition-text">${paragraphs(data.intro || data.summary)}</div></section><section id="declarations"><h2>Definitions &amp; overloads</h2><p class="section-description">${current.version === "all" ? "Declaration history through C++23. Each overload keeps its version annotations." : `Showing overloads available in ${edition(current.version)}. Notes retain historical changes.`}</p>${declarations.length ? declarations.map((item, index) => codeBlock(item.code, `Overload ${index + 1} · ${edition(item.since)}${item.notes ? ` · ${item.notes}` : ""}`, `declaration-${index}`)).join("") : "<p>This function is not available in the selected edition.</p>"}</section>${data.sections.map((section, index) => `<details class="reference-section" ${/Parameters|Return value/.test(section.title) ? "open" : ""}><summary>${escape(section.title)}</summary><div class="section-content">${paragraphs(section.text)}</div></details>`).join("")}<section id="examples"><h2>Example use cases</h2>${examples.length ? examples.map((example, index) => `<div class="example"><h3>${escape(example.title || `Reference example ${index + 1}`)}</h3>${example.recommendation ? `<p class="example-hint related-example">${escape(example.recommendation.relationship)} · Demonstrates <a href="#/function/${escape(example.recommendation.id)}/all">${escape(example.recommendation.name)}</a>, not this exact API.</p>` : ""}${example.input ? `<div class="example-input"><span>INPUT</span><p>${escape(example.input)}</p></div>` : '<p class="example-hint">Input and setup are included below.</p>'}${codeBlock(example.code, `C++${example.minimumStandard || ""} example ${index + 1}`, `example-${index}`)}${example.output !== null ? `<div class="output-block"><div><span class="status-dot"></span>${escape(example.outputKind)}${example.unicodeEscaped ? " · Unicode escape notation" : ""}</div><pre tabindex="0">${escape(example.output)}</pre></div>` : '<p class="example-hint">No console output specified. See the assertions or side effects in the code.</p>'}<p class="example-hint">${example.curated ? "CPP Library example." : `cppreference contributors · <a href="${escape(example.recommendation?.source || data.source)}" target="_blank" rel="noreferrer">Source</a> · CC BY-SA 3.0.`}</p></div>`).join("") : `<div class="coverage-notice"><h3>Standalone example not supplied by the reference</h3><p>The definitions and requirements above are available. This page is recorded in the coverage report until a tested example has been added.</p><a href="#/coverage">See the example audit →</a></div>`}</section>${guide ? `<div class="good-to-know"><h3>Good to know</h3><p>${escape(guide.note)}</p></div>` : ""}<section class="source-section" id="source"><h2>Traceable reference</h2><p>Adapted from <a href="${escape(data.source)}" target="_blank" rel="noreferrer">${escape(data.name)} on cppreference ↗</a>, by cppreference contributors, under <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>. Layout, navigation, whitespace, and Unicode display have been adapted.</p><p>Archive: ${escape(catalog.archiveDate)}. cppreference is a community reference, not an ISO publication. <a href="#/about">Source details and standard references →</a></p></section></article>`;
        const selected = installDetailTabs(
            document.querySelector(".detail"),
            { ...current, id: entry.id },
            (label, section) => {
                document.title = `CPP Library - ${entry.name} - ${label}`;
                breadcrumbs([
                    ...editionCrumbs(current.version),
                    {
                        label: `<${lib.header}>`,
                        href: routeLink(current.version, lib.id),
                    },
                    {
                        label: entry.name,
                        href: functionLink(
                            entry.id,
                            current.version,
                            current.library,
                        ),
                    },
                    {
                        label,
                        href: functionLink(
                            entry.id,
                            current.version,
                            current.library,
                            section,
                        ),
                    },
                ]);
            },
        );
        document
            .querySelector(`#tab-${selected}`)
            ?.focus({ preventScroll: true });
    } catch {
        if (token !== renderToken) return;
        main().innerHTML = `<div class="empty-state"><h1>This page could not be loaded</h1><p>The index is still available. Reconnect and retry this function page.</p><button class="primary-button" id="retry-page">Retry page</button><a class="back-link" href="#/">Back to the library</a></div>`;
    }
}
function about() {
    document.title = "CPP Library - Sources & attribution";
    breadcrumbs([{ label: "Sources & attribution", href: "#/about" }]);
    main().innerHTML = `<article class="detail prose"><a class="back-link" href="#/">← Back to the library</a><div class="eyebrow">ABOUT THE REFERENCE</div><h1>Readable, traceable C++.</h1><p class="detail-summary">A library organized around the way you explore: version, header, function.</p><h2>Released standards</h2><p>The release filters cover C++98, C++03, C++11, C++14, C++17, C++20, and C++23. <a href="https://www.iso.org/standard/83626.html">ISO lists ISO/IEC 14882:2024 (C++23) as the published standard</a>. Draft-only facilities are excluded from the released index. C++03 is a maintenance release; its available libraries remain browsable.</p><h2>What the filters mean</h2><p><strong>New or updated</strong> shows headers with new facilities in the selected edition. Counts combine new headers and existing headers with additions; updated headers are already part of the earlier inventory. For example, the C++11 catalog has 36 new headers and 47 updated headers: 83 affected headers, while 69 earlier headers + 36 new headers = 105 available headers. <strong>Available</strong> also includes earlier facilities and excludes known removals. The header badge gives the header’s own introduction version. Reference pages group related overloads and may discuss historical differences.</p><h2>Sources and attribution</h2><p>Reference declarations, descriptions, and examples are adapted from the English cppreference archive by cppreference contributors. They remain licensed under <a href="https://creativecommons.org/licenses/by-sa/3.0/">Creative Commons Attribution-ShareAlike 3.0 Unported</a>. Each page links to its original. The importer changes layout, extracts text, normalizes whitespace, and escapes CJK characters for English-only display. The <a href="${escape(catalog.release)}">archive release</a> is a community publication and is not the ISO standard.</p><p>The header inventory is checked against <a href="https://github.com/cplusplus/draft/blob/n4950/source/lib-intro.tex">N4950, the public C++23 committee draft</a>. These checks validate header coverage; they do not prove that every standard overload has a complete guide. The <a href="#/coverage">coverage report</a> makes remaining gaps visible.</p><h2>Fresh data without a heavy first load</h2><p>A daily GitHub Actions job checks for the latest archive and rebuilds the index. Browsers fetch that published index on opening, revalidate on refresh, and poll every 15 minutes while visible. Function pages load on demand. Failed updates retain the last good index.</p><p>The index and up to 24 visited function pages use tab-scoped sessionStorage. Closing the tab normally clears this data. Same-tab external links clear this site’s keys. Browser crashes, address-bar departures, and restored sessions prevent an absolute cleanup guarantee. No service worker or localStorage cache is installed.</p><h2>Project licenses</h2><p>Original application code and original guides use MIT. Adapted cppreference material retains CC BY-SA 3.0. DM Sans and Manrope are bundled under the SIL Open Font License. The project is independent and is not endorsed by ISO or cppreference.</p></article>`;
}
async function coverage(token) {
    document.title = "CPP Library - Coverage";
    breadcrumbs([{ label: "Coverage", href: "#/coverage" }]);
    main().innerHTML =
        '<div class="loading-state" role="status">Loading the coverage audit…</div>';
    try {
        const response = await fetch(`${base}data/coverage.json`, {
            cache: "no-store",
        });
        if (!response.ok) throw new Error("Unavailable");
        const report = await response.json();
        if (token !== renderToken) return;
        main().innerHTML = `<article class="detail prose"><a class="back-link" href="#/">← Back to the library</a><div class="eyebrow">CONTENT COVERAGE</div><h1>A reference you can inspect.</h1><p class="detail-summary">Coverage is measured against the imported archive and the released standard’s header inventory.</p><div class="stats-grid"><div><strong>${report.libraries}</strong><span>historical &amp; current headers</span></div><div><strong>${formatNumber(report.importedPages)}</strong><span>reference pages</span></div><div><strong>${formatNumber(report.withExamples)}</strong><span>pages with direct examples</span></div></div><h2>Header audit</h2><p>${report.officialHeaders} header names checked against the public C++23 draft. ${report.missingHeaders.length} missing from the header navigation.</p><h2>Completeness status</h2><p>Every imported page has declarations and a source link. ${report.withRecommendations || 0} pages offer a related example; ${report.missingExamples.length} still need an example of the exact API. ${report.withoutAnyExample?.length ?? report.missingExamples.length} pages have neither. ${report.unclassified.length} declaration pages need a verified header classification. An exhaustive symbol-by-symbol and overload-by-overload ISO audit has not yet been completed. These gaps prevent a claim of complete standard-library coverage.</p><p><a href="${base}data/coverage.json" target="_blank" rel="noreferrer">Download the full machine-readable audit ↗</a></p><h2>Exact API examples still needed</h2><div class="audit-list">${report.missingExamples
            .slice(0, 100)
            .map(
                (item) =>
                    `<a href="#/function/${item.id}/all">${escape(item.name)} ${icon("arrow")}</a>`,
            )
            .join(
                "",
            )}</div>${report.missingExamples.length > 100 ? "<p>The complete list is included in the downloadable audit.</p>" : ""}<h2>Archive provenance</h2><p>Release: <a href="${escape(report.archive)}">${escape(catalog.archiveDate)}</a></p><p class="hash-text">SHA-256: ${escape(report.archiveSha256)}</p></article>`;
    } catch {
        if (token === renderToken)
            main().innerHTML =
                '<div class="empty-state"><h1>Audit unavailable</h1><p>Reconnect to load the coverage report.</p><button id="retry-page" class="primary-button">Retry</button></div>';
    }
}
function development(current) {
    const item = catalog.development?.editions.find(
        (item) => item.version === current.version,
    );
    if (!item) return missing();
    document.title = `CPP Library - ${edition(item.version)} - Under development`;
    breadcrumbs([
        {
            label: `${edition(item.version)} · Under development`,
            href: `#/development/${item.version}`,
        },
    ]);
    main().innerHTML = `<article class="detail prose"><a class="back-link" href="#/">${icon("arrow", "back-arrow")} All releases</a><br><span class="version-badge">Under development</span><h1>${edition(item.version)}</h1><p>The official status lists this edition as work in progress. Features and wording may change.</p><div class="development-actions"><a class="primary-button" href="${item.source}" target="_blank" rel="noreferrer">Official status ↗</a><a class="primary-button" href="${item.draft}" target="_blank" rel="noreferrer">Working draft ↗</a></div><p class="example-hint">Status checked ${escape(catalog.development.checkedAt.slice(0, 10))}. Draft facilities are separate from the released library catalog.</p></article>`;
}
function missing() {
    document.title = "CPP Library - Page not found";
    breadcrumbs([{ label: "Page not found", href: location.hash }]);
    main().innerHTML =
        '<div class="empty-state"><h1>That page is not in the library.</h1><a class="primary-button" href="#/">Explore the library</a></div>';
}
function render() {
    const token = ++renderToken;
    renderNav();
    if (!catalog) {
        main().innerHTML = `<div class="empty-state"><h1>Your C++ reference is loading.</h1><p id="initial-status">${escape(status)}</p><button class="primary-button" id="retry-page">Retry loading</button></div>`;
        return;
    }
    const current = route();
    if (current.type === "function") detail(current, token);
    else if (current.type === "about") about();
    else if (current.type === "coverage") coverage(token);
    else if (current.type === "development") development(current);
    else if (current.type === "missing") missing();
    else browse(current);
}
async function refresh() {
    if (refreshing) return;
    refreshing = true;
    status = "Checking for updates";
    updateStatus();
    try {
        const next = await fetchIndex(base, storage);
        const changed =
            !catalog ||
            catalog.archiveSha256 !== next.archiveSha256 ||
            catalog.entries.length !== next.entries.length ||
            catalog.syncedAt !== next.syncedAt;
        catalog = next;
        status = `Archive ${next.archiveDate.slice(0, 4)}-${next.archiveDate.slice(4, 6)}-${next.archiveDate.slice(6)} · checked`;
        if (changed) {
            if (document.querySelector("#results")) {
                renderResults();
                renderNav();
                document
                    .querySelectorAll(".filter-row .development-chip")
                    .forEach((link) => link.remove());
                document
                    .querySelector(".filter-row")
                    ?.insertAdjacentHTML("beforeend", developmentLinks());
            } else render();
        }
    } catch {
        status = catalog
            ? "Update unavailable · saved copy"
            : "Unable to fetch the index · retry when online";
        if (!catalog) render();
    } finally {
        refreshing = false;
        updateStatus();
    }
}
let toastTimer;
function toast(text) {
    const element = document.querySelector(".toast");
    element.textContent = text;
    element.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove("visible"), 3000);
}
document.addEventListener("click", async (event) => {
    const versionLink = event.target.closest(".version-button");
    if (
        versionLink &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        !event.altKey &&
        event.button === 0
    ) {
        const version = versionLink.dataset.version;
        if (route().version === version) {
            event.preventDefault();
            if (collapsedVersions.has(version))
                collapsedVersions.delete(version);
            else collapsedVersions.add(version);
            renderNav();
            document
                .querySelector(`.version-button[data-version="${version}"]`)
                ?.focus({ preventScroll: true });
            return;
        }
        collapsedVersions.delete(version);
    }
    const scrollButton = event.target.closest("[data-scroll]");
    if (scrollButton) {
        window.scrollTo({
            top:
                scrollButton.dataset.scroll === "top"
                    ? 0
                    : document.documentElement.scrollHeight,
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
        });
    }
    if (event.target.closest(".mobile-menu"))
        setMenu(!document.querySelector(".sidebar").classList.contains("open"));
    if (event.target.closest("#refresh-data")) await refresh();
    if (event.target.closest("#retry-page")) {
        if (catalog) render();
        else await refresh();
    }
    if (event.target.closest("[data-available]")) {
        mode = "available";
        query = "";
    }
    if (event.target.closest("#reset-filters")) {
        query = "";
        if (route().library) mode = "available";
        pageNumber = 1;
        render();
    }
    const layoutButton = event.target.closest("[data-layout]");
    if (layoutButton) {
        layout = layoutButton.dataset.layout;
        try {
            storage.setItem(`${CACHE_PREFIX}layout`, layout);
        } catch {}
        document
            .querySelectorAll("[data-layout]")
            .forEach((button) =>
                button.setAttribute(
                    "aria-pressed",
                    String(button.dataset.layout === layout),
                ),
            );
        renderResults();
    }
    const pagination = event.target.closest("[data-page]");
    if (pagination) {
        pageNumber = Number(pagination.dataset.page);
        renderResults();
        document
            .querySelector("#explore-heading")
            .scrollIntoView({ block: "start" });
    }
    const copy = event.target.closest("[data-copy]");
    if (copy) {
        try {
            await navigator.clipboard.writeText(
                copyValues.get(copy.dataset.copy),
            );
            toast("Copied. Ready for your editor.");
        } catch {
            toast("Select the code and copy it manually.");
        }
    }
    const link = event.target.closest("a[href]");
    if (link && !link.target && new URL(link.href).origin !== location.origin)
        clearCache(storage);
});
document.addEventListener("input", (event) => {
    if (event.target.id === "search") {
        query = event.target.value;
        pageNumber = 1;
        renderResults();
    }
});
document.addEventListener("keydown", (event) => {
    if (
        event.key === "/" &&
        !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)
    ) {
        const search = document.querySelector("#search");
        if (search) {
            event.preventDefault();
            search.focus();
        }
    }
    if (event.key === "Escape") setMenu(false);
});
window.addEventListener("hashchange", () => {
    pageNumber = 1;
    render();
    setMenu(false);
    window.scrollTo(0, 0);
    main().focus({ preventScroll: true });
});
window.addEventListener("online", refresh);
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
});
setInterval(
    () => {
        if (!document.hidden) refresh();
    },
    15 * 60 * 1000,
);
render();
refresh();
