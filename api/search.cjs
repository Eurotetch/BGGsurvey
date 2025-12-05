// api/script.cjs
module.exports = async (req, res) => {
  try {
    // Costruisci URL della richiesta
    const url = new URL(req.url, `https://${req.headers.host}`);
    const q = url.searchParams.get('q') || 'strategy';
    const limit = Math.min(30, parseInt(url.searchParams.get('limit') || '10'));

    // Chiamata a BoardGameAtlas (API pubblica, stabile, JSON)
    const apiUrl = `https://www.boardgameatlas.com/api/search?client_id=JLBr5npPhV&name=${encodeURIComponent(q)}&limit=${limit}`;
    
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`BoardGameAtlas responded with status ${response.status}`);
    }

    const data = await response.json();

    // Mappa i dati per adattarli al tuo frontend
    const games = (data.games || []).map(game => ({
      id: game.id,
      name: game.name,
      thumbnail: game.thumbnail || '',
      description: game.descriptionPreview || 'Nessuna descrizione disponibile',
      minPlayers: game.minPlayers || 1,
      maxPlayers: game.maxPlayers || 4,
      playingTime: game.playtime || 30,
      playersBest: [],
      playersRecommended: [],
    }));

    // Risposta JSON valida
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ games }));
  } catch (err) {
    // Log errore nel terminale (visibile in `vercel dev`)
    console.error('💥 Errore nel proxy:', err.message);

    // Risposta di errore in JSON (non HTML!)
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Impossibile recuperare i giochi' }));
  }
};