// /api/gemini.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const { description } = req.body;

  if (!description || !apiKey) {
    return res.status(200).json({ urgency: "MEDIUM" });
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `You are an AI assistant designed to classify the urgency of campus complaints.
Strictly follow these rules:
1. Output ONLY ONE WORD.
2. The word MUST be one of: CRITICAL, HIGH, MEDIUM, LOW.
3. Output the word in UPPERCASE.

Complaint: "${description}"

Output:`
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }
    );

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = text.trim().toUpperCase().split(/\s|[.,!?]/)[0];
    const valid = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(cleaned) ? cleaned : "MEDIUM";

    res.status(200).json({ urgency: valid });
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ urgency: "MEDIUM" });
  }
}
