// src/RecommendGame.jsx
import React, { useState } from 'react';

const RecommendGame = () => {
  const [playerCount, setPlayerCount] = useState(4);
  const [playTime, setPlayTime] = useState(60);
  const [gameName, setGameName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState([]);

  const searchGames = async () => {
    if (!gameName.trim() && playerCount === 4 && playTime === 60) {
      // Cerca tutti i giochi se nessun filtro specifico
      const url = `/api/search?q=&limit=30`;
      const res = await fetch(url);
      const data = await res.json();
      setGames(data.games || []);
      return;
    }

    // Costruisci la query
    let q = gameName.trim();
    if (q === '') q = 'boardgame'; // fallback

    const url = `/api/search?q=${encodeURIComponent(q)}&limit=30`;
    const res = await fetch(url);
    const data = await res.json();

    // Filtra client-side
    const filtered = (data.games || []).filter(game => {
      const matchesPlayers = game.minPlayers <= playerCount && game.maxPlayers >= playerCount;
      const matchesTime = game.playingTime <= playTime;
      return matchesPlayers && matchesTime;
    });

    setGames(filtered);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>🎲 What to play?</h2>
      
      {/* Input per nome gioco */}
      <div style={{ marginBottom: '16px' }}>
        <label>Filter games by name:</label>
        <input
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          placeholder="e.g., 'catan'"
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      {/* Slider per Player Count */}
      <div style={{ marginBottom: '16px' }}>
        <label>Player count: {playerCount} recommended</label>
        <input
          type="range"
          min="1"
          max="10"
          value={playerCount}
          onChange={(e) => setPlayerCount(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Slider per Play Time */}
      <div style={{ marginBottom: '16px' }}>
        <label>Play time: {playTime} minutes max</label>
        <input
          type="range"
          min="15"
          max="180"
          value={playTime}
          onChange={(e) => setPlayTime(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <button onClick={searchGames}>
        {isLoading ? 'Searching...' : 'Search Games'}
      </button>

      {/* Risultati */}
      {games.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          {games.map(game => (
            <div key={game.id} style={{ border: '1px solid #ccc', padding: '12px', marginBottom: '12px' }}>
              <h3>{game.name}</h3>
              <p>Min players: {game.minPlayers}, Max players: {game.maxPlayers}</p>
              <p>Playing time: {game.playingTime} min</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendGame;