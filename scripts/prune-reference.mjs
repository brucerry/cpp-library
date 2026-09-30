import { readFile, readdir, rm } from "node:fs/promises";
import { resolve, dirname, sep } from "node:path";

// Remove only superseded generated JSON files, never source or archive evidence.
const manifest = JSON.parse(
    await readFile("public/data/library-index.json", "utf8"),
);
const root = resolve("public/data/reference");
const keep = new Set(
    manifest.entries.map((entry) => resolve("public/data", entry.detail)),
);
let removed = 0;
for (const release of await readdir(root, { withFileTypes: true })) {
    if (!release.isDirectory() || !/^v\d{8}$/.test(release.name)) continue;
    const directory = resolve(root, release.name);
    if (!directory.startsWith(root + sep))
        throw new Error("Unexpected reference directory");
    for (const file of await readdir(directory, { withFileTypes: true })) {
        if (
            !file.isFile() ||
            !/^ref-[a-f0-9]{16}-[a-f0-9]{16}\.json$/.test(file.name)
        )
            continue;
        const target = resolve(directory, file.name);
        if (dirname(target) !== directory || !target.startsWith(root + sep))
            throw new Error("Unexpected reference path");
        if (!keep.has(target)) {
            await rm(target);
            removed++;
        }
    }
}
console.log(`Removed ${removed} superseded generated reference files.`);
