// Proxy endpoint for wallet-balance to avoid CORS issues
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BACKEND_URL = process.env.BACKEND_URL || 'https://learnback-twta.onrender.com';

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/wallet-balance`);
    const data = await backendResponse.json();

    // Forward the response status and data
    return res.status(backendResponse.status).json(data);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return res.status(500).json({ error: 'Failed to fetch wallet balance from backend', details: error.message });
  }
}
