// src/RecommendGame.jsx
import React, { useState } from 'react';

// Categorie: UI in italiano, ricerca in inglese
const CATEGORIES = [
  { id: 'strategy', name: 'Strategia', icon: '♟️', term: 'strategy' },
  { id: 'card', name: 'Giochi di Carte', icon: '🃏', term: 'card' },
  { id: 'cooperative', name: 'Cooperativi', icon: '🤝', term: 'cooperative' },
  { id: 'party', name: 'Giochi di Società', icon: '🎉', term: 'party' },
  { id: 'family', name: 'Per Famiglie', icon: '👨‍👩‍👧‍👦', term: 'family' },
  { id: 'abstract', name: 'Astratti', icon: '🌀', term: 'abstract' },
  { id: 'deck', name: 'Deck Building', icon: '📦', term: 'deck building' },
  { id: 'fantasy', name: 'Fantasy', icon: '🧙', term: 'fantasy' },
  { id: 'scifi', name: 'Fantascienza', icon: '🚀', term: 'sci-fi' },
  { id: 'horror', name: 'Horror', icon: '👻', term: 'horror' },
];

const RecommendGame = () => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);

  const toggleTag = (id) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const removeTag = (id) => {
    setSelectedTags(prev => prev.filter(t => t !== id));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGames([]);

    // Costruisci la query di ricerca
    const terms = selectedTags.map(id => CATEGORIES.find(c => c.id === id)?.term).filter(Boolean).join(' ');
    const finalQuery = terms || 'boardgame'; // fallback

    try {
      // ✅ Questa è la riga corretta, con contesto
      const res = await fetch(`/api/search?q=${encodeURIComponent(finalQuery)}&limit=30`);
      
      if (!res.ok) {
        throw new Error('Risposta non valida dal server');
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Estrai 3 giochi casuali
      const allGames = data.games || [];
      const shuffled = [...allGames].sort(() => 0.5 - Math.random());
      setGames(shuffled.slice(0, 3));
    } catch (err) {
      console.error(err);
      setError('Impossibile recuperare i giochi. Riprova tra qualche secondo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizza i meeple per player count (1-10)
  const renderMeeple = (game) => {
    const allPlayers = Array.from({ length: 10 }, (_, i) => i + 1);
    return (
      <div style={{ display: 'flex', gap: '2px', marginTop: '6px' }}>
        {allPlayers.map(num => {
          let color = '#ffffff'; // bianco = non giocabile
          if (game.playersBest.includes(num)) {
            color = '#000000'; // nero = best
          } else if (game.playersRecommended.includes(num)) {
            color = '#aaaaaa'; // grigio = recommended
          }
          return (
            <div
              key={num}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: color,
                border: '1px solid #555'
              }}
              title={`${num} giocatori: ${game.playersBest.includes(num) ? 'Migliore' : game.playersRecommended.includes(num) ? 'Giocabile' : 'Non consigliato'}`}
            />
          );
        })}
      </div>
    );
  };

  const SkeletonCard = () => (
    <div style={{
      border: '1px solid #5A5245',
      borderRadius: '8px',
      padding: '12px',
      width: '180px',
      backgroundColor: '#000',
      color: '#fff',
      animation: 'pulse 1.5s infinite ease-in-out'
    }}>
      <div style={{ width: '100%', height: '120px', backgroundColor: '#222', borderRadius: '4px' }}></div>
      <div style={{ height: '16px', backgroundColor: '#222', marginTop: '8px' }}></div>
    </div>
  );

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🎲 Cosa giocare stasera?</h2>
      <p style={{ marginBottom: '20px', color: '#ccc' }}>Seleziona le categorie che ti interessano.</p>

      <form onSubmit={onSubmit}>
        {selectedTags.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <strong>Categorie selezionate:</strong>
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {selectedTags.map(id => {
                const cat = CATEGORIES.find(c => c.id === id);
                return (
                  <span
                    key={id}
                    style={{
                      backgroundColor: '#FCD34D',
                      color: '#000',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {cat?.name}
                    <button
                      type="button"
                      onClick={() => removeTag(id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        color: '#000',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <strong>Scegli una o più categorie:</strong>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '12px',
            marginTop: '12px'
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleTag(cat.id)}
                style={{
                  width: '100px',
                  height: '100px',
                  border: selectedTags.includes(cat.id)
                    ? '2px solid #FCD34D'
                    : '1px solid #5A5245',
                  borderRadius: '8px',
                  backgroundColor: selectedTags.includes(cat.id) ? '#FCD34D' : '#000',
                  color: selectedTags.includes(cat.id) ? '#000' : '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '8px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{cat.icon}</div>
                <div>{cat.name}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: isLoading ? '#5A5245' : '#FCD34D',
            color: isLoading ? '#aaa' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? 'Ricerca in corso...' : 'Trova 3 giochi'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '12px' }}>{error}</p>}

      {isLoading && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>🕒 Ricerca in corso...</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {games.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>🎉 Ecco i tuoi 3 giochi consigliati:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {games.map((game) => (
              <div
                key={game.id}
                style={{
                  border: '1px solid #5A5245',
                  borderRadius: '8px',
                  padding: '12px',
                  width: '180px',
                  backgroundColor: '#000',
                  color: '#fff'
                }}
              >
                {game.thumbnail ? (
                  <img
                    src={game.thumbnail}
                    alt={game.name}
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '120px',
                    backgroundColor: '#111',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#5A5245'
                  }}>
                    Immagine non disponibile
                  </div>
                )}
                <h4 style={{ fontSize: '1rem', margin: '8px 0', lineHeight: 1.3 }}>{game.name}</h4>
                <p style={{ fontSize: '0.8rem', color: '#ddd' }}>
                  {game.minPlayers}–{game.maxPlayers} giocatori • {game.playingTime} min
                </p>
                {renderMeeple(game)}
                <a
                  href={`https://boardgamegeek.com/boardgame/${game.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.8rem', color: '#FCD34D', display: 'block', marginTop: '6px' }}
                >
                  Scheda su BGG
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: '0.8rem', color: '#777', marginTop: '24px' }}>
        ℹ️ Dati da <a href="https://boardgamegeek.com" target="_blank" style={{ color: '#FCD34D' }}>BoardGameGeek</a>
      </p>

      <style>{`
        @keyframes pulse {
          0% { background-color: #222; }
          50% { background-color: #333; }
          100% { background-color: #222; }
        }
      `}</style>
    </div>
  );
};

export default RecommendGame;