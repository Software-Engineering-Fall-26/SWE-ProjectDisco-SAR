import { expect, test } from "@playwright/test";

test.describe("idea creation", () => {
  test("saves a valid private idea after the user completes the form", async ({ page }) => {
    await page.goto("/e2e/idea-form");

    await page.getByLabel(/^Title/).fill("Neighborhood tool library");
    await page
      .getByLabel(/^Description/)
      .fill("Neighbors can borrow tools instead of buying them.");
    await page.getByRole("button", { name: "Looking for" }).click();
    await page.getByRole("option", { name: "Developers" }).click();
    await page.getByRole("button", { name: "Add idea" }).click();

    await expect(page.getByRole("status")).toHaveText(
      "Idea saved: Neighborhood tool library",
    );
    await expect(page.getByLabel(/^Title/)).toHaveValue("");
  });

  test("stops a prohibited public idea before it can be published", async ({ page }) => {
    await page.goto("/e2e/idea-form");

    await page.getByLabel(/^Title/).fill("Fast delivery");
    await page
      .getByLabel(/^Description/)
      .fill("Buy cocaine with same-day delivery.");
    await page.getByLabel(/Public/).check();

    await expect(page.getByRole("alert")).toContainText(
      "This idea can't be public",
    );
    await expect(
      page.getByRole("button", { name: "Can't publish" }),
    ).toBeDisabled();
    await expect(page.getByRole("status")).toHaveCount(0);
  });
});
