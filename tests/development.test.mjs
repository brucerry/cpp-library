import test from "node:test";
import assert from "node:assert/strict";
import { parseDevelopmentStatus } from "../scripts/development-status.mjs";

test("development editions require an explicit official status heading", () => {
    const result = parseDevelopmentStatus(
        "<h2>Recent milestones: C++26 work in progress</h2><p>C++23 is published. C++29 proposals.</p>",
    );
    assert.deepEqual(
        result.map((item) => item.version),
        ["26"],
    );
    assert.throws(() => parseDevelopmentStatus("<p>C++26 proposal</p>"));
    assert.throws(() => parseDevelopmentStatus("<h1>Access denied</h1>"));
    assert.deepEqual(
        parseDevelopmentStatus("<h2>C++29 work in progress</h2>").map(
            (item) => item.version,
        ),
        ["29"],
    );
});
