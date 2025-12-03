// api/search.js
import { parseStringPromise } from 'xml2js';

export default async function handler(req, res) {
  const { q, limit = 20 } = req.query;

  try {
    // Cerca ID
    let attempts = 0;
    let xmlText = '';
    while (attempts < 3) {
      const searchRes = await fetch(
        `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(q)}&type=boardgame`
      );
      if (searchRes.status === 202) {
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
        continue;
      }
      xmlText = await searchRes.text();
      break;
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const items = xmlDoc.getElementsByTagName('item');
    const ids = Array.from(items).slice(0, parseInt(limit)).map(i => i.getAttribute('id')).filter(Boolean);

    if (ids.length === 0) {
      return res.status(200).json({ games: [] });
    }

    // Recupera dettagli
    const detailsRes = await fetch(
      `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}&stats=1`
    );
    const detailsXml = await detailsRes.text();
    const detailsDoc = parser.parseFromString(detailsXml, 'text/xml');
    const gameItems = detailsDoc.getElementsByTagName('item');

    const games = Array.from(gameItems).map(item => {
      const getName = () => {
        const names = item.getElementsByTagName('name');
        for (let i = 0; i < names.length; i++) {
          if (names[i].getAttribute('primary') === 'true') return names[i].textContent;
        }
        return names[0]?.textContent || 'Untitled';
      };

      return {
        id: item.getAttribute('id'),
        name: getName(),
        thumbnail: item.getElementsByTagName('thumbnail')[0]?.textContent || '',
        description: (item.getElementsByTagName('description')[0]?.textContent || '').substring(0, 200) + '...',
        minPlayers: parseInt(item.getElementsByTagName('minplayers')[0]?.textContent || '1', 10),
        maxPlayers: parseInt(item.getElementsByTagName('maxplayers')[0]?.textContent || '4', 10),
        playingTime: parseInt(item.getElementsByTagName('playingtime')[0]?.textContent || '30', 10),
      };
    }).filter(g => g.thumbnail);

    res.status(200).json({ games });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch from BGG' });
  }
}