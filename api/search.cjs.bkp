// api/search.cjs
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const q = url.searchParams.get('q') || 'boardgame';
    const limit = Math.min(30, parseInt(url.searchParams.get('limit') || '10'));

    const headers = {
      'User-Agent': 'Mozilla/5.0 (RecommendGame; eurotetch@gmail.com)'
    };

    // === 1. Cerca ID su BGG ===
	// 👇 Usa User-Agent che ha fatto richiesta a Boardgamegeek di poter usare l'API. Vedi: https://boardgamegeek.com/wiki/page/BGG_XML_API2#
	// Stato della richiesta qui: https://boardgamegeek.com/applications
    let attempts = 0;
    let searchXml = '';
    while (attempts < 3) {
      const searchRes = await fetch(
        `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(q)}&type=boardgame`,
        { headers }
      );
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

    // === Parse XML con regex ===
    const parseXml = (xml) => {
      const result = { items: [] };
      const itemMatches = xml.match(/<item id="(\d+)"[^>]*>/g) || [];
      for (let match of itemMatches) {
        const id = match.match(/id="(\d+)"/)?.[1];
        if (id) result.items.push({ $: { id } });
      }
      return result;
    };

    const searchJson = parseXml(searchXml);
    const ids = searchJson.items.slice(0, limit).map(item => item.$.id).filter(Boolean);

    if (ids.length === 0) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ games: [] }));
    }

    // === 2. Recupera dettagli ===
    const detailsRes = await fetch(
      `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}&stats=1`,
      { headers }
    );
    const detailsXml = await detailsRes.text();

    const parseGameDetails = (xml) => {
      const games = [];
      const itemRegex = /<item id="(\d+)"[^>]*>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const id = match[1];
        const content = match[2];

        const getName = () => {
          const primary = content.match(/<name primary="true"[^>]*value="([^"]*)"/);
          if (primary) return primary[1];
          const first = content.match(/<name[^>]*value="([^"]*)"/);
          return first ? first[1] : 'Untitled';
        };

        const thumbnail = content.match(/<thumbnail>([^<]*)<\/thumbnail>/)?.[1] || '';
        const minplayers = content.match(/<minplayers[^>]*value="(\d+)"/)?.[1] || '1';
        const maxplayers = content.match(/<maxplayers[^>]*value="(\d+)"/)?.[1] || '4';
        const playingtime = content.match(/<playingtime[^>]*value="(\d+)"/)?.[1] || '30';

        games.push({
          id,
          name: getName(),
          thumbnail,
          minplayers: parseInt(minplayers, 10),
          maxplayers: parseInt(maxplayers, 10),
          playingtime: parseInt(playingtime, 10),
        });
      }
      return games;
    };

    let games = [];
    try {
      games = parseGameDetails(detailsXml).filter(g => g.thumbnail);
    } catch (parseErr) {
      console.error('Parse error:', parseErr.message);
      games = [];
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ games }));
  } catch (err) {
    console.error('💥 Error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
};