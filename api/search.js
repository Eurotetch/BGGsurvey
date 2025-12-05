// api/search.js
module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const q = url.searchParams.get('q') || 'strategy';
    const limit = Math.min(30, parseInt(url.searchParams.get('limit') || '10'));

    const apiUrl = `https://www.boardgameatlas.com/api/search?client_id=JLBr5npPhV&name=${encodeURIComponent(q)}&limit=${limit}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ games: data.games || [] }));
  } catch (err) {
    console.error('Error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch games' }));
  }
};