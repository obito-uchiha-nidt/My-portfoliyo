/* ══════════════════════════════════════════════════════════════
   Netlify Function: get-data.js
   ────────────────────────────────────────────────────────────
   Reads portfolio-data.json from GitHub on the SERVER.
   Browser calls /.netlify/functions/get-data (your own domain).
   Works in Instagram, WhatsApp, every browser — no blocking.
   ══════════════════════════════════════════════════════════════ */

const GITHUB_USER = "obito-uchiha-nidt";
const GITHUB_REPO = "My-portfoliyo";
const GITHUB_FILE = "portfolio-data.json";

exports.handler = async function(event, context) {
  try {
    // Fetch raw file directly from GitHub (no auth needed for public repos)
    const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/${GITHUB_FILE}?t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) throw new Error("GitHub fetch failed: " + res.status);
    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      body: JSON.stringify(data)
    };
  } catch(err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};
