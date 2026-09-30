import { load } from "cheerio";
import { readFile, writeFile, rename } from "node:fs/promises";

export function parseDevelopmentStatus(html) {
    const $ = load(html);
    const versions = new Set();
    $("h1, h2, h3, h4").each((_, element) => {
        const match = $(element)
            .text()
            .match(/C\+\+(\d{2})\s+work in progress/i);
        if (match) versions.add(match[1]);
    });
    if (!versions.size)
        throw new Error(
            "Official development status needs review; refusing to guess a draft version.",
        );
    return [...versions].map((version) => ({
        version,
        status: "Under development",
        source: "https://isocpp.org/std/status",
        draft: "https://github.com/cplusplus/draft",
    }));
}
export async function fetchDevelopmentStatus({
    previous,
    fetcher = fetch,
    warn = console.warn,
} = {}) {
    let html;
    try {
        const response = await fetcher("https://isocpp.org/std/status", {
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok)
            throw new Error(`Official status: HTTP ${response.status}`);
        html = await response.text();
    } catch (error) {
        const checkedAt = Date.parse(previous?.checkedAt);
        if (
            !Number.isFinite(checkedAt) ||
            checkedAt > Date.now() ||
            !Array.isArray(previous?.editions) ||
            !previous.editions.length ||
            !previous.editions.every(
                (item) =>
                    /^\d{2}$/.test(item.version) &&
                    item.status === "Under development" &&
                    item.source === "https://isocpp.org/std/status" &&
                    item.draft === "https://github.com/cplusplus/draft",
            )
        )
            throw error;
        warn(
            `Official status unavailable (${error.message}); retaining status checked ${previous.checkedAt}.`,
        );
        return previous;
    }
    return {
        checkedAt: new Date().toISOString(),
        editions: parseDevelopmentStatus(html),
    };
}
if (process.argv.includes("--update-index")) {
    const index = JSON.parse(
        await readFile("public/data/library-index.json", "utf8"),
    );
    index.development = await fetchDevelopmentStatus({
        previous: index.development,
    });
    index.syncedAt = new Date().toISOString();
    await writeFile(
        "public/data/library-index.json.tmp",
        JSON.stringify(index) + "\n",
    );
    await rename(
        "public/data/library-index.json.tmp",
        "public/data/library-index.json",
    );
    console.log(index.development);
}
