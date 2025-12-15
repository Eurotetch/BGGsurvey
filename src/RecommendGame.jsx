// src/RecommendGame.jsx
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configura il client Supabase con i tuoi dati
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CATEGORIES = [
  { id: 'strategy', name: 'Strategy', icon: '♟️', term: 'strategy' },
  { id: 'card', name: 'Card Game', icon: '🃏', term: 'card' },
  { id: 'cooperative', name: 'Cooperative', icon: '🤝', term: 'cooperative' },
  { id: 'party', name: 'Party Game', icon: '🎉', term: 'party' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦', term: 'family' },
  { id: 'abstract', name: 'Abstract', icon: '🌀', term: 'abstract' },
  { id: 'deck', name: 'Deck Building', icon: '📦', term: 'deck' },
  { id: 'fantasy', name: 'Fantasy', icon: '🧙', term: 'fantasy' },
  { id: 'scifi', name: 'Sci-Fi', icon: '🚀', term: 'scifi' },
  { id: 'horror', name: 'Horror', icon: '👻', term: 'horror' },
];

const RecommendGame = () => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);

  // Verifica la connessione a Supabase all'avvio
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('id, name')
          .limit(1);
        
        if (error) throw error;
        setIsSupabaseReady(true);
      } catch (err) {
        console.error('Errore di connessione a Supabase:', err);
        setError('Impossibile connettersi al database. Riprova più tardi.');
      }
    };
    
    testConnection();
  }, []);

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
    if (selectedTags.length === 0) {
      setError('Seleziona almeno una categoria');
      return;
    }

    if (!isSupabaseReady) {
      setError('Il database non è pronto. Attendi qualche secondo e riprova.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGames([]);

    try {
      // Combina i termini di ricerca
      const terms = selectedTags.map(id => CATEGORIES.find(c => c.id === id)?.term).filter(Boolean).join(' ');
      const finalQuery = terms || 'strategy';

      // Cerca nel database Supabase invece di chiamare API esterne
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .or(`name.ilike.%${finalQuery}%,description.ilike.%${finalQuery}%`)
        .limit(100); // Recupera più risultati per avere varietà dopo il filtraggio

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Nessun gioco trovato per la tua ricerca');
      }

      // Filtra e mescola i risultati
      const validGames = data.filter(g => g.thumbnail);
      const shuffled = [...validGames].sort(() => 0.5 - Math.random());
      setGames(shuffled.slice(0, 3));
    } catch (err) {
      console.error('Errore database:', err);
      setError('Impossibile recuperare i giochi. Riprova tra qualche secondo.');
    } finally {
      setIsLoading(false);
    }
  };

  const SkeletonCard = () => (
    <div style={{
      border: '1px solid #5A5245',
      borderRadius: '8px',
      padding: '12px',
      width: '180px',
      backgroundColor: '#121212',
      color: '#FFFFFF',
      animation: 'pulse 1.5s infinite ease-in-out'
    }}>
      <div style={{ width: '100%', height: '120px', backgroundColor: '#222', borderRadius: '4px' }}></div>
      <div style={{ height: '16px', backgroundColor: '#222', marginTop: '8px' }}></div>
    </div>
  );

  const renderMeeple = (game) => {
    const allPlayers = Array.from({ length: 10 }, (_, i) => i + 1);
    return (
      <div style={{ display: 'flex', gap: '2px', marginTop: '6px' }}>
        {allPlayers.map(num => {
          let color = '#ffffff'; // bianco = non giocabile
          if (game.players_best && game.players_best.includes(num)) {
            color = '#000000'; // nero = best
          } else if (game.players_recommended && game.players_recommended.includes(num)) {
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
              title={`${num} giocatori: ${game.players_best?.includes(num) ? 'Migliore' : game.players_recommended?.includes(num) ? 'Giocabile' : 'Non consigliato'}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#121212',
      color: '#FFFFFF',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#FFFFFF' }}>🎲 Trova il tuo prossimo gioco da tavolo</h2>
      <p style={{ marginBottom: '20px', color: '#E0E0E0' }}>Seleziona le categorie che ti interessano.</p>

      {!isSupabaseReady && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#2a2a2a', 
          borderRadius: '8px', 
          marginBottom: '16px',
          color: '#ffd700'
        }}>
          ⏳ Connessione al database in corso...
        </div>
      )}

      <form onSubmit={onSubmit}>
        {selectedTags.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ color: '#FFFFFF' }}>Categorie selezionate:</strong>
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {selectedTags.map(id => {
                const cat = CATEGORIES.find(c => c.id === id);
                return (
                  <span
                    key={id}
                    style={{
                      backgroundColor: '#FCD34D',
                      color: '#000000',
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
                        color: '#000000',
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
          <strong style={{ color: '#FFFFFF' }}>Scegli una o più categorie:</strong>
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
                  backgroundColor: selectedTags.includes(cat.id) ? '#FCD34D' : '#121212',
                  color: selectedTags.includes(cat.id) ? '#000000' : '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '8px',
                  textAlign: 'center',
                  transition: 'background-color 0.2s ease'
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
          disabled={isLoading || !isSupabaseReady}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: isLoading || !isSupabaseReady ? '#5A5245' : '#FCD34D',
            color: isLoading || !isSupabaseReady ? '#AAAAAA' : '#000000',
            border: 'none',
            borderRadius: '4px',
            cursor: (isLoading || !isSupabaseReady) ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s ease'
          }}
        >
          {isLoading ? 'Ricerca in corso...' : !isSupabaseReady ? 'Attendere connessione...' : 'Trova 3 giochi'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '12px' }}>{error}</p>}

      {isLoading && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '16px', color: '#FFFFFF' }}>🕒 Ricerca in corso...</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {games.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '16px', color: '#FFFFFF' }}>🎉 Ecco i tuoi 3 giochi consigliati:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {games.map((game) => (
              <div
                key={game.id}
                style={{
                  border: '1px solid #5A5245',
                  borderRadius: '8px',
                  padding: '12px',
                  width: '180px',
                  backgroundColor: '#121212',
                  color: '#FFFFFF'
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
                    backgroundColor: '#222',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#5A5245'
                  }}>
                    Immagine non disponibile
                  </div>
                )}
                <h4 style={{ fontSize: '1rem', margin: '8px 0', lineHeight: 1.3, color: '#FFFFFF' }}>{game.name}</h4>
                <p style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>
                  {game.min_players}–{game.max_players} giocatori • {game.playing_time} min
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
        <br />
        <small style={{ color: '#5A5245' }}>Dati memorizzati localmente nel database Supabase</small>
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