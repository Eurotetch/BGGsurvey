// api/search.cjs
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const q = url.searchParams.get('q') || 'strategy';
    const limit = Math.min(30, parseInt(url.searchParams.get('limit') || '10'));

    const apiUrl = `https://www.boardgameatlas.com/api/search?client_id=JLBr5npPhV&name=${encodeURIComponent(q)}&limit=${limit}`;
    
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`BoardGameAtlas error: ${response.status}`);
    }

    const data = await response.json();

    const games = (data.games || []).map(game => ({
      id: game.id,
      name: game.name,
      thumbnail: game.thumbnail || '',
      description: game.descriptionPreview || 'Nessuna descrizione',
      minPlayers: game.minPlayers || 1,
      maxPlayers: game.maxPlayers || 4,
      playingTime: game.playtime || 30,
      playersBest: [],
      playersRecommended: [],
    }));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ games }));
  } catch (err) {
    console.error('💥 Proxy error:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Impossibile recuperare i giochi' }));
  }
};