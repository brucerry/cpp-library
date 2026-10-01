// Header searches are separate from prose searches so brackets never become
// literal search terms, and a header's examples cannot pull in unrelated APIs.
function distance(left, right) {
    let previous = Array.from({ length: right.length + 1 }, (_, i) => i);
    let beforePrevious;
    for (let i = 0; i < left.length; i++) {
        const row = [i + 1];
        for (let j = 0; j < right.length; j++) {
            row.push(
                Math.min(
                    row[j] + 1,
                    previous[j + 1] + 1,
                    previous[j] + Number(left[i] !== right[j]),
                ),
            );
            if (
                i > 0 &&
                j > 0 &&
                left[i] === right[j - 1] &&
                left[i - 1] === right[j]
            ) {
                row[j + 1] = Math.min(row[j + 1], beforePrevious[j - 1] + 1);
            }
        }
        beforePrevious = previous;
        previous = row;
    }
    return previous[right.length];
}

const normalize = (value) => value.toLowerCase().replace(/\\+(?=<|>)/g, "");
const typoLimit = (term) => (term.length < 3 ? 0 : term.length < 5 ? 1 : 2);
function headerScore(term, header) {
    if (header === term) return 0;
    if (header.includes(term)) return 1;
    if (typoLimit(term) && distance(term, header) <= typoLimit(term)) return 2;
    return Infinity;
}

export function searchPlan(query, libraries) {
    const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
    const headers = [];
    const words = [];
    for (const token of tokens) {
        if (token.startsWith("<"))
            headers.push(token.slice(1).replace(/>$/, ""));
        else if (
            libraries.some((item) => item.header === token) ||
            (tokens.length === 1 &&
                libraries.some((item) => item.header.includes(token)))
        )
            headers.push(token);
        else words.push(token);
    }
    const headerMatches = headers.map((term) =>
        libraries
            .map((library) => ({
                library,
                score: term ? headerScore(term, library.header) : Infinity,
            }))
            .filter((item) => Number.isFinite(item.score))
            .sort(
                (a, b) =>
                    a.score - b.score ||
                    a.library.header.localeCompare(b.library.header),
            ),
    );
    const rankedLibraries = headerMatches.length
        ? headerMatches[0].filter((item) =>
              headerMatches.every((group) =>
                  group.some((match) => match.library.id === item.library.id),
              ),
          )
        : [];
    rankedLibraries.sort((a, b) => {
        const score = (item) =>
            Math.max(
                ...headerMatches.map(
                    (group) =>
                        group.find(
                            (match) => match.library.id === item.library.id,
                        ).score,
                ),
            );
        return (
            score(a) - score(b) ||
            a.library.header.localeCompare(b.library.header)
        );
    });
    return {
        libraries: rankedLibraries.map((item) => item.library),
        headerMatches,
        words,
        text: words.join(" "),
        headerSearch: headers.length > 0,
        approximate:
            rankedLibraries.length > 0 &&
            rankedLibraries.every((item) => item.score === 2),
    };
}

function wordScore(entry, term) {
    const name = entry.name.toLowerCase();
    const symbols = name.match(/[a-z0-9_]+/g) || [];
    if (
        name === term ||
        name.replace(/^std::/, "") === term ||
        symbols.includes(term)
    )
        return 0;
    if (name.includes(term)) return 1;
    if (
        typoLimit(term) &&
        symbols.some((symbol) => distance(term, symbol) <= typoLimit(term))
    )
        return 2;
    if (
        `${entry.summary} ${entry.headers.join(" ")}`
            .toLowerCase()
            .includes(term)
    )
        return 3;
    return Infinity;
}

// Every token must match. Explicit headers constrain the library, while prose
// matches remain available after stronger API name and spelling matches.
export function rankEntries(entries, plan) {
    if (!plan.headerSearch && !plan.words.length) return entries;
    return entries
        .map((entry) => {
            const scores = plan.words.map((term) => wordScore(entry, term));
            for (const group of plan.headerMatches) {
                const candidates = group.filter(
                    ({ library }) =>
                        entry.headers.includes(library.header) ||
                        (library.aliasOf &&
                            entry.headers.includes(library.aliasOf)),
                );
                scores.push(
                    candidates.length
                        ? Math.min(...candidates.map((item) => item.score))
                        : Infinity,
                );
            }
            const name = entry.name.toLowerCase().replace(/^std::/, "");
            return {
                entry,
                tier: Math.max(...scores),
                sum: scores.reduce((a, b) => a + b, 0),
                direct: Number(name !== plan.text),
            };
        })
        .filter((item) => Number.isFinite(item.tier))
        .sort(
            (a, b) =>
                a.tier - b.tier ||
                a.sum - b.sum ||
                a.direct - b.direct ||
                a.entry.name.length - b.entry.name.length ||
                a.entry.name.localeCompare(b.entry.name) ||
                a.entry.id.localeCompare(b.entry.id),
        )
        .map((item) => item.entry);
}
