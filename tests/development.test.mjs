import test from "node:test";
import assert from "node:assert/strict";
import {
    parseDevelopmentStatus,
    fetchDevelopmentStatus,
} from "../scripts/development-status.mjs";

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

test("unavailable official status preserves verified data and its check date", async () => {
    const previous = {
        checkedAt: "2026-01-01T00:00:00.000Z",
        editions: parseDevelopmentStatus("<h2>C++26 work in progress</h2>"),
    };
    const warnings = [];
    const fetcher = async () => new Response("Forbidden", { status: 403 });
    const result = await fetchDevelopmentStatus({
        previous,
        fetcher,
        warn: (message) => warnings.push(message),
    });
    assert.deepEqual(result, previous);
    assert.match(warnings[0], /HTTP 403.*2026-01-01/);
    await assert.rejects(fetchDevelopmentStatus({ fetcher }), /HTTP 403/);
    await assert.rejects(
        fetchDevelopmentStatus({
            previous: { ...previous, editions: [] },
            fetcher,
        }),
        /HTTP 403/,
    );
    await assert.rejects(
        fetchDevelopmentStatus({
            previous,
            fetcher: async () => new Response("<h1>Status changed</h1>"),
        }),
        /needs review/,
    );
    const refreshed = await fetchDevelopmentStatus({
        previous,
        fetcher: async () => new Response("<h2>C++29 work in progress</h2>"),
    });
    assert.equal(refreshed.editions[0].version, "29");
    assert.notEqual(refreshed.checkedAt, previous.checkedAt);
});
