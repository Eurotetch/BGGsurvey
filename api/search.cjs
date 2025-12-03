// api/search.cjs
const { parseStringPromise } = require('xml2js');

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const q = url.searchParams.get('q') || 'boardgame';
    const limit = Math.min(30, parseInt(url.searchParams.get('limit') || '10'));

    console.log('🔍 BGG Proxy: searching for:', q);

    // === 1. Cerca ID su BGG ===
    let attempts = 0;
    let searchXml = '';
    while (attempts < 3) {
      const searchRes = await fetch(
        `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(q)}&type=boardgame`
      );
      console.log('BGG Search status:', searchRes.status);
      if (searchRes.status === 202) {
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
        continue;
      }
      searchXml = await searchRes.text();
      break;
    }

    if (!searchXml) {
      throw new Error('No XML from BGG');
    }

    console.log('✅ Got XML, parsing...');
    const searchJson = await parseStringPromise(searchXml);
    const items = searchJson?.items?.item || [];
    const ids = items.slice(0, limit).map(item => item.$.id).filter(Boolean);

    if (ids.length === 0) {
      return res.end(JSON.stringify({ games: [] }));
    }

    // === 2. Recupera dettagli ===
    const detailsRes = await fetch(
      `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}&stats=1`
    );
    const detailsXml = await detailsRes.text();
    const detailsJson = await parseStringPromise(detailsXml);
    const gameItems = detailsJson?.items?.item || [];

    const games = gameItems.map(item => {
      const nameObj = item.name?.find(n => n.$.primary === 'true') || item.name?.[0];
      const name = nameObj?.$.value || 'Untitled';
      const thumbnail = item.thumbnail?.[0] || '';
      const minPlayers = parseInt(item.minplayers?.[0]?.$.value || '1', 10);
      const maxPlayers = parseInt(item.maxplayers?.[0]?.$.value || '4', 10);
      const playingTime = parseInt(item.playingtime?.[0]?.$.value || '30', 10);

      return { id: item.$.id, name, thumbnail, minPlayers, maxPlayers, playingTime };
    }).filter(g => g.thumbnail);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ games }));
  } catch (err) {
    console.error('💥 BGG Proxy Error:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
};