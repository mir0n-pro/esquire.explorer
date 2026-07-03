import { Page } from '@playwright/test';

export async function navigateTo(page: Page, ...path: string[]): Promise<void> {
  const root = page.locator('mat-tree-node').first();
  await root.waitFor({ timeout: 10000 });
  await root.dblclick();
  for (let i = 0; i < path.length - 1; i++) {
    const node = page.locator(`mat-tree-node:has-text("${path[i]}")`).first();
    await node.waitFor({ timeout: 10000 });
    await node.dblclick();
  }
  const target = page.locator(`mat-tree-node:has-text("${path[path.length - 1]}")`).first();
  await target.waitFor({ timeout: 10000 });
  await target.click();
}

// Descend through the list pane by double-clicking a child row per name. The list shows
// only the active node's direct children, so this avoids the tree's cross-level text
// ambiguity (virtual folders like "All merchants" repeat at several depths).
export async function listInto(page: Page, ...names: string[]): Promise<void> {
  for (const name of names) {
    const row = page.locator(`tr[mat-row]:has-text("${name}")`).first();
    await row.waitFor({ timeout: 10000 });
    await row.dblclick();
  }
}

export async function expandPath(page: Page, ...path: string[]): Promise<void> {
  const root = page.locator('mat-tree-node').first();
  await root.waitFor({ timeout: 10000 });
  await root.dblclick();
  for (let i = 0; i < path.length; i++) {
    const node = page.locator(`mat-tree-node:has-text("${path[i]}")`).first();
    await node.waitFor({ timeout: 10000 });
    await node.dblclick();
    // wait for expansion to load children (next node in path, or settle for last)
    if (i + 1 < path.length) {
      await page.locator(`mat-tree-node:has-text("${path[i + 1]}")`).first().waitFor({ timeout: 10000 });
    } else {
      await page.waitForTimeout(6000);
    }
  }
}
