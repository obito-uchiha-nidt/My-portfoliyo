/* ══════════════════════════════════════════
   storage.js  (JSONBin.io — works across all devices)
   ══════════════════════════════════════════ */

const BIN_ID  = "69f0ba66aaba882197498855";
const API_KEY = "$2a$10$YYVsDUSQh1R2i6zXIPCD2OxUZvPrBlO2me6SlxdqdyE1lPQyENTO2";
const BASE    = "https://api.jsonbin.io/v3/b";

/**
 * Load portfolio data from JSONBin.
 * Falls back to localStorage if offline.
 */
export async function loadFromFirebase(defaultData) {
  try {
    const res = await fetch(`${BASE}/${BIN_ID}/latest`, {
      headers: {
        "X-Master-Key": API_KEY,
        "X-Bin-Meta":   "false"
      }
    });
    if (!res.ok) throw new Error(`JSONBin fetch failed: ${res.status}`);
    const data = await res.json();
    // Cache locally for offline fallback
    localStorage.setItem("portfolio_data", JSON.stringify(data));
    // If bin only has {"init":true}, return defaults
    if (data.init && Object.keys(data).length === 1) {
      await saveToFirebase(defaultData);
      return defaultData;
    }
    return data;
  } catch (err) {
    console.warn("JSONBin unavailable, using localStorage:", err.message);
    try {
      const local = localStorage.getItem("portfolio_data");
      return local ? JSON.parse(local) : defaultData;
    } catch {
      return defaultData;
    }
  }
}

/**
 * Save portfolio data to JSONBin + localStorage cache.
 */
export async function saveToFirebase(data) {
  try {
    const res = await fetch(`${BASE}/${BIN_ID}`, {
      method:  "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`JSONBin save failed: ${res.status}`);
    localStorage.setItem("portfolio_data", JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn("JSONBin save failed, saved to localStorage only:", err.message);
    localStorage.setItem("portfolio_data", JSON.stringify(data));
    return false;
  }
}

/**
 * No-op — images are stored inline. Kept so app.js/admin.js don't need changes.
 */
export function mergeWithLocalImages(data) {
  return data;
}
