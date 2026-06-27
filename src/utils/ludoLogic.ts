import type { PlayerColor, Token } from '../types';

// The 52 coordinates of the 4-player common track, clockwise starting from (0, 6)
export const TRACK_COORDS: [number, number][] = [
  [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], // Left arm top row (0-5)
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], // Top arm left col (6-11)
  [7, 0],                                         // Top turn (12)
  [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], // Top arm right col (13-18)
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], // Right arm top row (19-24)
  [14, 7],                                        // Right turn (25)
  [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], // Right arm bottom row (26-31)
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], // Bottom arm right col (32-37)
  [7, 14],                                        // Bottom turn (38)
  [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], // Bottom arm left col (39-44)
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], // Left arm bottom row (45-50)
  [0, 7]                                          // Left turn (51)
];

// Start index of each color in the TRACK_COORDS array (4-player)
export const START_INDEX: Record<string, number> = {
  red: 1,
  green: 14,
  yellow: 27,
  blue: 40
};

// Safe cell indices on the common track (4-player)
export const SAFE_INDICES = new Set<number>([1, 8, 14, 21, 27, 34, 40, 47]);

// 5 Home path cells for each color (4-player)
export const HOME_PATH_COORDS: Record<string, [number, number][]> = {
  red:    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  green:  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  blue:   [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]]
};

// Center goal triangle coordinates for each color (4-player)
export const GOAL_COORDS: Record<string, [number, number][]> = {
  red:    [[6.2, 7], [6.5, 6.5], [6.5, 7.5], [6.8, 7]],
  green:  [[7, 6.2], [6.5, 6.5], [7.5, 6.5], [7, 6.8]],
  yellow: [[7.8, 7], [7.5, 6.5], [7.5, 7.5], [7.2, 7]],
  blue:   [[7, 7.8], [6.5, 7.5], [7.5, 7.5], [7, 7.2]]
};

// Token coordinates in their respective Home Yards (4-player)
export const YARD_COORDS: Record<string, [number, number][]> = {
  red:    [[2, 2], [3.5, 2], [2, 3.5], [3.5, 3.5]],
  green:  [[11, 2], [12.5, 2], [11, 3.5], [12.5, 3.5]],
  yellow: [[11, 11], [12.5, 11], [11, 12.5], [12.5, 12.5]],
  blue:   [[2, 11], [3.5, 11], [2, 12.5], [3.5, 12.5]]
};

// Helper: Color to index mapping
export const getPlayerColorIndex = (color: PlayerColor): number => {
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue', 'orange', 'purple'];
  return colors.indexOf(color);
};

// Helper: Get global track cell index
export const getGlobalTrackIndex = (color: PlayerColor, pos: number, isSixPlayer: boolean): number => {
  if (isSixPlayer) {
    const startIdx = getPlayerColorIndex(color) * 13;
    return (startIdx + pos - 1) % 78;
  } else {
    const startIdx = START_INDEX[color] || 0;
    return (startIdx + pos - 1) % 52;
  }
};

/**
 * Returns grid coordinates (x, y) for a token based on its state.
 * For 6-player layout, we handle rotation inside LudoBoard.tsx coordinate builder.
 */
export function getTokenCoordinates(token: Token): { x: number; y: number } {
  const { color, position, id } = token;

  if (position === 0) {
    const coord = YARD_COORDS[color] ? YARD_COORDS[color][id] : [0, 0];
    return { x: coord[0], y: coord[1] };
  }

  if (position === 57) {
    const coord = GOAL_COORDS[color] ? GOAL_COORDS[color][id] : [0, 0];
    return { x: coord[0], y: coord[1] };
  }

  if (position >= 52 && position <= 56) {
    const coord = HOME_PATH_COORDS[color] ? HOME_PATH_COORDS[color][position - 52] : [0, 0];
    return { x: coord[0], y: coord[1] };
  }

  const startIdx = START_INDEX[color] || 0;
  const trackIdx = (startIdx + position - 1) % 52;
  const coord = TRACK_COORDS[trackIdx];
  return { x: coord[0], y: coord[1] };
}

/**
 * Check if a move is valid for the given token and dice roll.
 */
export function isValidMove(
  token: Token,
  diceValue: number,
  activePlayerColor: PlayerColor,
  isSixPlayer: boolean = false
): boolean {
  if (token.color !== activePlayerColor) return false;
  const goalPos = isSixPlayer ? 83 : 57;

  if (token.position === 0) {
    return diceValue === 6;
  }

  return token.position + diceValue <= goalPos;
}

/**
 * Returns the next position for a token given a dice roll.
 */
export function getNextPosition(
  token: Token,
  diceValue: number,
  _isSixPlayer: boolean = false
): number {
  if (token.position === 0) {
    return diceValue === 6 ? 1 : 0;
  }
  return token.position + diceValue;
}

/**
 * Checks for capturing opponent tokens at the destination index on the track.
 */
export function getCapturedTokens(
  movingToken: Token,
  nextPosition: number,
  allTokens: Token[],
  isSixPlayer: boolean = false
): Token[] {
  const trackLimit = isSixPlayer ? 77 : 51;
  if (nextPosition < 1 || nextPosition > trackLimit) return [];

  const destTrackIdx = getGlobalTrackIndex(movingToken.color, nextPosition, isSixPlayer);

  // Check if destination cell is safe
  if (isSixPlayer) {
    // In 6-player, release cell of every arm is safe (index % 13 === 0) or specific stars
    // Let's safe-guard the release cells (idx % 13 === 0) and the mid-path star cells (idx % 13 === 8)
    if (destTrackIdx % 13 === 0 || destTrackIdx % 13 === 8) return [];
  } else {
    if (SAFE_INDICES.has(destTrackIdx)) return [];
  }

  return allTokens.filter(t => {
    if (t.color === movingToken.color || t.position === 0) return false;
    const oppTrackLimit = isSixPlayer ? 77 : 51;
    if (t.position > oppTrackLimit) return false;

    const oppTrackIdx = getGlobalTrackIndex(t.color, t.position, isSixPlayer);
    return oppTrackIdx === destTrackIdx;
  });
}

/**
 * Check if a player has any valid moves
 */
export function hasValidMoves(
  tokens: Token[],
  diceValue: number,
  color: PlayerColor,
  isSixPlayer: boolean = false
): boolean {
  return tokens.some(token => token.color === color && isValidMove(token, diceValue, color, isSixPlayer));
}

/**
 * Check if a player has won (all 4 tokens in goal)
 */
export function hasPlayerWon(
  tokens: Token[],
  color: PlayerColor,
  isSixPlayer: boolean = false
): boolean {
  const playerTokens = tokens.filter(t => t.color === color);
  const goalPos = isSixPlayer ? 83 : 57;
  return playerTokens.length === 4 && playerTokens.every(t => t.position === goalPos);
}
