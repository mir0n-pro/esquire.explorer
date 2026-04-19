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
