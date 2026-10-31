/**
 * CineScope Secure OMDb API Proxy (Vercel Serverless Function)
 * Route: /api/omdb
 *
 * Keeps OMDB_API_KEY strictly server-side.
 * Never exposes credentials to client-side bundles.
 */

// In-memory function instance cache
const cache = new Map();

export default async function handler(req, res) {
  // Allow GET and OPTIONS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ Response: 'False', Error: 'Method Not Allowed' });
  }

  try {
    // Extract query parameter
    let imdbId = req.query?.imdbId;
    if (!imdbId && req.url) {
      const url = new URL(req.url, 'http://localhost');
      imdbId = url.searchParams.get('imdbId');
    }

    if (!imdbId || typeof imdbId !== 'string' || !imdbId.trim().startsWith('tt')) {
      return res.status(400).json({ 
        Response: 'False', 
        Error: 'Valid imdbId query parameter (e.g. tt0816692) is required.' 
      });
    }

    const cleanId = imdbId.trim();

    // Check memory cache
    if (cache.has(cleanId)) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
      return res.status(200).json(cache.get(cleanId));
    }

    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey || apiKey === 'your_omdb_api_key_here') {
      return res.status(500).json({ 
        Response: 'False', 
        Error: 'OMDB_API_KEY is not configured in server environment variables.' 
      });
    }

    const omdbUrl = `https://www.omdbapi.com/?i=${encodeURIComponent(cleanId)}&apikey=${apiKey.trim()}`;
    const omdbRes = await fetch(omdbUrl);

    if (!omdbRes.ok) {
      return res.status(502).json({ 
        Response: 'False', 
        Error: `OMDb upstream service returned status ${omdbRes.status}` 
      });
    }

    const data = await omdbRes.json();
    cache.set(cleanId, data);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error handling OMDb request:', err);
    return res.status(500).json({ 
      Response: 'False', 
      Error: 'Internal server error while retrieving IMDb details.' 
    });
  }
}

