export default async function handler(req, res) {
  // CORS headers - allow any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, token } = req.body;

  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (!token) return res.status(400).json({ error: 'Missing HF token' });

  try {
    const hfRes = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      return res.status(hfRes.status).json({ 
        error: hfRes.status === 401 ? 'Invalid HF token' :
               hfRes.status === 503 ? 'Model loading, wait 20s and retry' :
               `HF API error: ${errText.slice(0, 100)}`
      });
    }

    // Stream the image bytes back
    const imageBuffer = await hfRes.arrayBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(Buffer.from(imageBuffer));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
