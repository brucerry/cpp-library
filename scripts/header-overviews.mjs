import { load } from "cheerio";
const year = (value) =>
    ({ 98: 1998, "03": 2003 })[value] || 2000 + Number(value);
const clean = (text) =>
    text
        .replace(/\u00a0/g, " ")
        .replace(/[\u200b\u200e\u200f]/g, "")
        .replace(/\t/g, "    ")
        .trim()
        .replace(
            /[\u3400-\u9fff\uf900-\ufaff]/g,
            (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
        );

// Store text and table structure rather than embedding archive HTML/scripts.
export function parseHeaderOverview(html, { introduced = "98", section } = {}) {
    const $ = load(html);
    $(
        ".t-navbar, .t-nv, #toc, .editsection, .t-example-live-link, .t-template-editlink, script, style",
    ).remove();
    const text = (element) => {
        const copy = $(element).clone();
        copy.find("br").replaceWith("\n");
        copy.find(".t-lines > span").append("\n");
        return clean(copy.text());
    };
    const blocks = [];
    let active = !section;
    for (const element of $("#mw-content-text").children().toArray()) {
        const node = $(element);
        const value = text(element);
        if (!value) continue;
        if (/^h[234]$/.test(element.tagName)) {
            if (section) {
                if (!active && value === section) active = true;
                else if (active) break;
            }
            if (!active) continue;
            if (
                /^(See also|References|Defect reports|External links)$/.test(
                    value,
                )
            )
                break;
            blocks.push({ type: "heading", text: value });
        } else if (!active) continue;
        else if (element.tagName === "table") {
            const rows = [];
            const carry = [];
            for (const row of node
                .children("tr")
                .add(node.children("tbody,thead,tfoot").children("tr"))
                .toArray()) {
                const cells = [];
                let column = 0;
                const takeCarry = () => {
                    while (carry[column]?.remaining) {
                        cells.push(carry[column].cell);
                        carry[column].remaining--;
                        column++;
                    }
                };
                for (const cell of $(row).children("td,th").toArray()) {
                    takeCarry();
                    const value = {
                        text: text(cell),
                        heading: cell.tagName === "th",
                    };
                    const colspan = Math.min(
                        20,
                        Math.max(1, Number($(cell).attr("colspan")) || 1),
                    );
                    const rowspan = Math.min(
                        100,
                        Math.max(1, Number($(cell).attr("rowspan")) || 1),
                    );
                    for (let index = 0; index < colspan; index++) {
                        cells.push(value);
                        if (rowspan > 1)
                            carry[column] = {
                                cell: value,
                                remaining: rowspan - 1,
                            };
                        column++;
                    }
                }
                takeCarry();
                // In feature tables the Std column is a version-only cell.
                // Names grouped with historical badges retain those annotations.
                const edition = cells
                    .find((cell) =>
                        /^\(C\+\+\d+\)/.test(cell.text.replace(/\s/g, "")),
                    )
                    ?.text.match(/C\+\+(\d+)/)?.[1];
                const firstCell = $(row).children("td,th").first();
                const singleName =
                    firstCell.find(".t-lines").first().children("span")
                        .length <= 1;
                const nameVersion = singleName
                    ? firstCell
                          .find('[class*="t-since-cxx"]')
                          .first()
                          .attr("class")
                          ?.match(/t-since-cxx(\d+)/)?.[1]
                    : null;
                const since =
                    $(row)
                        .attr("class")
                        ?.match(/t-since-cxx(\d+)/)?.[1] ||
                    edition ||
                    nameVersion ||
                    introduced;
                if (year(since) <= 2023 && cells.some((cell) => cell.text))
                    rows.push({ cells, since });
            }
            if (rows.length) blocks.push({ type: "table", rows });
        } else if (node.is(".mw-geshi") || node.find("pre").length) {
            const snippets = node.find("pre");
            for (const code of snippets.length ? snippets.toArray() : [element])
                blocks.push({ type: "code", text: text(code) });
        } else blocks.push({ type: "paragraph", text: value });
    }
    return { title: clean($("#firstHeading").text()), blocks };
}
