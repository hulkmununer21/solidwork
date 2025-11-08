import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Missing query' });
  }

  // Hardcoded OpenAI API key for debugging ONLY (remove after testing!)
  const OPENAI_API_KEY = "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"; // <-- Replace with your actual key

  try {
    const prompt = `Suggest safe home remedies for: ${query}. 
    For each remedy, list: title, condition, ingredients, instructions, duration, safety, rating, and category. 
    Format as JSON array.`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();
    const aiText = data.choices?.[0]?.message?.content || "[]";
    let remedies = [];
    try {
      remedies = JSON.parse(aiText);
    } catch {
      remedies = [];
    }

    res.status(200).json({ remedies });
  } catch (error: any) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: error.message || "OpenAI error" });
  }
}