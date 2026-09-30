// Recommendations complement, but never count as, examples of the exact API.
// Only self-contained programs from pages sharing a header are eligible.
export function recommendExamples(pages) {
    const hasDirect = (page) => page.examples.length > 0 || page.guides?.length;
    const candidates = pages.filter(hasDirect).flatMap((page) => {
        const examples = [
            ...(page.guides || []).map((guide) => ({
                code: guide.example,
                output: guide.output,
                outputKind: "Expected output",
                input: guide.input,
                minimumStandard: guide.version === "98" ? "11" : guide.version,
                curated: true,
            })),
            ...page.examples,
        ];
        return examples
            .filter(
                (example) =>
                    /\bint\s+main\s*\(/.test(example.code) &&
                    /#include\s*[<"]/.test(example.code),
            )
            .map((example) => ({
                page,
                example,
                segments: page.path.replace(/\.html$/, "").split("/"),
                lines: example.code.split("\n").length,
            }));
    });
    const byHeader = new Map();
    for (const candidate of candidates) {
        for (const header of candidate.page.headers) {
            if (!byHeader.has(header)) byHeader.set(header, []);
            byHeader.get(header).push(candidate);
        }
    }
    const missing = [];
    for (const page of pages) {
        delete page.recommendedExamples;
        if (hasDirect(page)) continue;
        const segments = page.path.replace(/\.html$/, "").split("/");
        const pool = [
            ...new Set(
                page.headers.flatMap((header) => byHeader.get(header) || []),
            ),
        ];
        let best;
        let bestScore = -Infinity;
        let bestShared = 0;
        for (const candidate of pool) {
            let shared = 0;
            while (
                segments[shared] &&
                segments[shared] === candidate.segments[shared]
            )
                shared++;
            // Prefer the same class or parent topic, then a short readable program.
            const sameClass = shared >= 3;
            const score =
                shared * 1000 +
                (sameClass ? 500 : 0) +
                (candidate.example.curated ? 80 : 0) +
                (candidate.page.introduced === page.introduced ? 30 : 0) -
                Math.min(candidate.lines, 1000);
            if (
                score > bestScore ||
                (score === bestScore && candidate.page.path < best.page.path)
            ) {
                best = candidate;
                bestScore = score;
                bestShared = shared;
            }
        }
        if (!best) {
            missing.push(page.path);
            continue;
        }
        page.recommendedExamples = [
            {
                ...best.example,
                title: `Related example: ${best.page.name}`,
                recommendation: {
                    id: best.page.id,
                    name: best.page.name,
                    source: best.page.source,
                    relationship:
                        bestShared >= 3 ? "same type or topic" : "same header",
                },
            },
        ];
    }
    return missing;
}
