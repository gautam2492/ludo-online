import React, { useState } from 'react';
import type { Player, PlayerColor } from '../types';
import { Play, Copy, Check, User, Hash, Cpu, RefreshCw, Info } from 'lucide-react';

import { audio } from '../utils/audio';

interface LobbyProps {
  onHost: (name: string, color: PlayerColor) => void;
  onJoin: (name: string, color: PlayerColor, roomId: string) => void;
  onOffline: (name: string, color: PlayerColor) => void;
  players: Player[];
  roomId: string;
  isHost: boolean;
  onStartGame: () => void;
  onAddBot: () => void;
  onRemoveBot: (playerId: string) => void;
  onKickPlayer?: (playerId: string) => void;
  isConnecting: boolean;
  errorMsg: string;
}

export const Lobby: React.FC<LobbyProps> = ({
  onHost,
  onJoin,
  onOffline,
  players,
  roomId,
  isHost,
  onStartGame,
  onAddBot,
  onRemoveBot,
  onKickPlayer,
  isConnecting,
  errorMsg
}) => {
  const [name, setName] = useState(() => localStorage.getItem('ludo_player_name') || '');
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('red');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'selection' | 'hosting' | 'joining'>('selection');

  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
  
  const handleHostClick = () => {
    if (!name.trim()) return;
    localStorage.setItem('ludo_player_name', name.trim());
    audio.playMove();
    onHost(name.trim(), selectedColor);
    setMode('hosting');
  };

  const handleOfflineClick = () => {
    if (!name.trim()) return;
    localStorage.setItem('ludo_player_name', name.trim());
    audio.playMove();
    onOffline(name.trim(), selectedColor);
    setMode('hosting');
  };

  const handleJoinClick = () => {
    if (!name.trim() || !targetRoomId.trim()) return;
    localStorage.setItem('ludo_player_name', name.trim());
    audio.playMove();
    onJoin(name.trim(), selectedColor, targetRoomId.trim());
    setMode('joining');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine which colors are already taken in the lobby
  const takenColors = players.map((p) => p.color);

  return (
    <div className="lobby-container">
      <style>{`
        .lobby-container {
          max-width: 480px;
          width: 100%;
          margin: auto;
          padding: 24px;
          overflow-y: auto;
          max-height: calc(100vh - 72px);
          max-height: calc(100dvh - 72px);
          box-sizing: border-box;
        }

        .lobby-title {
          font-size: 2.5rem;
          font-weight: 900;
          text-align: center;
          margin-bottom: 24px;
          background: linear-gradient(135deg, var(--ludo-red), var(--ludo-blue));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
        }

        .lobby-card {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-label {
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--neutral-300);
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--neutral-500);
        }

        .lobby-card input.glass-input {
          width: 100%;
          padding-left: 44px;
        }

        .color-selector {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .color-option {
          height: 48px;
          border-radius: 12px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .color-option.red { background: var(--ludo-red-dark); }
        .color-option.green { background: var(--ludo-green-dark); }
        .color-option.yellow { background: var(--ludo-yellow-dark); }
        .color-option.blue { background: var(--ludo-blue-dark); }

        .color-option.selected {
          border-color: white;
          transform: scale(1.05);
          box-shadow: 0 0 15px currentColor;
        }

        .color-option.taken {
          opacity: 0.25;
          cursor: not-allowed;
        }

        .color-option-indicator {
          position: absolute;
          bottom: 4px;
          font-size: 0.6rem;
          font-weight: 800;
          color: white;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }

        .action-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 10px;
        }

        .room-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          font-family: monospace;
          font-size: 1.2rem;
          letter-spacing: 0.1em;
        }

        .lobby-players-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
          background: rgba(0,0,0,0.15);
          border-radius: 12px;
          padding: 12px;
          border: 1px solid var(--border-light);
        }

        .lobby-player-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.04);
        }

        .player-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .bot-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          background: hsla(217, 91%, 56%, 0.2);
          border: 1px solid hsla(217, 91%, 56%, 0.3);
          color: var(--ludo-blue);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .bot-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
        }

        .error-message {
          color: var(--ludo-red);
          font-size: 0.85rem;
          text-align: center;
          background: hsla(346, 85%, 57%, 0.1);
          border: 1px solid hsla(346, 85%, 57%, 0.2);
          padding: 8px;
          border-radius: 8px;
        }
      `}</style>

      <h1 className="lobby-title">LUDO ONLINE</h1>

      <div className="lobby-card glass-panel">
        {mode === 'selection' && (
          <>
            <div className="input-group">
              <label className="input-label">Your Nickname</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  maxLength={12}
                  className="glass-input"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Select Color</label>
              <div className="color-selector">
                {colors.map((color) => {
                  const isTaken = takenColors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      disabled={isTaken}
                      className={`color-option ${color} ${selectedColor === color ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                      onClick={() => setSelectedColor(color)}
                      style={{ color: `var(--ludo-${color})` }}
                    >
                      {selectedColor === color && <Check size={20} color="white" />}
                      {isTaken && <span className="color-option-indicator">TAKEN</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="action-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                className="glass-button glow-blue"
                disabled={!name.trim()}
                onClick={handleHostClick}
              >
                Host Room
              </button>
              <button
                type="button"
                className="glass-button"
                disabled={!name.trim()}
                onClick={() => setMode('joining')}
              >
                Join Friends
              </button>
            </div>
            
            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                className="glass-button glow-green"
                style={{ width: '100%', padding: '12px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={!name.trim()}
                onClick={handleOfflineClick}
              >
                <Cpu size={16} /> Play Offline (vs. Bots)
              </button>
            </div>
          </>
        )}

        {mode === 'joining' && !roomId && (
          <>
            <div className="input-group">
              <label className="input-label">Friend's Room ID</label>
              <div className="input-with-icon">
                <Hash size={18} className="input-icon" />
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g., LUDO-ABCD"
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            {errorMsg && <div className="error-message">{errorMsg}</div>}

            <div className="action-row">
              <button
                type="button"
                className="glass-button"
                onClick={() => {
                  setMode('selection');
                  setTargetRoomId('');
                }}
              >
                Back
              </button>
              <button
                type="button"
                className="glass-button glow-green"
                disabled={!targetRoomId.trim() || isConnecting}
                onClick={handleJoinClick}
              >
                {isConnecting ? <RefreshCw size={16} className="animate-spin" /> : 'Connect'}
              </button>
            </div>
          </>
        )}

        {(mode === 'hosting' || roomId) && (
          <>
            <div className="input-group">
              {roomId === 'OFFLINE' ? (
                <div className="room-display" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)', justifyContent: 'center', padding: '12px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#4ade80', fontWeight: 800 }}>🎮 OFFLINE SINGLE PLAYER</span>
                </div>
              ) : (
                <>
                  <label className="input-label">Share Room ID with Friends</label>
                  <div className="room-display">
                    {roomId ? (
                      <>
                        <span>{roomId}</span>
                        <button
                          type="button"
                          className="glass-button"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={handleCopyLink}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-500 animate-pulse">Generating Room ID...</span>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Lobby Players</label>
              <div className="lobby-players-list">
                {players.map((p) => (
                  <div key={p.id} className="lobby-player-row">
                    <div className="player-info" style={{ color: `var(--ludo-${p.color})` }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: `var(--ludo-${p.color})`
                        }}
                      />
                      <span>{p.name} {p.wins ? `(${p.wins} ${p.wins === 1 ? 'Win' : 'Wins'})` : ''}</span>
                      {p.isHost && <span className="text-xs text-slate-500 font-bold">(Host)</span>}
                      {p.isBot && <span className="bot-badge"><Cpu size={10} /> Bot</span>}
                    </div>
                    {isHost && !p.isHost && (
                      <button
                        type="button"
                        className="text-xs text-red-400 hover:text-red-300 bg-none border-none cursor-pointer"
                        onClick={() => p.isBot ? onRemoveBot(p.id) : onKickPlayer?.(p.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {isHost && players.length < 4 && (
              <div className="bot-controls">
                <button
                  type="button"
                  className="glass-button"
                  style={{ flex: 1, padding: '8px 16px', fontSize: '0.85rem' }}
                  onClick={onAddBot}
                >
                  <Cpu size={14} /> Add Bot Player
                </button>
              </div>
            )}

            {errorMsg && <div className="error-message">{errorMsg}</div>}

            <div className="action-row" style={{ gridTemplateColumns: '1fr' }}>
              {isHost ? (
                <button
                  type="button"
                  className="glass-button glow-green"
                  disabled={players.length < 2 || !roomId}
                  onClick={onStartGame}
                >
                  <Play size={18} /> Start Match
                </button>
              ) : (
                <div className="text-center text-sm text-slate-400 animate-pulse py-2">
                  Waiting for host to start the match...
                </div>
              )}
            </div>
            
            <div className="glass-panel" style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: '20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 700, color: 'var(--neutral-300)' }}>
                <Info size={14} className="text-blue-400" />
                <span>HOW TO PLAY ONLINE</span>
              </div>
              <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', margin: 0 }}>
                <li>Host a game and share the Room ID with friends to join.</li>
                <li>Roll a 6 to release a token from your yard onto the starting cell.</li>
                <li>Earn a bonus turn if you roll a 6, capture an opponent's token, or get a token home.</li>
                <li>If a player leaves, a Bot will instantly take over their turn so you can finish!</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default Lobby;
