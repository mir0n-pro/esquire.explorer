import { Page, APIRequestContext } from '@playwright/test';

// Self-contained e2e fixtures under the seeded Test House (org 14, ep_path '1.14.').
//
// Why Test House: the mutating specs (entity lifecycle, accounting) must create their
// OWN working data instead of mutating the shared seed tree (Company / Department /
// seed accounts 10011/10012). Test House is the framework's designated test root:
// PacManService.deleteAcct purges an account's transactions + clears fundedDate +
// forces status='C' for any account whose ep_path starts with '1.14.', so accounts
// created here can be torn down WITH history -- no desc marker, no explicit close.
//
// The builders talk to the backend through the authenticated /api BFF proxy
// (page.request carries the logged-in session cookie; the BFF injects the bearer and
// fabricates X-Request-ID when absent), the same clean end-to-end path spec 15 uses.

export const TEST_HOUSE_ID = '14';
export const TEST_HOUSE_NAME = 'Test House';

// Entity kind codes (services/common esq-entity-dictionaries.xml).
const ORG           = 20;   // office
const USR_MERCHANT  = 36;   // merchant user (carries merchant accounts)
const USR_CLIENT    = 34;   // client user   (carries client accounts)
const ACCT_MERCHANT = 52;   // merchant account
const ACCT_CLIENT   = 50;   // client account

export interface House {
  officeId: string;
  officeName: string;
  merchantId: string;
  merchantName: string;   // tree node text for the merchant user
  eurAcctNo: string;      // server-generated Account ID (EUR merchant account)
  clientId: string;
  clientName: string;     // tree node text for the client user
  usdAcctNo: string;      // server-generated Account ID (USD client account)
}

async function createEntity(req: APIRequestContext, kind: number, parentId: string,
                            body: Record<string, unknown>): Promise<any> {
  const res = await req.post(`/api/esq-cmd-new?kind=${kind}&parentId=${parentId}&cmd=new`, {
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
  if (res.status() !== 200) {
    throw new Error(`create kind=${kind} under ${parentId} failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

// enyMan derives usr_name from the primary person sub-entity ("First [Middle] Last")
// and loginId=email. A minimal person body is enough for a non-connected test user.
function userBody(kindLabel: string, tag: string): Record<string, unknown> {
  const email = `e2e-${kindLabel}-${tag}@mir0n.pro`;
  return {
    desc: `e2e ${kindLabel}`,
    registration: 'S',
    person: {
      firstName: `e2e-${kindLabel}-${tag}`,
      lastName: 'e2e',
      email,
      phone: '+14165551234',
    },
  };
}

// Build the full working subtree under Test House. Idempotent naming is caller's job
// (pass a unique tag); teardownHouse removes it. Returns the ids + display names the
// UI specs navigate by.
export async function setupHouse(page: Page, tag: string): Promise<House> {
  const req = page.request;

  const officeName = `e2e-house-${tag}`;
  const office = await createEntity(req, ORG, TEST_HOUSE_ID,
    { name: officeName, desc: 'e2e self-contained test office' });

  const merchant = await createEntity(req, USR_MERCHANT, String(office.id), userBody('mer', tag));
  const eurAcct  = await createEntity(req, ACCT_MERCHANT, String(merchant.id),
    { desc: 'e2e merchant account', ccy: 'EUR', status: 'O', negativeAllowed: 'N' });

  const client   = await createEntity(req, USR_CLIENT, String(office.id), userBody('cli', tag));
  const usdAcct  = await createEntity(req, ACCT_CLIENT, String(client.id),
    { desc: 'e2e client account', ccy: 'USD', status: 'O', negativeAllowed: 'N' });

  return {
    officeId:     String(office.id),
    officeName,
    merchantId:   String(merchant.id),
    merchantName: String(merchant.name),
    eurAcctNo:    String(eurAcct.name),
    clientId:     String(client.id),
    clientName:   String(client.name),
    usdAcctNo:    String(usdAcct.name),
  };
}

// Create a bare office under Test House (for the entity-lifecycle spec, which needs
// offices to create/move/delete within but no accounts). Returns {id, name}.
export async function createOffice(page: Page, name: string,
                                   parentId: string = TEST_HOUSE_ID): Promise<{ id: string; name: string }> {
  const office = await createEntity(page.request, ORG, parentId,
    { name, desc: 'e2e lifecycle office' });
  return { id: String(office.id), name: String(office.name) };
}

// Best-effort teardown of an office and everything beneath it: fetch the FK-based
// subtree (leaves first) and delete bottom-up. Accounts under Test House self-purge
// their history on delete (PacManService path gate), so no close/withdraw is needed.
// Never throws -- a stuck node must not fail the suite's afterAll.
export async function teardownHouse(page: Page, officeId: string): Promise<void> {
  const req = page.request;
  try {
    const res = await req.get(`/api/esq-cmd-tree?kind=${ORG}&id=${officeId}`);
    if (res.status() !== 200) {
      return;
    }
    const nodes: Array<{ id: string | number; kind: number }> = await res.json();
    for (const n of nodes) {
      await req.post(`/api/esq-cmd-del?kind=${n.kind}&id=${n.id}&cmd=delete`).catch(() => undefined);
    }
  } catch {
    // best-effort: swallow teardown failures
  }
}
