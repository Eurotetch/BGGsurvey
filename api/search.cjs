// api/search.cjs
module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const term = url.searchParams.get('term') || 'strategy';
    const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '30'));

    const apiUrl = `https://api.recommend.games/v2/search?term=${encodeURIComponent(term)}&limit=${limit}`;
    
    const proxyRes = await fetch(apiUrl);
    const data = await proxyRes.json();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  } catch (err) {
    console.error('Recommend.Games API error:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to fetch from Recommend.Games' }));
  }
};