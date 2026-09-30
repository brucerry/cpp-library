// Original squishy SVG artwork, inspired by rounded superellipse icon design.
// These are not Font Awesome assets and require no external icon font.
const shapes = {
    moon: '<path class="jelly-fill" d="M19.8 15.3C13 17.4 6.4 10.8 8.7 4.1 3.5 5.9 2 12.9 5.6 17.4c3.8 4.9 11.7 3.5 14.2-2.1Z"/><path d="M19.8 15.3C13 17.4 6.4 10.8 8.7 4.1 3.5 5.9 2 12.9 5.6 17.4c3.8 4.9 11.7 3.5 14.2-2.1Z"/>',
    sun: '<path class="jelly-fill" d="M12 7c4 0 5 1 5 5s-1 5-5 5-5-1-5-5 1-5 5-5Z"/><path d="M12 7c4 0 5 1 5 5s-1 5-5 5-5-1-5-5 1-5 5-5Zm0-4v1m0 16v1M3 12h1m16 0h1M5.5 5.5l.8.8m11.4 11.4.8.8M5.5 18.5l.8-.8M17.7 6.3l.8-.8"/>',
    paint: '<path class="jelly-fill" d="M12 3C6 3 3 6.4 3 12s3.4 9 8 9c3 0 2-3 4-3 4 0 6-3 6-6 0-6-3-9-9-9Z"/><path d="M12 3C6 3 3 6.4 3 12s3.4 9 8 9c3 0 2-3 4-3 4 0 6-3 6-6 0-6-3-9-9-9Z"/><g class="jelly-dots"><circle cx="8" cy="8" r="1.3"/><circle cx="14" cy="7" r="1.3"/><circle cx="17" cy="12" r="1.3"/><circle cx="7" cy="14" r="1.3"/></g>',
    code: '<path class="jelly-fill" d="M7 3h10c4 0 4 3 4 9s0 9-4 9H7c-4 0-4-3-4-9s0-9 4-9Z"/><path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-10-2 12"/>',
    search: '<path class="jelly-fill" d="M10 3c5 0 7 2 7 7s-2 7-7 7-7-2-7-7 2-7 7-7Z"/><path d="M10 3c5 0 7 2 7 7s-2 7-7 7-7-2-7-7 2-7 7-7Zm6 13 5 5"/>',
    book: '<path class="jelly-fill" d="M12 6C8 3 5 3 3 5v14c3-1 6-1 9 2 3-3 6-3 9-2V5c-2-2-5-2-9 1Z"/><path d="M12 6C8 3 5 3 3 5v14c3-1 6-1 9 2 3-3 6-3 9-2V5c-2-2-5-2-9 1Zm0 0v15M6 9l3 1m6 0 3-1"/>',
    grid: '<g class="jelly-fill"><rect x="3" y="3" width="7" height="7" rx="2.6"/><rect x="14" y="3" width="7" height="7" rx="2.6"/><rect x="3" y="14" width="7" height="7" rx="2.6"/><rect x="14" y="14" width="7" height="7" rx="2.6"/></g><rect x="3" y="3" width="7" height="7" rx="2.6"/><rect x="14" y="3" width="7" height="7" rx="2.6"/><rect x="3" y="14" width="7" height="7" rx="2.6"/><rect x="14" y="14" width="7" height="7" rx="2.6"/>',
    list: '<g class="jelly-fill"><rect x="3" y="3" width="18" height="7" rx="3"/><rect x="3" y="14" width="18" height="7" rx="3"/></g><rect x="3" y="3" width="18" height="7" rx="3"/><rect x="3" y="14" width="18" height="7" rx="3"/><path d="M7 6.5h.1M7 17.5h.1m4-11h6m-6 11h6"/>',
    arrow: '<path class="jelly-fill" d="m13 5 8 7-8 7V5Z"/><path d="M3 12h17m-7-7 8 7-8 7"/>',
    chevron: '<path d="M5 9c3 2 5 6 7 6s4-4 7-6"/>',
    copy: '<rect class="jelly-fill" x="8" y="8" width="13" height="13" rx="4"/><rect x="8" y="8" width="13" height="13" rx="4"/><path d="M16 4c-2-1-8-1-10 0s-3 9-1 12"/>',
    check: '<path d="M4 12c2 1 4 6 6 5s6-9 10-11"/>',
    menu: '<path d="M4 5c5-1 11-1 16 0M4 12c5-1 11-1 16 0M4 19c5-1 11-1 16 0"/>',
    refresh:
        '<path class="jelly-fill" d="M20 10A8 8 0 1 0 19 17L16 15a5 5 0 1 1 1-5Z"/><path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6"/>',
    cube: '<path class="jelly-fill" d="m12 3 9 5v9l-9 5-9-5V8Z"/><path d="m12 3 9 5v9l-9 5-9-5V8Zm-9 5 9 5 9-5m-9 5v9"/>',
    cloud: '<path class="jelly-fill" d="M7 19C1 19 1 10 6 10 5 3 17 2 18 10c6 0 5 9-1 9Z"/><path d="M7 19C1 19 1 10 6 10 5 3 17 2 18 10c6 0 5 9-1 9Z"/>',
    spark: '<path class="jelly-fill" d="M12 2c1 7 3 9 10 10-7 1-9 3-10 10-1-7-3-9-10-10 7-1 9-3 10-10Z"/><path d="M12 2c1 7 3 9 10 10-7 1-9 3-10 10-1-7-3-9-10-10 7-1 9-3 10-10Z"/>',
    "to-top": '<path d="M5 3h14M12 21V8m-6 6 6-6 6 6"/>',
    "to-bottom": '<path d="M5 21h14M12 3v13m-6-6 6 6 6-6"/>',
    github: '<path d="M9 20c-5 1-5-3-7-3m14 5v-4a3 3 0 0 0-1-2c4 0 6-2 6-5a5 5 0 0 0-1-3 5 5 0 0 0 0-4s-2 0-4 2a13 13 0 0 0-7 0C7 4 5 4 5 4a5 5 0 0 0 0 4 5 5 0 0 0-1 3c0 3 2 5 6 5a3 3 0 0 0-1 2v4"/>',
};
const icon = (name, cls = "") =>
    `<svg class="icon ${name === "github" ? "github-icon" : "jelly-icon"} ${cls}" data-icon="${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${name === "github" ? "1.65" : "2.15"}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name] || shapes.code}</svg>`;
const escape = (value) =>
    String(value).replace(
        /[&<>"']/g,
        (char) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[char],
    );

function highlight(code) {
    // Tokenize before escaping, so neither catalog content nor highlighting can inject HTML.
    return code
        .split(
            /(\/\/[^\n]*|"(?:\\.|[^"\\])*"|#[a-z]+|\b(?:int|auto|void|bool|const|return|for|class|template|constexpr|unsigned|short|double|enum|noexcept|typename|true|false)\b|\b\d+\b)/g,
        )
        .map((token) => {
            const type = token.startsWith("//")
                ? "comment"
                : token.startsWith('"')
                  ? "string"
                  : /^\d+$/.test(token)
                    ? "number"
                    : /^(#|int$|auto$|void$|bool$|const$|return$|for$|class$|template$|constexpr$|unsigned$|short$|double$|enum$|noexcept$|typename$|true$|false$)/.test(
                            token,
                        )
                      ? "keyword"
                      : "";
            return type
                ? `<span class="syntax-${type}">${escape(token)}</span>`
                : escape(token);
        })
        .join("");
}

export { icon, escape, highlight };
