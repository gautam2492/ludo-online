import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  type: 'sparkle' | 'star' | 'circle';
  delay: string;
  duration: string;
  opacity: number;
}

export const AnimatedBackground: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate floating sparkles/dots
    const list: Particle[] = [];
    const types: ('sparkle' | 'star' | 'circle')[] = ['sparkle', 'star', 'circle'];
    for (let i = 0; i < 20; i++) {
      list.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 15 + 8,
        type: types[Math.floor(Math.random() * types.length)],
        delay: `${Math.random() * -15}s`,
        duration: `${Math.random() * 10 + 15}s`,
        opacity: Math.random() * 0.18 + 0.05
      });
    }
    setParticles(list);
  }, []);

  return (
    <div className="animated-bg-container">
      <style>{`
        .animated-bg-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
          background: radial-gradient(circle at 50% 50%, rgba(18, 28, 48, 0.98) 0%, rgba(6, 8, 14, 0.99) 100%);
        }

        .bg-light-ray {
          position: absolute;
          top: -20%;
          left: 30%;
          width: 40%;
          height: 140%;
          background: radial-gradient(ellipse at center, rgba(59, 130, 246, 0.04) 0%, transparent 70%);
          transform: rotate(-15deg);
          pointer-events: none;
          filter: blur(40px);
        }

        .floating-element {
          position: absolute;
          animation: backgroundFloat infinite linear;
          color: rgba(255, 255, 255, 0.4);
          transform-origin: center;
        }

        .bg-star {
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          background: #ffffff;
        }

        .bg-sparkle {
          clip-path: polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%);
          background: #f59e0b;
        }

        .bg-circle {
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%);
        }
      `}</style>
      
      {/* Soft moving light rays in background */}
      <div className="bg-light-ray" style={{ left: '10%' }} />
      <div className="bg-light-ray" style={{ left: '60%', transform: 'rotate(25deg)', background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.03) 0%, transparent 70%)' }} />

      {/* Floating particles */}
      {particles.map((p) => {
        let className = 'floating-element ';
        if (p.type === 'star') className += 'bg-star';
        else if (p.type === 'sparkle') className += 'bg-sparkle';
        else className += 'bg-circle';

        return (
          <div
            key={p.id}
            className={className}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        );
      })}
    </div>
  );
};
export default AnimatedBackground;
