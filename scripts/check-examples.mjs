import { mkdir, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { entries } from "../src/catalog.js";
import { supplementalExamples } from "../src/supplemental-examples.js";
import { familyExamples } from "../src/family-examples.js";

const examples = [
    ...entries,
    ...supplementalExamples,
    ...familyExamples,
].filter(
    (entry) =>
        !process.env.EXAMPLE_FILTER ||
        new RegExp(process.env.EXAMPLE_FILTER).test(entry.id),
);
if (!examples.length) throw new Error("No examples matched EXAMPLE_FILTER");

const directory = resolve(".tmp/examples");
await mkdir(directory, { recursive: true });
let failures = 0;
for (const entry of examples) {
    const source = resolve(directory, `${entry.id}.cpp`);
    const binary = resolve(
        directory,
        `${entry.id}${process.platform === "win32" ? ".exe" : ""}`,
    );
    await writeFile(source, entry.example);
    const standard = entry.version === "98" ? "11" : entry.version;
    const compile = spawnSync(
        process.env.CXX || "g++",
        [
            `-std=c++${standard}`,
            "-Wall",
            "-Wextra",
            "-pedantic",
            "-pthread",
            source,
            "-o",
            binary,
            ...(entry.id === "print" && process.platform === "win32"
                ? ["-lstdc++exp"]
                : []),
        ],
        { encoding: "utf8", timeout: 30000 },
    );
    if (compile.status !== 0) {
        failures++;
        console.error(
            `FAIL ${entry.id}: ${compile.error?.message || compile.stderr}`,
        );
        continue;
    }
    const run = spawnSync(binary, [], { encoding: "utf8", timeout: 5000 });
    if (
        run.status !== 0 ||
        run.stdout.replace(/\r\n/g, "\n") !== entry.output
    ) {
        failures++;
        console.error(
            `FAIL ${entry.id}: expected ${JSON.stringify(entry.output)}, received ${JSON.stringify(run.stdout)} (${run.error?.message || run.stderr})`,
        );
    } else console.log(`PASS ${entry.name || entry.id} (C++${standard})`);
}
// Only remove this script's known generated binaries and source files.
for (const entry of examples) {
    await rm(resolve(directory, `${entry.id}.cpp`), { force: true });
    await rm(
        resolve(
            directory,
            `${entry.id}${process.platform === "win32" ? ".exe" : ""}`,
        ),
        { force: true },
    );
}
if (failures) process.exitCode = 1;
