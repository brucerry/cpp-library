import { escape, highlight } from "./ui.js";
import { year } from "./reference-data.js";
import { installTabs } from "./detail-tabs.js";
import { headerExamples } from "./header-examples.js";

function sections(data) {
    const result = [{ id: "definition", label: "Overview", blocks: [] }];
    for (const document of data.documents) {
        let section = result[0];
        for (const block of document.blocks) {
            if (block.type === "heading") {
                const label = block.text.replace(/\s*\(since C\+\+\d+\)/, "");
                const id = /^(Mathematical constants|Constants)$/.test(label)
                    ? "constants"
                    : /^Examples?$/.test(label)
                      ? "examples"
                      : label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                section = result.find((item) => item.id === id);
                if (!section) {
                    section = {
                        id,
                        label:
                            id === "examples"
                                ? "Examples"
                                : id === "constants"
                                  ? "Constants"
                                  : label,
                        blocks: [],
                    };
                    result.push(section);
                }
            } else section.blocks.push(block);
        }
    }
    if (
        headerExamples[data.canonical] &&
        !result.some((item) => item.id === "examples")
    )
        result.push({ id: "examples", label: "Examples", blocks: [] });
    result.push({ id: "source", label: "Source", blocks: [] });
    return result;
}

export function overviewContent(data, selected) {
    const blockHTML = (block) => {
        if (block.type === "code")
            return `<div class="code-block"><div class="code-toolbar"><span>Reference synopsis / example</span></div><pre tabindex="0"><code>${highlight(block.text)}</code></pre></div>`;
        if (block.type === "paragraph") return `<p>${escape(block.text)}</p>`;
        const rows = block.rows.filter(
            (row) => selected === "all" || year(row.since) <= year(selected),
        );
        if (!rows.length) return "";
        const rowHTML = (row) =>
            row.cells.every((cell) => cell.text === row.cells[0].text)
                ? `<tr><th colspan="${row.cells.length}">${escape(row.cells[0].text)}</th></tr>`
                : `<tr>${row.cells.map((cell) => `<${cell.heading ? "th" : "td"}>${escape(cell.text)}</${cell.heading ? "th" : "td"}>`).join("")}</tr>`;
        return `<div class="overview-table" tabindex="0" role="region" aria-label="Reference facilities"><table>${rows.map(rowHTML).join("")}</table></div>`;
    };
    return `<nav class="page-toc"></nav>${sections(data)
        .map(
            (section) =>
                `<section id="overview-${section.id}" class="overview-document"><h3>${escape(section.label)}</h3>${section.id === "definition" ? `${data.header !== data.canonical ? `<p>Compatibility header for &lt;${escape(data.canonical)}&gt;. Names follow this header's C namespace rules.</p>` : ""}<p class="section-description">Reference synopsis and explanations through C++23. Historical annotations are retained; facility tables follow the selected release.</p>` : ""}${section.blocks.map(blockHTML).join("")}${section.id === "examples" && headerExamples[data.canonical] ? `<p>CPP Library example. Compile with C++${headerExamples[data.canonical].version}; the assertions check the result.</p>${blockHTML({ type: "code", text: headerExamples[data.canonical].example })}` : ""}${section.id === "source" ? data.documents.map((document) => `<p>Adapted from <a href="${escape(document.source)}" target="_blank" rel="noreferrer">${escape(document.title)} — cppreference contributors</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>. Layout and table structure have been adapted.</p>`).join("") : ""}</section>`,
        )
        .join("")}`;
}

export function overviewTabs(article, data, current, onTitle) {
    return installTabs(
        article,
        sections(data).map((section) => ({
            ...section,
            nodes: [article.querySelector(`#overview-${section.id}`)],
        })),
        current.section,
        (section) =>
            `#/version/${current.version}/library/${current.library}/${section}`,
        "Header sections",
        onTitle,
    );
}
