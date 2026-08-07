export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body || {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return res.status(400).json({ error: "Invalid URL protocol" });
    }

    const fetchRes = await fetch(url, {
      headers: {
        "User-Agent": "SignalDesk/1.0 (Quant Data Fetcher)",
        Accept: "text/csv, text/plain, application/json, */*",
      },
    });

    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({
        error: `Failed to fetch external resource: ${fetchRes.statusText}`,
      });
    }

    const text = await fetchRes.text();
    return res.status(200).json({ content: text });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch remote URL" });
  }
}
