import { escape, highlight } from "./ui.js";
import { year } from "./reference-data.js";

export function overviewContent(data, selected) {
    const blockHTML = (block) => {
        if (block.type === "heading") return `<h4>${escape(block.text)}</h4>`;
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
    return `${data.header !== data.canonical ? `<p>Compatibility header for &lt;${escape(data.canonical)}&gt;. The reference below documents that header's facilities; names in this compatibility header follow its C namespace rules.</p>` : ""}<p class="section-description">Reference synopsis and explanations through C++23. Historical annotations are retained; facility tables follow the selected release.</p>${data.documents.map((document) => `<section class="overview-document"><h3>${escape(document.title)}</h3>${document.blocks.map(blockHTML).join("")}<p class="example-hint">Adapted from <a href="${escape(document.source)}" target="_blank" rel="noreferrer">cppreference contributors</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>. Layout and table structure have been adapted.</p></section>`).join("")}`;
}
