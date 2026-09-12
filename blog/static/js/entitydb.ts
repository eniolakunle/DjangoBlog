// Simple EntityDB helpers (lazy dynamic import)
// Exports: initEntityDb, deriveTitleFromUrl, indexTitles, queryTitles

//@ts-expect-error
import { parseUrls } from "./functions.js?v=1.1.1";

let _db: any = null;
let _initInProgress = false;

export async function initEntityDb(model = "Xenova/multi-qa-MiniLM-L6-cos-v1") {
  if (_db) return _db;
  if (_initInProgress) {
    while (_initInProgress) {
      // wait for init to finish
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 50));
    }
    return _db;
  }

  _initInProgress = true;
  try {
    // dynamic import so we don't force consumers to bundle the package
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const envMod = await import("@xenova/transformers");
    const { env } = envMod;
    env.allowRemoteModels = true;
    env.allowLocalModels = false;
    
    // @ts-ignore
    const mod = await import("@babycommando/entity-db");
    console.log("EntityDB module loaded", mod);
    const { EntityDB } = mod;
    
    const db = new EntityDB({ vectorPath: "eniola_entity_db", model: model });
    _db = db;

    console.log("EntityDB initialized");
    return _db;
  } catch (e) {
    console.warn("EntityDB init failed", e);
    _db = null;
    return null;
  } finally {
    _initInProgress = false;
  }
}

export function deriveTitleFromUrl(url: string) {
  try {
    const tidy = url.replace(/\/?$/, "");
    const parts = tidy.split("/");
    const slug = parts[parts.length - 1] || tidy;
    return decodeURIComponent(slug.replace(/-/g, " "));
  } catch (e) {
    return url;
  }
}

export async function indexTitles(urls: string, opts: { force?: boolean } = {}) {
  const key = "entitydb_indexed_fingerprint";
  const parsedUrls = parseUrls(urls);
  const fingerprint = computeFingerprint(parsedUrls);

  if (!opts.force && alreadyIndexed(key, fingerprint)) {
    console.log("EntityDB: URLs already indexed (fingerprint match)");
    return;
  }

  const db = await getDbOrNull();
  if (!db) {
    console.warn("EntityDB not available; skipping indexing");
    return;
  }

  await clearDB(db);
  await insertAll(db, parsedUrls);

  markIndexed(key, fingerprint);
  console.log("EntityDB: indexing complete", parsedUrls.length);
}

// --- internal helpers ---
async function clearDB(db: any) {
  console.log("EntityDB: clearing database");

  const dbPromise = await db.dbPromise;
  const transaction = dbPromise.transaction("vectors", "readwrite");
  transaction.oncomplete = () => {
    console.log("Transaction completed.");
  };

  // create an object store on the transaction
  const objectStore = transaction.objectStore("vectors");

  // Make a request to clear all the data out of the object store
  const objectStoreRequest = objectStore.clear();
  objectStoreRequest.onsuccess = () => {
    console.log("Database cleared.");
  };
}

function computeFingerprint(list: string[]) {
  // base64 of the JSON representation; keep slice for compactness
  return btoa(JSON.stringify(list)).slice(0, 64);
}
function alreadyIndexed(key: string, fingerprint: string) {
  try {
    const seen = window.sessionStorage.getItem(key);
    return seen === fingerprint;
  } catch (e) {
    return false;
  }
}
function markIndexed(key: string, fingerprint: string) {
  try {
    window.sessionStorage.setItem(key, fingerprint);
  } catch (e) {
    /* ignore storage failures */
  }
}
async function getDbOrNull() {
  try {
    const db = await initEntityDb();
    return db;
  } catch (e) {
    return null;
  }
}
async function insertAll(db: any, list: string[]) {
  for (const u of list) {
    try {
      const title = deriveTitleFromUrl(u);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await db.insert({ text: title, metadata: { url: u, title } });
    } catch (e) {
      console.warn("EntityDB: failed to insert", u, e);
    }
  }
}

export async function queryTitles(q: string, topK = 5) : Promise<string[]>  {
  try {
    const db = await initEntityDb();
    if (!db) return [];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const res = await db.query(q);
    console.log(res);
    if (!res || !Array.isArray(res)) return [];
    const urls = res.slice(0, topK).map((r: any) => r?.metadata?.url || r?.text || "").filter(Boolean);
    console.log("EntityDB: query", q, "->", urls.length, "results");
    return urls;
  } catch (e) {
    console.warn("EntityDB: query failed", e);
    return [];
  }
}

export default null;
