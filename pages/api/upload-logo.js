// Proxy endpoint for upload-logo to avoid CORS issues
export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we need raw body for FormData
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BACKEND_URL = process.env.BACKEND_URL || 'https://learnback-twta.onrender.com';

  try {
    // Create a new request to the backend, forwarding the body
    const backendResponse = await fetch(`${BACKEND_URL}/api/upload-logo`, {
      method: 'POST',
      headers: {
        // Forward content-type and other relevant headers
        ...(req.headers['content-type'] && { 'Content-Type': req.headers['content-type'] }),
      },
      body: req, // Forward the raw request body (FormData)
    });

    const data = await backendResponse.json();

    // Forward the response status and data
    return res.status(backendResponse.status).json(data);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return res.status(500).json({ error: 'Failed to upload to backend', details: error.message });
  }
}
