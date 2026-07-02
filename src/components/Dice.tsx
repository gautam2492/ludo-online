import React, { useEffect, useState } from 'react';
import { audio } from '../utils/audio';
import type { PlayerColor } from '../types';

interface DiceProps {
  value: number;
  isRolling: boolean;
  onClick: () => void;
  disabled: boolean;
  playerColor: PlayerColor | null;
  selectedDiceSkin?: string;
}

export const Dice: React.FC<DiceProps> = ({ 
  value, 
  isRolling, 
  onClick, 
  disabled, 
  playerColor,
  selectedDiceSkin = 'classic'
}) => {
  const [rotationClass, setRotationClass] = useState('');

  // Map dice value to rotation angles to bring that face to the front
  const getRotationStyle = (val: number) => {
    switch (val) {
      case 1: return 'rotateX(0deg) rotateY(0deg)';
      case 2: return 'rotateX(0deg) rotateY(-90deg)';
      case 3: return 'rotateX(-90deg) rotateY(0deg)';
      case 4: return 'rotateX(90deg) rotateY(0deg)';
      case 5: return 'rotateX(0deg) rotateY(90deg)';
      case 6: return 'rotateX(0deg) rotateY(180deg)';
      default: return 'rotateX(0deg) rotateY(0deg)';
    }
  };

  useEffect(() => {
    if (isRolling) {
      setRotationClass('animate-rolling');
      audio.playRoll();
    } else {
      setRotationClass('');
    }
  }, [isRolling]);

  const colorMap: Record<string, string> = {
    red: 'var(--ludo-red)',
    green: 'var(--ludo-green)',
    yellow: 'var(--ludo-yellow)',
    blue: 'var(--ludo-blue)',
    orange: 'var(--ludo-orange)',
    purple: 'var(--ludo-purple)'
  };

  const activeColor = playerColor ? colorMap[playerColor] : 'var(--neutral-500)';

  return (
    <div className="dice-wrapper">
      <style>{`
        .dice-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          perspective: 600px;
          user-select: none;
        }

        .dice-scene {
          width: 60px;
          height: 60px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .dice-scene:hover:not(.disabled) {
          transform: scale(1.08);
        }

        .dice-scene.disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .dice-cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .animate-rolling {
          animation: dice-cube-roll 0.8s infinite linear;
        }

        @keyframes dice-cube-roll {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
        }

        .dice-face {
          position: absolute;
          width: 60px;
          height: 60px;
          background: var(--dice-bg-color, rgba(20, 26, 42, 0.85));
          backdrop-filter: blur(8px);
          border: 2px solid var(--dice-border-color, var(--neutral-500));
          border-radius: 12px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          padding: 8px;
          box-sizing: border-box;
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5), 0 0 15px var(--dice-glow-color, rgba(255, 255, 255, 0.05));
          backface-visibility: hidden;
        }

        /* Face orientation in 3D */
        .face-1 { transform: rotateY(0deg) translateZ(30px); }
        .face-2 { transform: rotateY(90deg) translateZ(30px); }
        .face-3 { transform: rotateX(90deg) translateZ(30px); }
        .face-4 { transform: rotateX(-90deg) translateZ(30px); }
        .face-5 { transform: rotateY(-90deg) translateZ(30px); }
        .face-6 { transform: rotateY(180deg) translateZ(30px); }

        /* Dots styling */
        .dice-dot {
          background: var(--dice-dot-color, white);
          border-radius: 50%;
          width: 8px;
          height: 8px;
          margin: auto;
          box-shadow: 0 0 5px var(--dice-dot-color, white);
        }

        /* Grid placement for dots */
        .dot-c { grid-area: 2 / 2; }
        .dot-tl { grid-area: 1 / 1; }
        .dot-tr { grid-area: 1 / 3; }
        .dot-ml { grid-area: 2 / 1; }
        .dot-mr { grid-area: 2 / 3; }
        .dot-bl { grid-area: 3 / 1; }
        .dot-br { grid-area: 3 / 3; }
      `}</style>

      {(() => {
        let diceBg = 'rgba(20, 26, 42, 0.85)';
        let diceBorder = activeColor;
        let diceDotColor = activeColor;
        let diceGlow = playerColor ? `var(--ludo-${playerColor}-glow)` : 'rgba(255,255,255,0.05)';

        if (selectedDiceSkin === 'gold') {
          diceBg = 'linear-gradient(135deg, #f59e0b 0%, #78350f 100%)';
          diceBorder = '#fbbf24';
          diceDotColor = '#ffffff';
          diceGlow = 'rgba(245, 158, 11, 0.5)';
        } else if (selectedDiceSkin === 'neon') {
          diceBg = 'linear-gradient(135deg, #0f172a 0%, #020617 100%)';
          diceBorder = '#06b6d4';
          diceDotColor = '#06b6d4';
          diceGlow = 'rgba(6, 182, 212, 0.6)';
        } else if (selectedDiceSkin === 'rainbow') {
          diceBg = 'linear-gradient(135deg, #ec4899 0%, #3b82f6 50%, #10b981 100%)';
          diceBorder = '#ffffff';
          diceDotColor = '#ffffff';
          diceGlow = 'rgba(236, 72, 153, 0.5)';
        }

        return (
          <div 
            className={`dice-scene ${disabled ? 'disabled' : ''}`} 
            onClick={() => !disabled && !isRolling && onClick()}
            style={{
              ['--dice-bg-color' as any]: diceBg,
              ['--dice-border-color' as any]: diceBorder,
              ['--dice-glow-color' as any]: diceGlow,
              ['--dice-dot-color' as any]: diceDotColor
            }}
          >
        <div 
          className={`dice-cube ${rotationClass}`}
          style={{ transform: isRolling ? undefined : getRotationStyle(value) }}
        >
          {/* Face 1 */}
          <div className="dice-face face-1">
            <div className="dice-dot dot-c" />
          </div>
          {/* Face 2 */}
          <div className="dice-face face-2">
            <div className="dice-dot dot-tl" />
            <div className="dice-dot dot-br" />
          </div>
          {/* Face 3 */}
          <div className="dice-face face-3">
            <div className="dice-dot dot-tl" />
            <div className="dice-dot dot-c" />
            <div className="dice-dot dot-br" />
          </div>
          {/* Face 4 */}
          <div className="dice-face face-4">
            <div className="dice-dot dot-tl" />
            <div className="dice-dot dot-tr" />
            <div className="dice-dot dot-bl" />
            <div className="dice-dot dot-br" />
          </div>
          {/* Face 5 */}
          <div className="dice-face face-5">
            <div className="dice-dot dot-tl" />
            <div className="dice-dot dot-tr" />
            <div className="dice-dot dot-c" />
            <div className="dice-dot dot-bl" />
            <div className="dice-dot dot-br" />
          </div>
          {/* Face 6 */}
          <div className="dice-face face-6">
            <div className="dice-dot dot-tl" />
            <div className="dice-dot dot-tr" />
            <div className="dice-dot dot-ml" />
            <div className="dice-dot dot-mr" />
            <div className="dice-dot dot-bl" />
            <div className="dice-dot dot-br" />
          </div>
        </div>
      </div>
    );
  })()}
    </div>
  );
};
export default Dice;
