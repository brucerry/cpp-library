import { functionLink } from "./routes.js";
import { escape } from "./ui.js";
// Give existing source sections their own addressable panels without duplicating content.
export function installDetailTabs(article, current, onTitle) {
    const tabs = [
        {
            id: "definition",
            label: "Overview",
            nodes: [
                ...article.querySelectorAll(
                    ":scope > .detail-summary, :scope > .plain-english, :scope > #definition, :scope > .good-to-know",
                ),
            ],
        },
        {
            id: "declarations",
            label: "Declarations",
            nodes: [article.querySelector("#declarations")],
        },
    ];
    article
        .querySelectorAll(":scope > .reference-section")
        .forEach((node, index) => {
            const title = node.querySelector("summary").textContent;
            const content = node.querySelector(".section-content");
            node.replaceWith(content);
            tabs.push({
                id: `reference-${index}`,
                label: title,
                nodes: [content],
            });
        });
    tabs.push(
        {
            id: "examples",
            label: "Examples",
            nodes: [article.querySelector("#examples")],
        },
        {
            id: "source",
            label: "Source",
            nodes: [article.querySelector("#source")],
        },
    );
    const selected = tabs.find((tab) => tab.id === current.section) || tabs[0];
    const navigation = article.querySelector(".page-toc");
    navigation.setAttribute("role", "tablist");
    navigation.setAttribute("aria-label", "Function sections");
    navigation.innerHTML = tabs
        .map(
            (tab) =>
                `<a id="tab-${tab.id}" role="tab" tabindex="${tab === selected ? 0 : -1}" aria-selected="${tab === selected}" aria-controls="panel-${tab.id}" href="${functionLink(current.id, current.version, current.library, tab.id)}">${escape(tab.label)}</a>`,
        )
        .join("");
    for (const tab of tabs) {
        const panel = document.createElement("div");
        panel.id = `panel-${tab.id}`;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", `tab-${tab.id}`);
        panel.tabIndex = 0;
        panel.hidden = tab !== selected;
        panel.append(...tab.nodes.filter(Boolean));
        article.append(panel);
    }
    navigation.addEventListener("keydown", (event) => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key))
            return;
        event.preventDefault();
        const items = [...navigation.querySelectorAll('[role="tab"]')];
        const index = items.indexOf(document.activeElement);
        const next =
            event.key === "Home"
                ? 0
                : event.key === "End"
                  ? items.length - 1
                  : (index +
                        (event.key === "ArrowRight" ? 1 : -1) +
                        items.length) %
                    items.length;
        items[next].focus();
        items[next].click();
    });
    onTitle(selected.label, selected.id);
    return selected.id;
}
