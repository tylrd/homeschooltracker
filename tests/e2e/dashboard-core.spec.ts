import { expect, test } from "@playwright/test";

test.describe("Dashboard core smoke", () => {
  test("desktop shows sidebar and hides bottom nav", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();
    await expect(page.getByTestId("bottom-nav")).toBeHidden();
  });

  test("mobile shows bottom nav and hides sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await expect(page.getByTestId("bottom-nav")).toBeVisible();
    await expect(page.getByTestId("desktop-sidebar")).toBeHidden();
  });

  test("can toggle lesson completion when lessons exist", async ({ page }) => {
    await page.goto("/");

    const checkboxes = page.locator("[role='checkbox']");
    const count = await checkboxes.count();
    if (count === 0) {
      test.skip(true, "No lessons available for completion toggle smoke test.");
    }

    const first = checkboxes.first();
    const before = await first.getAttribute("data-state");
    await first.click();
    await expect
      .poll(async () => first.getAttribute("data-state"))
      .not.toBe(before);
  });

  test("can open and save note drawer when note action exists", async ({
    page,
  }) => {
    await page.goto("/");

    const noteButtons = page.getByTitle("Add note");
    const count = await noteButtons.count();
    if (count === 0) {
      test.skip(true, "No note actions available for drawer smoke test.");
    }

    await noteButtons.first().click();
    await expect(page.getByText("Daily Note")).toBeVisible();

    await page.getByLabel("Daily plan").fill("Playwright smoke plan");
    await page.getByLabel("Note").fill("Playwright smoke note");
    await page.getByRole("button", { name: "Save Note" }).click();

    await expect(page.getByText("Daily Note")).toBeHidden();
  });

  test("can trigger bump action when lesson actions exist", async ({
    page,
  }) => {
    await page.goto("/");

    const actionButtons = page.getByTitle("Lesson actions");
    const count = await actionButtons.count();
    if (count === 0) {
      test.skip(true, "No lesson action menus available for bump smoke test.");
    }

    await actionButtons.first().click();
    const bumpButton = page.getByRole("button", { name: "Bump to next day" });
    const bumpCount = await bumpButton.count();
    if (bumpCount === 0) {
      test.skip(true, "No bump action available for the selected lesson.");
    }
    await bumpButton.click();

    await expect(
      page.getByRole("button", { name: "Bump to next day" }),
    ).toBeHidden();
  });
});
