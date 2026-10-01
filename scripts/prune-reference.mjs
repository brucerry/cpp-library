import { readFile, readdir, rm } from "node:fs/promises";
import { resolve, dirname, sep } from "node:path";

// Remove only superseded generated JSON files, never source or archive evidence.
const manifest = JSON.parse(
    await readFile("public/data/library-index.json", "utf8"),
);
const keep = new Set(
    [
        ...manifest.entries.map((entry) => entry.detail),
        ...manifest.libraries
            .map((library) => library.overview)
            .filter(Boolean),
    ].map((path) => resolve("public/data", path)),
);
let removed = 0;
for (const kind of ["reference", "overviews"]) {
    const contentRoot = resolve("public/data", kind);
    let releases;
    try {
        releases = await readdir(contentRoot, { withFileTypes: true });
    } catch (error) {
        if (error.code === "ENOENT") continue;
        throw error;
    }
    for (const release of releases) {
        if (!release.isDirectory() || !/^v\d{8}$/.test(release.name)) continue;
        const directory = resolve(contentRoot, release.name);
        if (!directory.startsWith(contentRoot + sep))
            throw new Error("Unexpected reference directory");
        for (const file of await readdir(directory, { withFileTypes: true })) {
            if (
                !file.isFile() ||
                !(
                    kind === "reference"
                        ? /^ref-[a-f0-9]{16}-[a-f0-9]{16}\.json$/
                        : /^header-[a-z0-9_-]+-[a-f0-9]{16}\.json$/
                ).test(file.name)
            )
                continue;
            const target = resolve(directory, file.name);
            if (
                dirname(target) !== directory ||
                !target.startsWith(contentRoot + sep)
            )
                throw new Error("Unexpected reference path");
            if (!keep.has(target)) {
                await rm(target);
                removed++;
            }
        }
    }
}
console.log(
    `Removed ${removed} superseded generated reference/overview files.`,
);
