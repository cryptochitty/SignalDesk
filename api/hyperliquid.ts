export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const payload = req.method === "POST" ? req.body : { type: "allMids" };

    const hlRes = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SignalDesk/1.0 (Hyperliquid Quant Fetcher)",
      },
      body: JSON.stringify(payload || { type: "allMids" }),
    });

    if (!hlRes.ok) {
      return res.status(hlRes.status).json({
        error: `Hyperliquid API error: ${hlRes.statusText}`,
      });
    }

    const data = await hlRes.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to communicate with Hyperliquid API" });
  }
}
