import type { PlayerColor, Token } from '../types';

// The 52 coordinates of the common track, clockwise starting from (0, 6)
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

// Start index of each color in the TRACK_COORDS array
export const START_INDEX: Record<PlayerColor, number> = {
  red: 1,      // (1, 6)
  green: 14,   // (8, 1)
  yellow: 27,  // (13, 8)
  blue: 40     // (6, 13)
};

// Safe cell indices on the common track
export const SAFE_INDICES = new Set<number>([
  1,  // Red Start
  8,  // Top Star
  14, // Green Start
  21, // Right Star
  27, // Yellow Start
  34, // Bottom Star
  40, // Blue Start
  47  // Left Star
]);

// 5 Home path cells for each color
export const HOME_PATH_COORDS: Record<PlayerColor, [number, number][]> = {
  red:    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  green:  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  blue:   [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]]
};

// Center goal triangle coordinates for each color
// Used to spread the 4 tokens visually in the center goal
export const GOAL_COORDS: Record<PlayerColor, [number, number][]> = {
  red:    [[6.2, 7], [6.5, 6.5], [6.5, 7.5], [6.8, 7]],
  green:  [[7, 6.2], [6.5, 6.5], [7.5, 6.5], [7, 6.8]],
  yellow: [[7.8, 7], [7.5, 6.5], [7.5, 7.5], [7.2, 7]],
  blue:   [[7, 7.8], [6.5, 7.5], [7.5, 7.5], [7, 7.2]]
};

// Token coordinates in their respective Home Yards (Lobby bases)
export const YARD_COORDS: Record<PlayerColor, [number, number][]> = {
  red:    [[2, 2], [3.5, 2], [2, 3.5], [3.5, 3.5]],
  green:  [[11, 2], [12.5, 2], [11, 3.5], [12.5, 3.5]],
  yellow: [[11, 11], [12.5, 11], [11, 12.5], [12.5, 12.5]],
  blue:   [[2, 11], [3.5, 11], [2, 12.5], [3.5, 12.5]]
};

/**
 * Returns grid coordinates (x, y) for a token based on its state.
 */
export function getTokenCoordinates(token: Token): { x: number; y: number } {
  const { color, position, id } = token;

  if (position === 0) {
    // In Yard
    const coord = YARD_COORDS[color][id];
    return { x: coord[0], y: coord[1] };
  }

  if (position === 57) {
    // In Goal (Home)
    const coord = GOAL_COORDS[color][id];
    return { x: coord[0], y: coord[1] };
  }

  if (position >= 52 && position <= 56) {
    // Home Path
    const coord = HOME_PATH_COORDS[color][position - 52];
    return { x: coord[0], y: coord[1] };
  }

  // On Common Track
  const startIdx = START_INDEX[color];
  const trackIdx = (startIdx + position - 1) % 52;
  const coord = TRACK_COORDS[trackIdx];
  return { x: coord[0], y: coord[1] };
}

/**
 * Check if a move is valid for the given token and dice roll.
 */
export function isValidMove(token: Token, diceValue: number, activePlayerColor: PlayerColor): boolean {
  if (token.color !== activePlayerColor) return false;

  // Token is in yard
  if (token.position === 0) {
    // Needs exactly a 6 to enter
    return diceValue === 6;
  }

  // Token is on track or home path
  return token.position + diceValue <= 57;
}

/**
 * Returns the next position for a token given a dice roll.
 */
export function getNextPosition(token: Token, diceValue: number): number {
  if (token.position === 0) {
    return diceValue === 6 ? 1 : 0;
  }
  return token.position + diceValue;
}

/**
 * Checks for capturing opponent tokens at the destination index on the track.
 * Returns an array of captured tokens.
 */
export function getCapturedTokens(
  movingToken: Token,
  nextPosition: number,
  allTokens: Token[]
): Token[] {
  // Can only capture on the common track (positions 1 to 51)
  if (nextPosition < 1 || nextPosition > 51) return [];

  // Calculate global track index of destination
  const startIdx = START_INDEX[movingToken.color];
  const destTrackIdx = (startIdx + nextPosition - 1) % 52;

  // Safe cells cannot have captures
  if (SAFE_INDICES.has(destTrackIdx)) return [];

  // Find opponent tokens on the same track cell
  return allTokens.filter(t => {
    if (t.color === movingToken.color || t.position === 0 || t.position >= 52) return false;
    const oppStartIdx = START_INDEX[t.color];
    const oppTrackIdx = (oppStartIdx + t.position - 1) % 52;
    return oppTrackIdx === destTrackIdx;
  });
}

/**
 * Check if a player has any valid moves
 */
export function hasValidMoves(tokens: Token[], diceValue: number, color: PlayerColor): boolean {
  return tokens.some(token => token.color === color && isValidMove(token, diceValue, color));
}

/**
 * Check if a player has won (all 4 tokens in goal)
 */
export function hasPlayerWon(tokens: Token[], color: PlayerColor): boolean {
  const playerTokens = tokens.filter(t => t.color === color);
  return playerTokens.length === 4 && playerTokens.every(t => t.position === 57);
}
