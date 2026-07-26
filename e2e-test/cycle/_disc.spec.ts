import { test } from '@playwright/test';
import { keycloakLogin } from '../helpers/auth';
import { navigateTo, listInto } from '../helpers/tree';
import { createOffice, TEST_HOUSE_NAME, teardownHouse } from '../helpers/testHouse';

test('disc create', async ({ browser }) => {
  test.setTimeout(180_000);
  const page = await (await browser.newContext()).newPage();
  await keycloakLogin(page);
  const office = await createOffice(page, `disc-${String(Date.now())}`);
  await navigateTo(page, TEST_HOUSE_NAME, office.name);
  await listInto(page, 'All merchants');
  await page.locator('button:has-text("add")').first().click(); await page.waitForTimeout(500);
  await page.locator('[mat-menu-item]:has-text("New merchant")').first().click(); await page.waitForTimeout(1500);
  const dlg = page.locator('mat-dialog-container');
  // Profile tab fields
  const prof = dlg.locator('[role=tab]:has-text("Profile")');
  await prof.click(); await page.waitForTimeout(700);
  const pf = await dlg.locator('input, mat-select, select').evaluateAll((els:any[])=>els.map((e:any)=>({t:e.tagName,type:e.getAttribute('type'),df:e.getAttribute('data-field'),lbl:(e.closest('mat-form-field')?.querySelector('mat-label')?.textContent||'').trim()})));
  console.log('DISC profile fields:', JSON.stringify(pf));
  // fill first/last/email by data-field if present, else by order
  const tag = 'gui'+String(Date.now()%100000);
  const byDf = async (df:string,val:string)=>{ const el=dlg.locator(`[data-field="${df}"]`).first(); if(await el.count()>0){await el.fill(val); await el.press('Tab'); return true;} return false; };
  const okFirst = await byDf('firstName', tag);
  const okLast = await byDf('lastName', 'e2e');
  const okEmail = await byDf('email', tag+'@mir0n.pro');
  console.log('DISC filled by data-field:', JSON.stringify({okFirst,okLast,okEmail}));
  await dlg.locator('button:has-text("Create")').click(); await page.waitForTimeout(2500);
  for(let i=0;i<3;i++){ if(await page.locator('mat-dialog-container').count()>0){ await page.locator('mat-dialog-container').last().locator('button[matTooltip="Close"], button:has-text("Close")').first().click().catch(()=>{}); await page.waitForTimeout(400); if(await page.locator('button:has-text("No")').count()>0) await page.locator('button:has-text("No")').last().click().catch(()=>{}); } }
  await page.waitForTimeout(1000);
  const row = page.locator(`tr[mat-row]:has-text("${tag}")`).first();
  console.log('DISC created user row visible:', await row.isVisible().catch(()=>false), 'text:', (await row.textContent().catch(()=>''))?.trim().slice(0,40));
  // create account: go into the user, add
  if (await row.isVisible().catch(()=>false)) {
    await row.dblclick(); await page.waitForTimeout(1500);
    await page.locator('button:has-text("add")').first().click(); await page.waitForTimeout(600);
    console.log('DISC acct add-menu:', JSON.stringify((await page.locator('[mat-menu-item]').allTextContents()).map(s=>s.trim()).filter(Boolean)));
    await page.locator('[mat-menu-item]').first().click(); await page.waitForTimeout(1500);
    const adlg = page.locator('mat-dialog-container');
    console.log('DISC acct-dialog fields:', JSON.stringify(await adlg.locator('input, select, mat-select').evaluateAll((els:any[])=>els.map((e:any)=>({t:e.tagName,type:e.getAttribute('type'),df:e.getAttribute('data-field'),lbl:(e.closest('mat-form-field')?.querySelector('mat-label')?.textContent||'').trim()})))));
    console.log('DISC acct create-enabled@open:', await adlg.locator('button:has-text("Create")').isEnabled());
  }
  await teardownHouse(page, office.id).catch(()=>{});
  await page.context().close();
});
