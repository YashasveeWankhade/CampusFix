import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(200).json({ urgency: "Medium" });

  const description = req.body.description;
  if (!description || description.trim().length === 0) {
    return res.status(200).json({ urgency: "Medium" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [{
        parts: [{
          text: `Classify this complaint into urgency (ONE WORD: CRITICAL, HIGH, MEDIUM, LOW): "${description}"`
        }]
      }]
    });

    const text = result.response.text().trim().toUpperCase().split(/\s|[.,!?]/)[0];
    const valid = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

    const urgency = valid.includes(text) ? text.charAt(0) + text.slice(1).toLowerCase() : "Medium";
    return res.status(200).json({ urgency });

  } catch (error) {
    console.error("Gemini error:", error.message);
    return res.status(500).json({ urgency: "Medium" });
  }
}
