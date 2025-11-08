import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // For debugging: always respond with a welcome message
  res.status(200).json({ message: "Welcome to the AI Remedies API endpoint!" });
}