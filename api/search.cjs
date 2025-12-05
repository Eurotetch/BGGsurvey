
	// 👇 Usa User-Agent che ha fatto richiesta a Boardgamegeek di poter usare l'API. Vedi: https://boardgamegeek.com/wiki/page/BGG_XML_API2#
	// Stato della richiesta qui: https://boardgamegeek.com/applications
// api/search.js
module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const q = url.searchParams.get('q') || 'boardgame';
    const limit = Math.min(30, parseInt(url.searchParams.get('limit') || '10'));

    const response = await fetch(
      `https://www.boardgameatlas.com/api/search?client_id=JLBr5npPhV&name=${encodeURIComponent(q)}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from BoardGameAtlas');
    }

    const data = await response.json();

    // Mappa i dati per adattarli al tuo frontend
    const games = data.games.map(game => ({
      id: game.id,
      name: game.name,
      thumbnail: game.thumbnail || '',
      description: game.descriptionPreview || 'No description',
      minPlayers: game.minPlayers || 1,
      maxPlayers: game.maxPlayers || 4,
      playingTime: game.playtime || 30,
      playersBest: [],
      playersRecommended: [],
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ games }));
  } catch (err) {
    console.error('💥 Error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch from BoardGameAtlas' }));
  }
};