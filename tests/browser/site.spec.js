import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const index = JSON.parse(
    await readFile("public/data/library-index.json", "utf8"),
);
const entryFor = (name) => index.entries.find((entry) => entry.name === name);
async function selectMode(page, value) {
    await page.getByRole("combobox", { name: "Version matching" }).click();
    await page.locator(`[role="option"][data-mode="${value}"]`).click();
}
async function selectTheme(page, theme) {
    await page.locator(".theme-toggle").click();
    await page.locator(`[data-theme-choice="${theme}"]`).click();
}
const sort = entryFor("std::sort");
const vectorPush = entryFor("std::vector<T,Allocator>::push_back");

test("release to library to function navigation, search, copy, and version modes", async ({
    page,
    context,
}) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/#/version/23");
    await expect(page.locator("#sync-label")).toContainText("checked");
    await expect(
        page.locator('.library-card[href$="/library/expected"]'),
    ).toBeVisible();
    await page.locator('.library-card[href$="/library/vector"]').click();
    await expect(
        page.getByRole("heading", { name: "<vector>", exact: true }),
    ).toBeVisible();
    await selectMode(page, "introduced");
    await expect(page.locator(".function-row")).toHaveCount(3);
    await selectMode(page, "available");
    await page.getByRole("searchbox").fill("push_back");
    await expect(page.locator(".function-row")).toHaveCount(1);
    await page.locator(".function-row").click();
    await expect(
        page.getByRole("heading", { name: vectorPush.name, exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Examples", exact: true }).click();
    await expect(page.locator(".output-block")).toBeVisible();
    await page
        .getByRole("button", { name: "Copy C++ example 1", exact: true })
        .click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
        "push_back",
    );
    await page.reload();
    await expect(
        page.getByRole("heading", { name: vectorPush.name, exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
});
test("refresh revalidates without losing a last-good cache; visited details work offline", async ({
    page,
}) => {
    await page.goto(`/#/function/${sort.id}/all`);
    await expect(
        page.getByRole("heading", { name: "std::sort", exact: true }),
    ).toBeVisible();
    const original = await page.evaluate(() =>
        sessionStorage.getItem("cpp-library:index:v2"),
    );
    let requests = 0;
    await page.route("**/data/**", (route) => {
        requests++;
        return route.abort();
    });
    await page.reload();
    await expect(
        page.getByRole("heading", { name: "std::sort", exact: true }),
    ).toBeVisible();
    await expect(page.locator("#sync-label")).toContainText("saved copy");
    expect(
        await page.evaluate(() =>
            sessionStorage.getItem("cpp-library:index:v2"),
        ),
    ).toEqual(original);
    expect(requests).toBeGreaterThan(0);
});
test("first visit failure, invalid cache, empty search, and unknown route have recovery states", async ({
    page,
}) => {
    await page.addInitScript(() =>
        sessionStorage.setItem("cpp-library:index:v2", "broken"),
    );
    await page.route("**/data/library-index.json", (route) =>
        route.fulfill({ status: 503, body: "Unavailable" }),
    );
    await page.goto("/");
    await expect(page.locator("#initial-status")).toContainText(
        "Unable to fetch",
    );
    await page.unroute("**/data/library-index.json");
    await page.getByRole("button", { name: "Retry loading" }).click();
    await expect(page.locator(".library-card").first()).toBeVisible();
    await page.getByRole("searchbox").fill("not-a-real-function");
    await expect(
        page.getByRole("heading", { name: "No matching functions" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(page.locator(".library-card").first()).toBeVisible();
    await page.goto("/#/function/missing");
    await expect(
        page.getByRole("heading", { name: "That page is not in the library." }),
    ).toBeVisible();
});
test("C++03 shows existing libraries without inventing new headers", async ({
    page,
}) => {
    await page.goto("/#/version/03");
    await expect(
        page.getByRole("heading", { name: "C++03", exact: true }).first(),
    ).toBeVisible();
    await expect(
        page.getByRole("combobox", { name: "Version matching" }),
    ).toHaveAttribute("data-value", "available");
    await expect(page.locator(".library-card")).toHaveCount(69);
    await expect(
        page.locator('.library-card[href$="/library/vector"]'),
    ).toBeVisible();
    await expect(
        page.locator('.library-card[href$="/library/expected"]'),
    ).toHaveCount(0);
    await selectMode(page, "introduced");
    await expect(page.locator(".library-card")).toHaveCount(0);
});
test("mobile navigation, readable font sizes, keyboard, and themes", async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/version/17");
    await expect(page.locator(".library-card").first()).toBeVisible();
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await expect(
        page.getByRole("button", { name: "Toggle navigation" }),
    ).toHaveAttribute("aria-expanded", "true");
    await page
        .locator('#versions > .nav-release > a[href="#/version/20"]')
        .click();
    await expect(page.locator(".sidebar")).toHaveAttribute("inert", "");
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBe(true);
    expect(
        await page
            .locator(".library-card p")
            .first()
            .evaluate((element) =>
                parseFloat(getComputedStyle(element).fontSize),
            ),
    ).toBeGreaterThanOrEqual(14);
    await page.goto(`/#/function/${sort.id}/all`);
    await expect(
        page.getByRole("heading", { name: "std::sort", exact: true }),
    ).toBeVisible();
    await page.screenshot({
        path: ".tmp/mobile-v2.png",
        fullPage: true,
        animations: "disabled",
    });
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBe(true);
    await selectTheme(page, "dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("English-only interface, source attribution, and coverage disclosure", async ({
    page,
}) => {
    await page.goto("/#/coverage");
    await expect(
        page.getByRole("heading", { name: "Completeness status" }),
    ).toBeVisible();
    expect(await page.locator("body").innerText()).not.toMatch(
        /[\u3400-\u9fff\uf900-\ufaff]/,
    );
    await page.goto("/#/about");
    await expect(
        page.getByRole("heading", { name: "Sources and attribution" }),
    ).toBeVisible();
    await expect(
        page.getByRole("link", {
            name: "Creative Commons Attribution-ShareAlike 3.0 Unported",
        }),
    ).toBeVisible();
});
test("desktop light and dark visual checkpoints", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto("/");
    await expect(page.locator(".library-card").first()).toBeVisible();
    await page.screenshot({
        path: ".tmp/desktop-v2.png",
        animations: "disabled",
    });
    await selectTheme(page, "dark");
    await page.screenshot({ path: ".tmp/dark-v2.png", animations: "disabled" });
    await page.keyboard.press("/");
    await expect(page.getByRole("searchbox")).toBeFocused();
});

test("sidebar library counts match the active release and Show filter", async ({
    page,
}) => {
    await page.goto("/");
    await expect(page.locator(".library-card").first()).toBeVisible();
    for (const mode of ["introduced", "available"]) {
        await selectMode(page, mode);
        for (const version of index.standards) {
            await page
                .locator(
                    `#versions > .nav-release > a[href="#/version/${version}"]`,
                )
                .click();
            await expect(
                page.locator(
                    `#versions > .nav-release > a[href="#/version/${version}"]`,
                ),
            ).toHaveAttribute("aria-current", "page");
            const badge = page.locator(".version-button.active .count");
            const count = Number(await badge.innerText());
            await expect(page.locator(".library-card")).toHaveCount(count);
            await expect(page.locator(".nav-libraries a")).toHaveCount(count);
            await expect(page.locator("#result-count")).toContainText(
                `${count} libraries`,
            );
        }
    }
    const first = page.locator(".nav-libraries a").first();
    const count = Number(await first.locator("span").innerText());
    await first.click();
    await expect(page.locator("#result-count")).toContainText(
        `${count.toLocaleString("en-US")} matching`,
    );
});

test("search is prominent and custom dropdown options have readable theme colors", async ({
    page,
}) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("searchbox")).toBeVisible();
    expect((await page.getByRole("searchbox").boundingBox()).y).toBeLessThan(
        350,
    );
    for (const theme of ["light", "dark", "colorful"]) {
        if ((await page.locator("html").getAttribute("data-theme")) !== theme) {
            await selectTheme(page, theme);
        }
        const contrast = await page
            .locator("#mode-options [role=option]")
            .first()
            .evaluate((element) => {
                const style = getComputedStyle(element);
                const luminance = (color) => {
                    const rgb = color
                        .match(/[\d.]+/g)
                        .slice(0, 3)
                        .map(Number)
                        .map((value) => {
                            const channel = value / 255;
                            return channel <= 0.04045
                                ? channel / 12.92
                                : ((channel + 0.055) / 1.055) ** 2.4;
                        });
                    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
                };
                const text = luminance(style.color);
                const background = luminance(style.backgroundColor);
                return (
                    (Math.max(text, background) + 0.05) /
                    (Math.min(text, background) + 0.05)
                );
            });
        expect(contrast).toBeGreaterThanOrEqual(4.5);
        await selectMode(page, "available");
        await expect(
            page.getByRole("combobox", { name: "Version matching" }),
        ).toHaveAttribute("data-value", "available");
    }
});

test("recommended examples are explicitly related and keep their own attribution", async ({
    page,
}) => {
    const entry = index.entries.find((entry) => entry.hasRecommendation);
    expect(entry).toBeTruthy();
    await page.goto(`/#/function/${entry.id}/all`);
    await page.getByRole("tab", { name: "Examples", exact: true }).click();
    await expect(page.locator(".related-example")).toContainText(
        "not this exact API",
    );
    await expect(page.locator("#examples .code-block")).toBeVisible();
    await expect(page.locator(".coverage-notice")).toHaveCount(0);
});

test("navigation titles, theme icons, layout preference, and development status", async ({
    page,
}) => {
    await page.goto("/");
    await expect(page.locator(".library-card").first()).toBeVisible();
    await expect(page).toHaveTitle("CPP Library - All releases");
    await expect(page.locator("#crumb")).toHaveText("All releases");
    await expect(
        page.getByRole("heading", { name: "C++ Library", exact: true }),
    ).toHaveCount(0);
    await expect(page.locator(".coverage-link")).toHaveCount(0);
    const moon = await page.locator(".theme-toggle svg").innerHTML();
    await selectTheme(page, "dark");
    expect(await page.locator(".theme-toggle svg").innerHTML()).not.toEqual(
        moon,
    );
    await selectTheme(page, "light");
    expect(await page.locator(".theme-toggle svg").innerHTML()).toEqual(moon);
    await page
        .getByRole("button", { name: "List layout", exact: true })
        .click();
    await expect(page.locator(".library-grid").first()).toHaveClass(
        /list-layout/,
    );
    const cards = page.locator(".library-card");
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first.x).toBe(second.x);
    expect(second.y).toBeGreaterThan(first.y + first.height);
    await page.reload();
    await expect(
        page.getByRole("button", { name: "List layout" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.screenshot({ path: ".tmp/list-layout.png" });
    await page.locator(".filter-row .development-chip").first().click();
    await expect(
        page.getByRole("heading", { name: "C++26", exact: true }),
    ).toBeVisible();
    await expect(page).toHaveTitle("CPP Library - C++26 - Under development");
    await expect(
        page.getByRole("link", { name: "Official status" }),
    ).toHaveAttribute("href", "https://isocpp.org/std/status");
    await page
        .locator("#crumb")
        .getByRole("link", { name: "All releases" })
        .click();
    await expect(page.getByRole("searchbox")).toBeVisible();
});

test("function tabs support deep links, browser history, keyboard, and breadcrumbs", async ({
    page,
}) => {
    await page.goto(`/#/function/${sort.id}/all/examples`);
    await expect(
        page.getByRole("tab", { name: "Examples", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('[role="tabpanel"]:visible')).toHaveCount(1);
    await expect(page.locator("#definition")).toBeHidden();
    await expect(page.locator("#examples")).toBeVisible();
    await page.getByRole("tab", { name: "Declarations", exact: true }).click();
    await expect(page).toHaveTitle("CPP Library - std::sort - Declarations");
    await expect(page.locator("#examples")).toBeHidden();
    await page.goBack();
    await expect(page.locator("#examples")).toBeVisible();
    await page.reload();
    await expect(page.locator("#examples")).toBeVisible();
    await page.getByRole("tab", { name: "Overview", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
        page.getByRole("tab", { name: "Declarations", exact: true }),
    ).toBeFocused();
    await page.screenshot({ path: ".tmp/function-tabs.png" });
    await page
        .locator("#crumb")
        .getByRole("link", { name: "<algorithm>", exact: true })
        .click();
    await expect(
        page.getByRole("heading", { name: "<algorithm>", exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/#/function/${sort.id}/all/examples`);
    await expect(page.locator("#examples")).toBeVisible();
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBe(true);
});

test("custom dropdown supports keyboard and outside dismissal", async ({
    page,
}) => {
    await page.goto("/");
    const trigger = page.getByRole("combobox", { name: "Version matching" });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(
        page.locator("#mode-options [role=option]").first(),
    ).toHaveText("Available in this version");
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("data-value", "introduced");
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await page.getByRole("searchbox").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await page.screenshot({ path: ".tmp/dropdown-light.png" });
    await page.keyboard.press("Escape");
    await selectTheme(page, "dark");
    await trigger.click();
    await page.screenshot({ path: ".tmp/dropdown-dark.png" });
});

test("persistent cube field responds to the pointer and respects reduced motion", async ({
    page,
}) => {
    await page.goto("/");
    await expect(page.getByRole("searchbox")).toBeVisible();
    await expect(page.locator(".cursor-particles")).toHaveAttribute(
        "data-effect",
        "wave-field",
    );
    const initialCount = Number(
        await page.locator(".cursor-particles").getAttribute("data-count"),
    );
    expect(initialCount).toBeGreaterThan(100);
    expect(initialCount).toBeLessThan(1200);
    const imageBefore = await page
        .locator(".cursor-particles")
        .evaluate((canvas) => canvas.toDataURL());
    await page.mouse.move(600, 180);
    await page.mouse.move(780, 210, { steps: 12 });
    await expect(page.locator(".cursor-particles")).toHaveAttribute(
        "data-active",
        "true",
    );
    expect(
        await page
            .locator(".cursor-particles")
            .evaluate((canvas) => canvas.toDataURL()),
    ).not.toEqual(imageBefore);
    expect(
        Number(
            await page.locator(".cursor-particles").getAttribute("data-count"),
        ),
    ).toBe(initialCount);
    expect(
        await page
            .locator(".cursor-particles")
            .evaluate((element) => getComputedStyle(element).pointerEvents),
    ).toBe("none");
    await expect(page.locator(".cursor-particles")).toHaveAttribute(
        "data-active",
        "false",
        { timeout: 2500 },
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.mouse.move(600, 160, { steps: 5 });
    await expect(page.locator(".cursor-particles")).toBeHidden();
    await expect(page.locator(".cursor-particles")).toHaveAttribute(
        "data-active",
        "false",
    );
});

test("three-theme hover menu, Jelly-style icons, and development return button", async ({
    page,
}) => {
    await page.goto("/");
    await expect(page.getByRole("searchbox")).toBeVisible();
    await expect(page.locator(".side-bottom")).toHaveCount(0);
    await expect(page.locator(".jelly-background .jelly-icon")).toHaveCount(64);
    await expect(
        page.locator("svg.icon:not(.jelly-icon):not(.github-icon)"),
    ).toHaveCount(0);
    await page.locator(".theme-toggle").hover();
    await expect(page.getByRole("menu", { name: "Color theme" })).toBeVisible();
    await expect(page.getByRole("menuitemradio")).toHaveCount(3);
    await expect(
        page.getByRole("menuitemradio", { name: "Light", exact: true }),
    ).toHaveAttribute("aria-checked", "true");
    await page
        .getByRole("menuitemradio", { name: "Colorful", exact: true })
        .click();
    await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        "colorful",
    );
    await expect(
        page.locator('.theme-toggle [data-icon="paint"]'),
    ).toBeVisible();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        "colorful",
    );
    await page.locator(".theme-toggle").hover();
    await expect(
        page.getByRole("menuitemradio", { name: "Colorful", exact: true }),
    ).toHaveAttribute("aria-checked", "true");
    await page.screenshot({ path: ".tmp/colorful-jelly.png" });
    await page.mouse.move(400, 150);
    await expect(page.getByRole("menu", { name: "Color theme" })).toBeHidden();
    await page.locator(".theme-toggle").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.locator(".theme-toggle").click();
    await page.keyboard.press("Escape");
    await expect(page.locator(".theme-toggle")).toBeFocused();
    await expect(page.locator("#theme-menu")).toBeHidden();
    await page.locator(".filter-row .development-chip").first().click();
    await page
        .locator("main")
        .getByRole("link", { name: "All releases", exact: true })
        .click();
    await expect(page).toHaveTitle("CPP Library - All releases");
    await page.setViewportSize({ width: 390, height: 844 });
    await selectTheme(page, "colorful");
    await page.locator(".theme-toggle").click();
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBe(true);
    await page.screenshot({ path: ".tmp/colorful-mobile.png" });
});

test("selected release collapses without navigating and available groups accumulate correctly", async ({
    page,
}) => {
    await page.goto("/#/version/23");
    const selected = page.locator('.version-button[data-version="23"]');
    await expect(selected).toHaveAttribute("aria-expanded", "true");
    await selected.click();
    await expect(selected).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#libraries-23")).toBeHidden();
    await expect(page).toHaveURL(/#\/version\/23$/);
    await selected.press("Enter");
    await expect(page.locator("#libraries-23")).toBeVisible();
    await page.locator(".overview").click();
    await selectMode(page, "available");
    const expected = [69, 69, 105, 106, 114, 124, 134];
    for (const [position, version] of index.standards.entries()) {
        const group = page.locator(`.library-group[data-version="${version}"]`);
        await expect(group.locator(".library-card")).toHaveCount(
            expected[position],
        );
        await expect(
            page.locator(`.version-button[data-version="${version}"] .count`),
        ).toHaveText(String(expected[position]));
        await expect(group.locator(".group-heading > span")).toHaveText(
            `${expected[position]} headers`,
        );
    }
    const group = page.locator('.library-group[data-version="11"]');
    const vector = group.locator('.library-card[href$="/library/vector"]');
    const count = Number(
        (await vector.locator(".card-bottom span").innerText()).split(" ")[0],
    );
    await vector.click();
    await expect(page).toHaveURL(/#\/version\/11\/library\/vector$/);
    await expect(page.locator("#result-count")).toContainText(
        `${count} matching reference pages`,
    );
});

test("scroll controls, original GitHub icon, theme symbols, and distributed background", async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("searchbox")).toBeVisible();
    const github = page
        .getByRole("link", { name: "Project on GitHub" })
        .locator("svg");
    await expect(github).toHaveClass(/github-icon/);
    await expect(github.locator(".jelly-fill")).toHaveCount(0);
    await page.locator(".theme-toggle").click();
    await expect(
        page
            .getByRole("menuitemradio", { name: "Light", exact: true })
            .locator('[data-icon="sun"]'),
    ).toBeVisible();
    await expect(
        page
            .getByRole("menuitemradio", { name: "Dark", exact: true })
            .locator('[data-icon="moon"]'),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page
        .getByRole("button", { name: "Scroll to bottom", exact: true })
        .click();
    await expect
        .poll(() =>
            page.evaluate(() =>
                Math.abs(
                    scrollY +
                        innerHeight -
                        document.documentElement.scrollHeight,
                ),
            ),
        )
        .toBeLessThanOrEqual(2);
    await page
        .getByRole("button", { name: "Scroll to top", exact: true })
        .click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    const spread = await page
        .locator(".jelly-background")
        .evaluate((element) => {
            const area = element.getBoundingClientRect();
            const boxes = [...element.children].map((child) =>
                child.getBoundingClientRect(),
            );
            const centers = boxes.map((box) => ({
                x: box.x + box.width / 2,
                y: box.y + box.height / 2,
            }));
            return {
                count: boxes.length,
                width:
                    (Math.max(...centers.map((p) => p.x)) -
                        Math.min(...centers.map((p) => p.x))) /
                    area.width,
                height:
                    (Math.max(...centers.map((p) => p.y)) -
                        Math.min(...centers.map((p) => p.y))) /
                    area.height,
            };
        });
    expect(spread.count).toBe(64);
    expect(spread.width).toBeGreaterThan(0.85);
    expect(spread.height).toBeGreaterThan(0.85);
    await selectTheme(page, "colorful");
    const colors = await page
        .locator(".library-card")
        .evaluateAll((cards) =>
            cards
                .slice(0, 6)
                .map((card) =>
                    getComputedStyle(card).getPropertyValue("--accent").trim(),
                ),
        );
    expect(new Set(colors).size).toBe(6);
    await page.screenshot({ path: ".tmp/colorful-expanded.png" });
});

test("new and updated header counts are distinguished and GitHub highlights in every theme", async ({
    page,
}) => {
    await page.goto("/#/version/11");
    await expect(page.locator(".library-card").first()).toBeVisible();
    await selectMode(page, "introduced");
    await expect(page.locator(".group-heading > span")).toHaveText(
        "83 libraries · 36 new + 47 updated",
    );
    await expect(
        page.locator('.version-button[data-version="11"] .count'),
    ).toHaveAttribute(
        "title",
        "36 new headers + 47 existing headers with new facilities",
    );
    await expect(
        page.getByRole("combobox", { name: "Version matching" }),
    ).toContainText("New or updated in this version");
    await selectMode(page, "available");
    await expect(page.locator(".library-card")).toHaveCount(105);
    await expect(
        page.locator('.version-button[data-version="11"] .count'),
    ).toHaveText("105");
    const github = page.getByRole("link", { name: "Project on GitHub" });
    const refresh = page.locator("#refresh-data");
    for (const theme of ["light", "dark", "colorful"]) {
        await selectTheme(page, theme);
        await refresh.hover();
        const highlight = await refresh.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
        );
        await github.hover();
        expect(
            await github.evaluate(
                (element) => getComputedStyle(element).backgroundColor,
            ),
        ).toBe(highlight);
        await page.mouse.move(500, 150);
        await refresh.focus();
        await page.keyboard.press("Tab");
        await expect(github).toBeFocused();
        expect(
            await github.evaluate(
                (element) => getComputedStyle(element).backgroundColor,
            ),
        ).toBe(highlight);
    }
});

test("shared function keeps its selected library across tabs, reload, and back navigation", async ({
    page,
}) => {
    const shared = entryFor("std::begin, std::cbegin");
    await page.goto("/#/version/11/library/vector");
    await expect(page.locator(".function-row").first()).toBeVisible();
    await page.getByRole("searchbox").fill("std::begin");
    await page.locator(".function-row").click();
    await expect(page.locator(".detail h1")).toHaveText(shared.name);
    await expect(page.locator("#crumb")).toContainText("<vector>");
    await expect(page.locator("#crumb")).not.toContainText("<array>");
    await page.getByRole("tab", { name: "Declarations", exact: true }).click();
    await expect(page).toHaveURL(/\/11\/declarations\/library\/vector$/);
    await page.reload();
    await expect(page.locator("#crumb")).toContainText("<vector>");
    await expect(page.locator("#panel-declarations")).toContainText(
        "decltype(c.begin())",
    );
    await expect(page.locator("#panel-declarations")).not.toContainText(
        "constexpr auto cbegin",
    );
    await page.locator(".detail > .back-link").click();
    await expect(page).toHaveURL(/\/version\/11\/library\/vector$/);
});

test("header search scopes results for exact, partial, and typo queries", async ({
    page,
}) => {
    await page.goto("/");
    await expect(page.locator(".library-card").first()).toBeVisible();
    for (const query of ["<vector>", "<vec", "<vecott", "vector"]) {
        await page.getByRole("searchbox").fill(query);
        await expect(page.locator(".header-suggestions a")).toHaveCount(1);
        await expect(page.locator(".header-suggestions a")).toHaveText(
            "<vector>",
        );
        const links = await page
            .locator(".function-row")
            .evaluateAll((rows) => rows.map((row) => row.getAttribute("href")));
        expect(links.length).toBeGreaterThan(0);
        expect(links.every((href) => href.endsWith("/library/vector"))).toBe(
            true,
        );
    }
    await page.locator(".header-suggestions a").click();
    await expect(page.locator(".page-heading h1")).toHaveText("<vector>");
    await expect(page.getByRole("searchbox")).toHaveValue("");
});

test("mixed search terms rank API names before partial and related matches", async ({
    page,
}) => {
    await page.goto("/");
    await expect(page.locator(".library-card").first()).toBeVisible();
    for (const query of ["sort <algo", "<algo sort", "sort \\<algo"]) {
        await page.getByRole("searchbox").fill(query);
        await expect(page.locator(".function-row h3").first()).toHaveText(
            "std::sort",
        );
        const links = await page
            .locator(".function-row")
            .evaluateAll((rows) => rows.map((row) => row.getAttribute("href")));
        expect(links.every((href) => href.endsWith("/library/algorithm"))).toBe(
            true,
        );
        const names = await page.locator(".function-row h3").allTextContents();
        expect(names.indexOf("std::stable_sort")).toBeGreaterThan(
            names.indexOf("std::sort"),
        );
    }
    for (const query of ["<vec end", "end <vec", "<vecott end"]) {
        await page.getByRole("searchbox").fill(query);
        await expect(page.locator(".function-row h3").first()).toContainText(
            "end",
        );
        const links = await page
            .locator(".function-row")
            .evaluateAll((rows) => rows.map((row) => row.getAttribute("href")));
        expect(links.length).toBeGreaterThan(0);
        expect(links.every((href) => href.endsWith("/library/vector"))).toBe(
            true,
        );
    }
    await page.getByRole("searchbox").fill("srot <algo");
    await expect(page.locator(".function-row h3").first()).toHaveText(
        "std::sort",
    );
});

test("available is the default and headers without indexed pages explain their facilities", async ({
    page,
}) => {
    await page.goto("/#/version/23");
    await expect(
        page.getByRole("combobox", { name: "Version matching" }),
    ).toHaveAttribute("data-value", "available");
    await expect(page.locator(".library-card")).toHaveCount(134);
    await expect(
        page.locator(".card-bottom").filter({ hasText: /^0 reference pages/ }),
    ).toHaveCount(0);
    for (const [header, label] of [
        ["climits", "Integer limit macros"],
        ["cstdint", "Integer types & macros"],
        ["numbers", "Mathematical constants"],
        ["stdfloat", "Floating-point types"],
        ["version", "Feature-test macros"],
        ["iosfwd", "Forward declarations"],
        ["limits.h", "Integer limit macros"],
        ["iso646.h", "Empty compatibility header"],
    ]) {
        const library = index.libraries.find((item) => item.header === header);
        const card = page.locator(
            `.library-card[href$="/library/${library.id}"]`,
        );
        await expect(card.locator(".card-bottom")).toContainText(label);
        await card.click();
        await expect(page.locator(".header-overview h3")).toHaveText(label);
        await expect(page.locator(".header-overview")).toContainText(
            "Header availability and reference-page coverage are separate",
        );
        await expect(
            page.locator(".header-overview a.primary-button"),
        ).toHaveAttribute("href", library.source);
        await expect(page.locator("#crumb")).toContainText(`<${header}>`);
        await expect(page.locator("#reset-filters")).toHaveCount(0);
        await page.locator(".page-heading .back-link").click();
        await expect(page.locator(".library-card")).toHaveCount(134);
    }
    await page.reload();
    await expect(
        page.getByRole("combobox", { name: "Version matching" }),
    ).toHaveAttribute("data-value", "available");
});
