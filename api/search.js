// api/search.js
//uso: https://bg-gsurvey.vercel.app/api/search?q=strategy

const { parseStringPromise } = require('xml2js');

module.exports = async (req, res) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const q = url.searchParams.get('q') || 'boardgame';
  const limit = Math.min(30, parseInt(url.searchParams.get('limit') || '10'));

  try {
    // === 1. Cerca ID su BGG ===
    let attempts = 0;
    let searchXml = '';
    while (attempts < 3) {
      const searchRes = await fetch(
        `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(q)}&type=boardgame`
      );
      if (searchRes.status === 202) {
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
        continue;
      }
      searchXml = await searchRes.text();
      break;
    }

    if (!searchXml) throw new Error('No XML from BGG');

    const searchJson = await parseStringPromise(searchXml);
    const items = searchJson?.items?.item || [];
    const ids = items.slice(0, limit).map(item => item.$.id).filter(Boolean);

    if (ids.length === 0) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
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
      // Nome primario
      const nameObj = item.name?.find(n => n.$.primary === 'true') || item.name?.[0];
      const name = nameObj?.$.value || 'Untitled';

      // Descrizione
      const description = (item.description?.[0] || '').substring(0, 200) + '...';

      // Thumbnail
      const thumbnail = item.thumbnail?.[0] || '';

      // Player info
      const minPlayers = parseInt(item.minplayers?.[0]?.$.value || '1', 10);
      const maxPlayers = parseInt(item.maxplayers?.[0]?.$.value || '4', 10);
      const playingTime = parseInt(item.playingtime?.[0]?.$.value || '30', 10);

      // Player poll per meeple
      let playersBest = [];
      let playersRecommended = [];
      const playersPoll = item.poll?.find(p => p.$.name === 'suggested_numplayers');
      if (playersPoll?.results) {
        playersPoll.results.forEach(result => {
          const numStr = result.$.numplayers;
          if (!numStr || numStr.includes('+')) return;
          const num = parseInt(numStr, 10);
          if (isNaN(num) || num < 1 || num > 10) return;

          const bestVotes = parseInt(result.result?.find(r => r.$.value === 'Best')?.$.numvotes || '0', 10);
          const recVotes = parseInt(result.result?.find(r => r.$.value === 'Recommended')?.$.numvotes || '0', 10);

          if (bestVotes >= 1 && bestVotes >= recVotes) {
            playersBest.push(num);
          } else if (recVotes >= 1) {
            playersRecommended.push(num);
          }
        });
      }

      return {
        id: item.$.id,
        name,
        description,
        thumbnail,
        minPlayers,
        maxPlayers,
        playingTime,
        playersBest,
        playersRecommended,
      };
    }).filter(g => g.thumbnail);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ games }));
  } catch (err) {
    console.error('BGG Proxy Error:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to fetch from BGG' }));
  }
};