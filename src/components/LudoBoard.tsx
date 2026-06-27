import React, { useState } from 'react';
import type { Token, PlayerColor } from '../types';
import {
  getTokenCoordinates,
  SAFE_INDICES,
  TRACK_COORDS,
  HOME_PATH_COORDS,
  isValidMove,
  getNextPosition
} from '../utils/ludoLogic';


interface LudoBoardProps {
  tokens: Token[];
  activeColor: PlayerColor | null;
  diceValue: number;
  hasRolled: boolean;
  onTokenClick: (tokenId: number) => void;
  playersCount?: number;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({
  tokens,
  activeColor,
  diceValue,
  hasRolled,
  onTokenClick,
  playersCount
}) => {
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);

  const isSixPlayer = playersCount ? playersCount > 4 : false;

  const rotatePoint = (x: number, y: number, cx: number, cy: number, angle: number) => {
    const rad = (angle * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
    return { x: rx + cx, y: ry + cy };
  };

  const getSixPlayerCoordinates = (token: Token): { x: number; y: number } => {
    const { color, position, id } = token;
    const list: PlayerColor[] = ['red', 'green', 'yellow', 'blue', 'orange', 'purple'];
    const colorIdx = list.indexOf(color);
    const angle = colorIdx * 60;

    const cx = 15;
    const cy = 15;

    if (position === 0) {
      let rx = 19.75;
      let ry = 9.5;
      if (id === 0) { rx = 19.1; ry = 8.8; }
      else if (id === 1) { rx = 20.4; ry = 8.8; }
      else if (id === 2) { rx = 19.1; ry = 10.2; }
      else { rx = 20.4; ry = 10.2; }
      return rotatePoint(rx, ry, cx, cy, angle);
    }

    if (position === 83) {
      const r = 0.7;
      const a = colorIdx * 60 + id * 15 - 22.5;
      const rad = (a * Math.PI) / 180;
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
      };
    }

    if (position >= 78 && position <= 82) {
      const homeIdx = position - 78;
      const rx = 15;
      const ry = 13.2 - homeIdx * 1.0;
      return rotatePoint(rx, ry, cx, cy, angle);
    }

    const baseCells: { x: number; y: number }[] = [
      { x: 14, y: 13.2 },
      { x: 14, y: 12.2 },
      { x: 14, y: 11.2 },
      { x: 14, y: 10.2 },
      { x: 14, y: 9.2 },
      { x: 14, y: 8.2 },
      { x: 15, y: 8.2 },
      { x: 16, y: 8.2 },
      { x: 16, y: 9.2 },
      { x: 16, y: 10.2 },
      { x: 16, y: 11.2 },
      { x: 16, y: 12.2 },
      { x: 16, y: 13.2 }
    ];

    const startIdx = colorIdx * 13;
    const trackIdx = (startIdx + position - 1) % 78;
    const armIdx = Math.floor(trackIdx / 13);
    const cellIdx = trackIdx % 13;
    const cell = baseCells[cellIdx];

    return rotatePoint(cell.x, cell.y, cx, cy, armIdx * 60);
  };

  const getCoordinates = (token: Token) => {
    return isSixPlayer ? getSixPlayerCoordinates(token) : getTokenCoordinates(token);
  };

  // Group tokens by coordinates to handle stacking/offsets
  const getStackedTokenOffsets = () => {
    const coordsMap = new Map<string, Token[]>();
    
    tokens.forEach((token) => {
      const coord = getCoordinates(token);
      const key = `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`;
      if (!coordsMap.has(key)) {
        coordsMap.set(key, []);
      }
      coordsMap.get(key)!.push(token);
    });

    const offsetsMap = new Map<string, { dx: number; dy: number }>();

    coordsMap.forEach((tokensOnCell, _key) => {
      const count = tokensOnCell.length;
      tokensOnCell.forEach((token, idx) => {
        const tokenKey = `${token.color}_${token.id}`;
        if (count === 1) {
          offsetsMap.set(tokenKey, { dx: 0, dy: 0 });
        } else if (count === 2) {
          const dx = idx === 0 ? -0.15 : 0.15;
          const dy = idx === 0 ? -0.15 : 0.15;
          offsetsMap.set(tokenKey, { dx, dy });
        } else if (count === 3) {
          const angle = (idx * 2 * Math.PI) / 3 - Math.PI / 2;
          offsetsMap.set(tokenKey, {
            dx: Math.cos(angle) * 0.18,
            dy: Math.sin(angle) * 0.18
          });
        } else {
          // 4 tokens
          const dx = idx < 2 ? -0.18 : 0.18;
          const dy = idx % 2 === 0 ? -0.18 : 0.18;
          offsetsMap.set(tokenKey, { dx, dy });
        }
      });
    });

    return offsetsMap;
  };

  const offsets = getStackedTokenOffsets();

  // Helper to draw cells of a grid coordinate
  const renderCell = (col: number, row: number, fill: string, border: string = 'rgba(255,255,255,0.06)') => {
    return (
      <rect
        key={`cell-${col}-${row}`}
        x={col}
        y={row}
        width={1}
        height={1}
        fill={fill}
        stroke={border}
        strokeWidth={0.03}
      />
    );
  };

  // Build cells for the board
  const cells: React.ReactNode[] = [];

  // General track cells (52 cells)
  TRACK_COORDS.forEach(([x, y]) => {
    let fill = 'rgba(20, 26, 42, 0.4)';
    let border = 'rgba(255,255,255,0.08)';

    // Highlight start cells
    if (x === 1 && y === 6) { fill = 'var(--ludo-red-dark)'; border = 'var(--ludo-red)'; }
    else if (x === 8 && y === 1) { fill = 'var(--ludo-green-dark)'; border = 'var(--ludo-green)'; }
    else if (x === 13 && y === 8) { fill = 'var(--ludo-yellow-dark)'; border = 'var(--ludo-yellow)'; }
    else if (x === 6 && y === 13) { fill = 'var(--ludo-blue-dark)'; border = 'var(--ludo-blue)'; }
    
    // Highlight home paths slightly
    cells.push(renderCell(x, y, fill, border));
  });

  // Home Path cells (5 cells per color)
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
  colors.forEach((color) => {
    const colorVar = `var(--ludo-${color})`;
    const path = HOME_PATH_COORDS[color];
    path.forEach(([x, y]) => {
      cells.push(renderCell(x, y, `var(--ludo-${color}-dark)`, colorVar));
    });
  });

  // Safe zones (Stars)
  const renderStar = (x: number, y: number, color: string = '#ffffff') => {
    const cx = x + 0.5;
    const cy = y + 0.5;
    // Standard star path in 1x1 cell
    return (
      <polygon
        key={`star-${x}-${y}`}
        points={`
          ${cx},${cy - 0.28}
          ${cx + 0.08},${cy - 0.09}
          ${cx + 0.28},${cy - 0.09}
          ${cx + 0.12},${cy + 0.04}
          ${cx + 0.18},${cy + 0.25}
          ${cx},${cy + 0.12}
          ${cx - 0.18},${cy + 0.25}
          ${cx - 0.12},${cy + 0.04}
          ${cx - 0.28},${cy - 0.09}
          ${cx - 0.08},${cy - 0.09}
        `}
        fill={color}
        opacity={0.7}
      />
    );
  };

  const stars: React.ReactNode[] = [];
  // Render safe stars
  SAFE_INDICES.forEach((idx) => {
    const [x, y] = TRACK_COORDS[idx];
    let color = '#94a3b8'; // default slate-400
    if (idx === 1) color = 'var(--ludo-red)';
    else if (idx === 14) color = 'var(--ludo-green)';
    else if (idx === 27) color = 'var(--ludo-yellow)';
    else if (idx === 40) color = 'var(--ludo-blue)';
    stars.push(renderStar(x, y, color));
  });

  // Extra standard stars at index 8, 21, 34, 47
  stars.push(renderStar(6, 2, '#94a3b8'));
  stars.push(renderStar(11, 6, '#94a3b8'));
  stars.push(renderStar(8, 12, '#94a3b8'));
  stars.push(renderStar(3, 8, '#94a3b8'));

  // Color mappings
  const colorMap: Record<PlayerColor, string> = {
    red: 'var(--ludo-red)',
    green: 'var(--ludo-green)',
    yellow: 'var(--ludo-yellow)',
    blue: 'var(--ludo-blue)',
    orange: 'var(--ludo-orange)',
    purple: 'var(--ludo-purple)'
  };


  return (
    <div className="board-container">
      <style>{`
        .board-container {
          width: min(100%, calc(100vh - 310px));
          width: min(100%, calc(100dvh - 310px));
          max-width: 520px;
          margin: 0 auto;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        @media (min-width: 1024px) {
          .board-container {
            width: min(100%, calc(100vh - 340px));
            width: min(100%, calc(100dvh - 340px));
            max-width: 800px;
          }
        }

        .ludo-board-svg {
          width: 100%;
          height: 100%;
          background: rgba(11, 15, 25, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }

        .token-element {
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
        }

        .token-circle {
          stroke: #ffffff;
          stroke-width: 0.06px;
        }

        .token-inner {
          fill: #ffffff;
          opacity: 0.9;
        }

        .token-ghost {
          opacity: 0.45;
          stroke-dasharray: 0.1 0.1;
          pointer-events: none;
        }
      `}</style>

      <svg viewBox={isSixPlayer ? "4.3 4.3 21.4 21.4" : "0 0 15 15"} className="ludo-board-svg">
        {isSixPlayer ? (
          <>
            {/* Draw 6 arms recursively using transform rotation */}
            {Array.from({ length: 6 }).map((_, i) => {
              const color = ['red', 'green', 'yellow', 'blue', 'orange', 'purple'][i];
              return (
                <g key={`arm-${i}`} transform={`rotate(${i * 60}, 15, 15)`}>
                  {/* Track Cells: Left column */}
                  {Array.from({ length: 6 }).map((_, r) => {
                    const isStart = r === 0;
                    const fill = isStart ? `var(--ludo-${color}-dark)` : 'rgba(20, 26, 42, 0.4)';
                    const border = isStart ? `var(--ludo-${color})` : 'rgba(255, 255, 255, 0.08)';
                    return (
                      <rect
                        key={`track-l-${r}`}
                        x={14}
                        y={13.2 - r}
                        width={1}
                        height={1}
                        fill={fill}
                        stroke={border}
                        strokeWidth={0.03}
                      />
                    );
                  })}
                  {/* Outer middle track cell */}
                  <rect
                    x={15}
                    y={8.2}
                    width={1}
                    height={1}
                    fill="rgba(20, 26, 42, 0.4)"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={0.03}
                  />
                  {/* Track Cells: Right column */}
                  {Array.from({ length: 6 }).map((_, r) => {
                    return (
                      <rect
                        key={`track-r-${r}`}
                        x={16}
                        y={8.2 + r}
                        width={1}
                        height={1}
                        fill="rgba(20, 26, 42, 0.4)"
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth={0.03}
                      />
                    );
                  })}
                  {/* Home Path Cells (5 cells) */}
                  {Array.from({ length: 5 }).map((_, h) => {
                    return (
                      <rect
                        key={`home-path-${h}`}
                        x={15}
                        y={13.2 - h}
                        width={1}
                        height={1}
                        fill={`var(--ludo-${color}-dark)`}
                        stroke={`var(--ludo-${color})`}
                        strokeWidth={0.03}
                      />
                    );
                  })}
                  {/* Yard Box */}
                  <rect
                    x={17.5}
                    y={7.2}
                    width={4.5}
                    height={4.5}
                    rx={0.5}
                    fill={`var(--ludo-${color}-dark)`}
                    stroke={`var(--ludo-${color})`}
                    strokeWidth={0.08}
                    opacity={0.35}
                  />
                  <rect
                    x={18.25}
                    y={8.0}
                    width={3.0}
                    height={3.0}
                    fill="var(--bg-main)"
                    opacity={0.8}
                    rx={0.2}
                  />
                  {/* 4 Yard Token slots */}
                  <circle cx={19.1} cy={8.8} r={0.38} fill={`var(--ludo-${color}-dark)`} opacity={0.4} stroke={`var(--ludo-${color})`} strokeWidth={0.02} />
                  <circle cx={20.4} cy={8.8} r={0.38} fill={`var(--ludo-${color}-dark)`} opacity={0.4} stroke={`var(--ludo-${color})`} strokeWidth={0.02} />
                  <circle cx={19.1} cy={10.2} r={0.38} fill={`var(--ludo-${color}-dark)`} opacity={0.4} stroke={`var(--ludo-${color})`} strokeWidth={0.02} />
                  <circle cx={20.4} cy={10.2} r={0.38} fill={`var(--ludo-${color}-dark)`} opacity={0.4} stroke={`var(--ludo-${color})`} strokeWidth={0.02} />
                  <text x={19.75} y={11.4} fill={`var(--ludo-${color})`} fontSize={0.45} fontWeight={800} textAnchor="middle" opacity={0.8}>
                    {color.toUpperCase()}
                  </text>

                  {/* Safe star at track index 8 (x=16, y=8.2) */}
                  {renderStar(16, 8.2, `var(--ludo-${color})`)}
                </g>
              );
            })}

            {/* Central Goal Hexagon */}
            <polygon
              points={Array.from({ length: 6 })
                .map((_, j) => {
                  const a = j * 60 - 30;
                  const rad = (a * Math.PI) / 180;
                  const x = 15 + 1.8 * Math.cos(rad);
                  const y = 15 + 1.8 * Math.sin(rad);
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="rgba(30, 41, 59, 0.95)"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={0.06}
            />
            {/* Center division lines radiating from center to the hexagon vertices */}
            {Array.from({ length: 6 }).map((_, j) => {
              const a = j * 60 - 30;
              const rad = (a * Math.PI) / 180;
              const x = 15 + 1.8 * Math.cos(rad);
              const y = 15 + 1.8 * Math.sin(rad);
              return (
                <line
                  key={`div-line-${j}`}
                  x1={15}
                  y1={15}
                  x2={x}
                  y2={y}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={0.03}
                />
              );
            })}
            <circle cx={15} cy={15} r={0.5} fill="var(--bg-main)" stroke="rgba(255,255,255,0.2)" strokeWidth={0.03} />
          </>
        ) : (
          <>
            {/* Draw 4-player background grid cells */}
            {cells}

            {/* Red Home Yard */}
            <g>
              <rect x={0} y={0} width={6} height={6} fill="var(--ludo-red-dark)" opacity={0.35} stroke="var(--ludo-red)" strokeWidth={0.06} rx={0.3} />
              <rect x={0.75} y={0.75} width={4.5} height={4.5} fill="var(--bg-main)" opacity={0.8} rx={0.2} />
              <circle cx={2} cy={2} r={0.5} fill="var(--ludo-red-dark)" opacity={0.4} stroke="var(--ludo-red)" strokeWidth={0.02} />
              <circle cx={3.5} cy={2} r={0.5} fill="var(--ludo-red-dark)" opacity={0.4} stroke="var(--ludo-red)" strokeWidth={0.02} />
              <circle cx={2} cy={3.5} r={0.5} fill="var(--ludo-red-dark)" opacity={0.4} stroke="var(--ludo-red)" strokeWidth={0.02} />
              <circle cx={3.5} cy={3.5} r={0.5} fill="var(--ludo-red-dark)" opacity={0.4} stroke="var(--ludo-red)" strokeWidth={0.02} />
              <text x={3} y={5.2} fill="var(--ludo-red)" fontSize={0.7} fontWeight={800} textAnchor="middle" opacity={0.8}>RED</text>
            </g>

            {/* Green Home Yard */}
            <g>
              <rect x={9} y={0} width={6} height={6} fill="var(--ludo-green-dark)" opacity={0.35} stroke="var(--ludo-green)" strokeWidth={0.06} rx={0.3} />
              <rect x={9.75} y={0.75} width={4.5} height={4.5} fill="var(--bg-main)" opacity={0.8} rx={0.2} />
              <circle cx={11} cy={2} r={0.5} fill="var(--ludo-green-dark)" opacity={0.4} stroke="var(--ludo-green)" strokeWidth={0.02} />
              <circle cx={12.5} cy={2} r={0.5} fill="var(--ludo-green-dark)" opacity={0.4} stroke="var(--ludo-green)" strokeWidth={0.02} />
              <circle cx={11} cy={3.5} r={0.5} fill="var(--ludo-green-dark)" opacity={0.4} stroke="var(--ludo-green)" strokeWidth={0.02} />
              <circle cx={12.5} cy={3.5} r={0.5} fill="var(--ludo-green-dark)" opacity={0.4} stroke="var(--ludo-green)" strokeWidth={0.02} />
              <text x={12} y={5.2} fill="var(--ludo-green)" fontSize={0.7} fontWeight={800} textAnchor="middle" opacity={0.8}>GREEN</text>
            </g>

            {/* Yellow Home Yard */}
            <g>
              <rect x={9} y={9} width={6} height={6} fill="var(--ludo-yellow-dark)" opacity={0.35} stroke="var(--ludo-yellow)" strokeWidth={0.06} rx={0.3} />
              <rect x={9.75} y={9.75} width={4.5} height={4.5} fill="var(--bg-main)" opacity={0.8} rx={0.2} />
              <circle cx={11} cy={11} r={0.5} fill="var(--ludo-yellow-dark)" opacity={0.4} stroke="var(--ludo-yellow)" strokeWidth={0.02} />
              <circle cx={12.5} cy={11} r={0.5} fill="var(--ludo-yellow-dark)" opacity={0.4} stroke="var(--ludo-yellow)" strokeWidth={0.02} />
              <circle cx={11} cy={12.5} r={0.5} fill="var(--ludo-yellow-dark)" opacity={0.4} stroke="var(--ludo-yellow)" strokeWidth={0.02} />
              <circle cx={12.5} cy={12.5} r={0.5} fill="var(--ludo-yellow-dark)" opacity={0.4} stroke="var(--ludo-yellow)" strokeWidth={0.02} />
              <text x={12} y={14.2} fill="var(--ludo-yellow)" fontSize={0.7} fontWeight={800} textAnchor="middle" opacity={0.8}>YELLOW</text>
            </g>

            {/* Blue Home Yard */}
            <g>
              <rect x={0} y={9} width={6} height={6} fill="var(--ludo-blue-dark)" opacity={0.35} stroke="var(--ludo-blue)" strokeWidth={0.06} rx={0.3} />
              <rect x={0.75} y={9.75} width={4.5} height={4.5} fill="var(--bg-main)" opacity={0.8} rx={0.2} />
              <circle cx={2} cy={11} r={0.5} fill="var(--ludo-blue-dark)" opacity={0.4} stroke="var(--ludo-blue)" strokeWidth={0.02} />
              <circle cx={3.5} cy={11} r={0.5} fill="var(--ludo-blue-dark)" opacity={0.4} stroke="var(--ludo-blue)" strokeWidth={0.02} />
              <circle cx={2} cy={12.5} r={0.5} fill="var(--ludo-blue-dark)" opacity={0.4} stroke="var(--ludo-blue)" strokeWidth={0.02} />
              <circle cx={3.5} cy={12.5} r={0.5} fill="var(--ludo-blue-dark)" opacity={0.4} stroke="var(--ludo-blue)" strokeWidth={0.02} />
              <text x={3} y={14.2} fill="var(--ludo-blue)" fontSize={0.7} fontWeight={800} textAnchor="middle" opacity={0.8}>BLUE</text>
            </g>

            {/* Safe Stars */}
            {stars}

            {/* Central Goal (Triangles) */}
            <g>
              {/* Red Goal */}
              <polygon points="6,6 6,9 7.5,7.5" fill="var(--ludo-red-dark)" stroke="var(--ludo-red)" strokeWidth={0.04} />
              {/* Green Goal */}
              <polygon points="6,6 9,6 7.5,7.5" fill="var(--ludo-green-dark)" stroke="var(--ludo-green)" strokeWidth={0.04} />
              {/* Yellow Goal */}
              <polygon points="9,6 9,9 7.5,7.5" fill="var(--ludo-yellow-dark)" stroke="var(--ludo-yellow)" strokeWidth={0.04} />
              {/* Blue Goal */}
              <polygon points="6,9 9,9 7.5,7.5" fill="var(--ludo-blue-dark)" stroke="var(--ludo-blue)" strokeWidth={0.04} />
              {/* Central division lines */}
              <line x1={6} y1={6} x2={9} y2={9} stroke="rgba(255,255,255,0.15)" strokeWidth={0.03} />
              <line x1={6} y1={9} x2={9} y2={6} stroke="rgba(255,255,255,0.15)" strokeWidth={0.03} />
              <circle cx={7.5} cy={7.5} r={0.45} fill="var(--bg-main)" stroke="rgba(255,255,255,0.2)" strokeWidth={0.03} />
            </g>
          </>
        )}

        {/* Hovered Token Path Destination Highlight (Ghost/Prediction) */}
        {hoveredTokenId && (() => {
          const [color, idStr] = hoveredTokenId.split('_');
          const id = parseInt(idStr, 10);
          const hoveredToken = tokens.find(t => t.color === color && t.id === id);
          if (hoveredToken && isValidMove(hoveredToken, diceValue, activeColor!, isSixPlayer)) {
            const nextPos = getNextPosition(hoveredToken, diceValue, isSixPlayer);
            const dummyToken: Token = { ...hoveredToken, position: nextPos };
            const coord = getCoordinates(dummyToken);
            const goalPos = isSixPlayer ? 83 : 57;
            const isGridPosition = nextPos !== 0 && nextPos !== goalPos;
            const cx = coord.x + (isGridPosition ? 0.5 : 0);
            const cy = coord.y + (isGridPosition ? 0.5 : 0);
            return (
              <g className="token-ghost">
                <circle
                  cx={cx}
                  cy={cy}
                  r={0.35}
                  fill="none"
                  stroke={colorMap[hoveredToken.color]}
                  strokeWidth={0.07}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={0.16}
                  fill={colorMap[hoveredToken.color]}
                  opacity={0.6}
                />
              </g>
            );
          }
          return null;
        })()}

        {/* Active Tokens */}
        {tokens.map((token) => {
          const { color, id, position } = token;
          const coord = getCoordinates(token);
          const offset = offsets.get(`${color}_${id}`) || { dx: 0, dy: 0 };
          const goalPos = isSixPlayer ? 83 : 57;
          const isGridPosition = position !== 0 && position !== goalPos;
          const cx = coord.x + (isGridPosition ? 0.5 : 0) + offset.dx;
          const cy = coord.y + (isGridPosition ? 0.5 : 0) + offset.dy;

          const canMove = hasRolled && activeColor === color && isValidMove(token, diceValue, activeColor, isSixPlayer);
          const tokenKey = `${color}_${id}`;
          
          return (
            <g
              key={tokenKey}
              className={`token-element ${canMove ? 'token-active' : ''}`}
              onClick={() => canMove && onTokenClick(id)}
              onMouseEnter={() => canMove && setHoveredTokenId(tokenKey)}
              onMouseLeave={() => setHoveredTokenId(null)}
              style={{ color: colorMap[color] }}
            >
              {/* Invisible large touch target overlay for mobile ease of use */}
              {canMove && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={0.65}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                />
              )}
              {/* Token Shadow and Base */}
              <circle
                cx={cx}
                cy={cy}
                r={0.34}
                fill={colorMap[color]}
                className="token-circle"
                style={{
                  filter: canMove ? `drop-shadow(0 0 4px ${colorMap[color]})` : undefined
                }}
              />
              
              {/* Glossy overlay */}
              <circle
                cx={cx - 0.08}
                cy={cy - 0.08}
                r={0.09}
                className="token-inner"
              />

              {/* Unique Number tag */}
              <text
                x={cx}
                y={cy + 0.1}
                fill="#ffffff"
                fontSize={0.28}
                fontWeight={800}
                textAnchor="middle"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {id + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
export default LudoBoard;
