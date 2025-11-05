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
    // Collect the request body chunks
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // Create a new request to the backend, forwarding the body
    const backendResponse = await fetch(`${BACKEND_URL}/api/upload-logo`, {
      method: 'POST',
      headers: {
        // Forward content-type which includes boundary for multipart/form-data
        ...(req.headers['content-type'] && { 'content-type': req.headers['content-type'] }),
      },
      body: body,
    });

    const data = await backendResponse.json();

    // Forward the response status and data
    return res.status(backendResponse.status).json(data);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return res.status(500).json({ error: 'Failed to upload to backend', details: error.message });
  }
}