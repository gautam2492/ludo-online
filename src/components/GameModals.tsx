import React, { useState, useEffect } from 'react';
import { X, Trophy, ShoppingBag, Settings, Award, Volume2, ShieldAlert } from 'lucide-react';

interface GameModalsProps {
  activeTab: 'store' | 'achievements' | 'settings' | 'leaderboard' | null;
  onClose: () => void;
  coins: number;
  onUpdateCoins: (amount: number) => void;
  selectedDiceSkin: string;
  onSelectDiceSkin: (skin: string) => void;
  accessibilityMode: string;
  onSetAccessibilityMode: (mode: string) => void;
}

export const GameModals: React.FC<GameModalsProps> = ({
  activeTab,
  onClose,
  coins,
  onUpdateCoins,
  selectedDiceSkin,
  onSelectDiceSkin,
  accessibilityMode,
  onSetAccessibilityMode
}) => {
  // Store inventory state persisted locally
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['classic']);
  
  // Local achievements tracker
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);

  useEffect(() => {
    const savedSkins = localStorage.getItem('ludo_unlocked_skins');
    if (savedSkins) setUnlockedSkins(JSON.parse(savedSkins));

    const savedClaims = localStorage.getItem('ludo_claimed_achievements');
    if (savedClaims) setClaimedAchievements(JSON.parse(savedClaims));
  }, []);

  const saveSkins = (skins: string[]) => {
    setUnlockedSkins(skins);
    localStorage.setItem('ludo_unlocked_skins', JSON.stringify(skins));
  };

  const saveClaims = (claims: string[]) => {
    setClaimedAchievements(claims);
    localStorage.setItem('ludo_claimed_achievements', JSON.stringify(claims));
  };

  if (!activeTab) return null;

  const storeItems = [
    { id: 'classic', name: 'Classic Red/Gold', cost: 0, preview: '🎲' },
    { id: 'gold', name: 'Golden King', cost: 500, preview: '👑' },
    { id: 'neon', name: 'Neon Cyberpunk', cost: 800, preview: '⚡' },
    { id: 'rainbow', name: 'Rainbow Disco', cost: 1200, preview: '🌈' }
  ];

  const achievements = [
    { id: 'win_1', name: 'First Victory', desc: 'Win 1 match against bots or players', reward: 150 },
    { id: 'six_3', name: 'Lucky Roller', desc: 'Roll three 6s in a single session', reward: 100 },
    { id: 'kill_5', name: 'Pawn Crusher', desc: 'Capture 5 opponent pawns', reward: 200 },
    { id: 'home_run', name: 'Home Run Master', desc: 'Get all 4 pawns home in one game', reward: 300 }
  ];

  const leaderboard = [
    { rank: 1, name: 'Ludo_King👑', coins: 14200, avatar: '🧙‍♂️', level: 18 },
    { rank: 2, name: 'ShadowNinja🥷', coins: 9800, avatar: '🥷', level: 12 },
    { rank: 3, name: 'Cyborg_Ludo🤖', coins: 7500, avatar: '🤖', level: 9 },
    { rank: 4, name: 'GamerBoy👦', coins: 5200, avatar: '👦', level: 6 }
  ];

  const handleBuySkin = (itemId: string, cost: number) => {
    if (coins >= cost) {
      onUpdateCoins(-cost);
      const updated = [...unlockedSkins, itemId];
      saveSkins(updated);
    }
  };

  const handleClaimAchievement = (achId: string, reward: number) => {
    if (!claimedAchievements.includes(achId)) {
      onUpdateCoins(reward);
      const updated = [...claimedAchievements, achId];
      saveClaims(updated);
    }
  };

  return (
    <div className="modal-overlay">
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 16px;
        }

        .modal-container {
          width: 100%;
          max-width: 480px;
          background: linear-gradient(135deg, rgba(20, 26, 42, 0.95) 0%, rgba(10, 12, 22, 0.95) 100%);
          border: 2.5px solid #f59e0b;
          box-shadow: 0 15px 40px rgba(245, 158, 11, 0.2), inset 0 0 10px rgba(255,255,255,0.05);
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: popUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes popUp {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .modal-header {
          padding: 18px 24px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-title {
          font-family: 'Fredoka', sans-serif;
          font-size: 1.5rem;
          color: #f59e0b;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: #94a3b8;
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .modal-body {
          padding: 24px;
          max-height: 70dvh;
          overflow-y: auto;
        }

        .store-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .store-card {
          background: rgba(255, 255, 255, 0.03);
          border: 2px dashed rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
          transition: all 0.2s;
        }

        .store-card.owned {
          border-style: solid;
          border-color: rgba(245, 158, 11, 0.3);
          background: rgba(245, 158, 11, 0.03);
        }

        .store-card.selected {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.06);
        }

        .store-preview {
          font-size: 2.2rem;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
        }

        .achievement-row {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .leaderboard-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          margin-bottom: 10px;
          border: 1px solid transparent;
        }

        .leaderboard-row.rank-1 {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.08);
        }
      `}</style>

      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            {activeTab === 'store' && <><ShoppingBag /> Custom Store</>}
            {activeTab === 'achievements' && <><Award /> Achievements</>}
            {activeTab === 'settings' && <><Settings /> Game Settings</>}
            {activeTab === 'leaderboard' && <><Trophy /> Leaderboard</>}
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Store View */}
          {activeTab === 'store' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-400 text-sm">Earn coins by playing and unlock legendary dice skins!</span>
                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 font-bold text-sm">
                  🪙 {coins}
                </div>
              </div>
              
              <div className="store-grid">
                {storeItems.map((item) => {
                  const isOwned = unlockedSkins.includes(item.id);
                  const isSelected = selectedDiceSkin === item.id;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`store-card ${isOwned ? 'owned' : ''} ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="store-preview">{item.preview}</div>
                      <div className="font-bold text-sm text-slate-200">{item.name}</div>
                      
                      {isOwned ? (
                        <button
                          onClick={() => onSelectDiceSkin(item.id)}
                          className={`w-full py-1.5 rounded-lg text-xs font-bold font-fredoka uppercase tracking-wider ${
                            isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-350 hover:bg-slate-650'
                          }`}
                        >
                          {isSelected ? 'Equipped' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuySkin(item.id, item.cost)}
                          disabled={coins < item.cost}
                          className="w-full py-1.5 rounded-lg text-xs font-bold font-fredoka bg-amber-600 text-white hover:bg-amber-550 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🪙 {item.cost}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Achievements View */}
          {activeTab === 'achievements' && (
            <div>
              {achievements.map((ach) => {
                const isClaimed = claimedAchievements.includes(ach.id);
                return (
                  <div key={ach.id} className="achievement-row">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <Award size={16} className="text-amber-400" />
                        {ach.name}
                      </div>
                      <div className="text-slate-400 text-xs mt-1">{ach.desc}</div>
                    </div>
                    <div>
                      {isClaimed ? (
                        <span className="text-xs text-emerald-500 font-bold">Claimed ✓</span>
                      ) : (
                        <button
                          onClick={() => handleClaimAchievement(ach.id, ach.reward)}
                          className="px-3 py-1.5 bg-amber-500 text-slate-950 font-fredoka font-bold rounded-lg text-xs hover:bg-amber-400"
                        >
                          🪙 +{ach.reward}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaderboard View */}
          {activeTab === 'leaderboard' && (
            <div>
              {leaderboard.map((player) => (
                <div key={player.rank} className={`leaderboard-row rank-${player.rank}`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-fredoka text-lg ${
                      player.rank === 1 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      #{player.rank}
                    </span>
                    <span className="text-2xl">{player.avatar}</span>
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{player.name}</div>
                      <div className="text-slate-400 text-xs">Level {player.level}</div>
                    </div>
                  </div>
                  <div className="font-bold text-amber-400 text-sm">
                    🪙 {player.coins.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Settings View */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="font-fredoka text-slate-300 text-sm tracking-wider uppercase">Audio Preferences</div>
                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <span className="text-sm text-slate-350 flex items-center gap-2"><Volume2 size={16} /> Game Sound FX</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="font-fredoka text-slate-300 text-sm tracking-wider uppercase flex items-center gap-1.5">
                  <ShieldAlert size={16} className="text-amber-500" />
                  Accessibility & Color Contrast
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="text-xs text-slate-450">Select a specialized color filter mode for board cells and tokens:</div>
                  <select
                    value={accessibilityMode}
                    onChange={(e) => onSetAccessibilityMode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
                  >
                    <option value="standard">Standard Bright Theme</option>
                    <option value="high-contrast">High Contrast Mode</option>
                    <option value="deuteranopia">Red-Green Blind Filter</option>
                    <option value="tritanopia">Blue-Yellow Blind Filter</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default GameModals;
