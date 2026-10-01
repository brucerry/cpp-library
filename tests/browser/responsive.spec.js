import { test, expect } from "@playwright/test";

const screens = [
    ["iPhone SE compact", 320, 568],
    ["iPhone SE", 375, 667],
    ["iPhone SE landscape", 667, 375],
    ["iPad portrait", 768, 1024],
    ["iPad landscape", 1024, 768],
    ["iPad Pro portrait", 1024, 1366],
    ["iPad Pro landscape", 1366, 1024],
];

for (const [name, width, height] of screens) {
    test.describe(name, () => {
        test.use({
            viewport: { width, height },
            isMobile: true,
            hasTouch: true,
        });
        test("touch navigation, search, details, themes and scrolling", async ({
            page,
        }, testInfo) => {
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            const fits = async () => {
                expect(
                    await page.evaluate(
                        () =>
                            document.documentElement.scrollWidth <= innerWidth,
                    ),
                ).toBe(true);
            };
            await page.goto("/");
            await expect(page.locator(".library-card").first()).toBeVisible();
            await fits();
            if (width <= 820)
                await page
                    .getByRole("button", { name: "Toggle navigation" })
                    .tap();
            await page
                .locator('#versions > .nav-release > a[href="#/version/11"]')
                .tap();
            await expect(page.locator(".library-card")).toHaveCount(105);
            if (width <= 820)
                await expect(page.locator(".sidebar")).toHaveAttribute(
                    "inert",
                    "",
                );
            await page
                .getByRole("combobox", { name: "Version matching" })
                .tap();
            await page.locator('[role="option"][data-mode="available"]').tap();
            await expect(page.locator(".library-card")).toHaveCount(105);
            await page
                .getByRole("button", { name: "List layout", exact: true })
                .tap();
            await fits();
            await page.locator('.library-card[href$="/library/vector"]').tap();
            await page.getByRole("searchbox").fill("push_back");
            await expect(page.locator(".function-row")).toHaveCount(1);
            await page.locator(".function-row").tap();
            await page
                .getByRole("tab", { name: "Examples", exact: true })
                .tap();
            await expect(page.locator(".output-block")).toBeVisible();
            await fits();
            await page.screenshot({
                path: `.tmp/${testInfo.project.name}-${width}x${height}-examples.png`,
            });
            for (const theme of ["light", "dark", "colorful"]) {
                await page.locator(".theme-toggle").tap();
                await page.locator(`[data-theme-choice="${theme}"]`).tap();
                await expect(page.locator("html")).toHaveAttribute(
                    "data-theme",
                    theme,
                );
                await fits();
            }
            await page.reload();
            await expect(
                page.getByRole("tab", { name: "Examples", exact: true }),
            ).toHaveAttribute("aria-selected", "true");
            await expect(page.locator("html")).toHaveAttribute(
                "data-theme",
                "colorful",
            );
            await page.goto("/#/development/26");
            await page.locator(".back-link").tap();
            await expect(page.locator(".library-card").first()).toBeVisible();
            await page
                .getByRole("button", { name: "Scroll to bottom", exact: true })
                .tap();
            await expect
                .poll(() =>
                    page.evaluate(() =>
                        Math.abs(
                            document.documentElement.scrollHeight -
                                innerHeight -
                                scrollY,
                        ),
                    ),
                )
                .toBeLessThan(2);
            expect((await page.locator(".topbar").boundingBox()).y).toBe(0);
            await page
                .getByRole("button", { name: "Scroll to top", exact: true })
                .tap();
            await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
            await fits();
            await page.screenshot({
                path: `.tmp/${testInfo.project.name}-${width}x${height}-browse.png`,
            });
            expect(errors).toEqual([]);
        });
    });
}
