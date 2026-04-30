/* ══════════════════════════════════════════
   storage.js  (replaces firebase.js)
   Pure localStorage — no backend, no config,
   works when you open the files directly in a browser.
   ══════════════════════════════════════════ */

const STORAGE_KEY = "portfolio_data";

/**
 * Load portfolio data from localStorage.
 * Falls back to defaultData if nothing is stored yet.
 */
export async function loadFromFirebase(defaultData) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    // First run — save the defaults so they persist
    await saveToFirebase(defaultData);
    return defaultData;
  } catch (err) {
    console.warn("localStorage read failed:", err.message);
    return defaultData;
  }
}

/**
 * Save portfolio data to localStorage.
 */
export async function saveToFirebase(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn("localStorage save failed:", err.message);
    return false;
  }
}

/**
 * No-op merge — images are already stored inline in localStorage.
 * Kept so admin.js / app.js don't need to change.
 */
export function mergeWithLocalImages(data) {
  return data;
}
