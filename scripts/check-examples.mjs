import { mkdir, mkdtemp, writeFile, rm, rmdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { entries } from "../src/catalog.js";
import { supplementalExamples } from "../src/supplemental-examples.js";
import { completionExamples } from "../src/completion-examples.js";
import { headerExamples } from "../src/header-examples.js";
import { familyExamples } from "../src/family-examples.js";

const examples = [
    ...entries,
    ...supplementalExamples,
    ...familyExamples,
    ...completionExamples.filter(
        (entry) => entry.id !== "completion-locale-encoding",
    ),
    ...Object.entries(headerExamples).map(([id, sample]) => ({
        id: `header-${id}`,
        ...sample,
    })),
].filter(
    (entry) =>
        !process.env.EXAMPLE_FILTER ||
        new RegExp(process.env.EXAMPLE_FILTER).test(entry.id),
);
if (!examples.length) throw new Error("No examples matched EXAMPLE_FILTER");

const examplesRoot = resolve(".tmp/examples");
await mkdir(examplesRoot, { recursive: true });
const directory = await mkdtemp(resolve(examplesRoot, "run-"));
let failures = 0,
    passed = 0,
    skipped = 0;
const compilerFlags = (process.env.CXXFLAGS || "").split(/\s+/).filter(Boolean);
if (spawnSync(process.env.CXX || "g++", ["--version"]).status !== 0)
    throw new Error("C++ compiler is unavailable");
function skip(message) {
    skipped++;
    console.log(message);
    if (process.env.EXAMPLE_REQUIRE_SUPPORT === "1") failures++;
}
for (const entry of examples) {
    const source = resolve(directory, `${entry.id}.cpp`);
    const binary = resolve(
        directory,
        `${entry.id}${process.platform === "win32" ? ".exe" : ""}`,
    );
    await writeFile(source, entry.example);
    const standard =
        entry.minimumVersion || (entry.version === "98" ? "11" : entry.version);
    if (entry.probe) {
        const probe = spawnSync(
            process.env.CXX || "g++",
            [
                `-std=c++${standard}`,
                "-x",
                "c++",
                "-c",
                "-o",
                "/dev/null",
                "-Wsystem-headers",
                "-Werror=return-type",
                ...compilerFlags,
                "-",
            ],
            { input: entry.probe, encoding: "utf8", timeout: 30000 },
        );
        if (probe.status !== 0) {
            skip(
                `SKIP ${entry.id}: documented overload is unavailable in this implementation`,
            );
            continue;
        }
    }
    if (entry.feature) {
        const probe = spawnSync(
            process.env.CXX || "g++",
            [`-std=c++${standard}`, ...compilerFlags, "-x", "c++", "-E", "-"],
            {
                input: `#include <version>\n#if !(${entry.feature})\n#error unavailable\n#endif\n`,
                encoding: "utf8",
                timeout: 30000,
            },
        );
        if (probe.status !== 0) {
            skip(`SKIP ${entry.id}: library does not support ${entry.feature}`);
            continue;
        }
    }
    const compile = spawnSync(
        process.env.CXX || "g++",
        [
            `-std=c++${standard}`,
            ...compilerFlags,
            "-Wall",
            "-Wextra",
            "-pedantic",
            "-pthread",
            source,
            "-o",
            binary,
            ...(entry.flags || []),
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
    } else {
        passed++;
        console.log(`PASS ${entry.name || entry.id} (C++${standard})`);
    }
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
await rmdir(directory);
console.log(
    `Examples: ${passed} passed, ${skipped} unavailable, ${failures} failed`,
);
if (failures) process.exitCode = 1;
