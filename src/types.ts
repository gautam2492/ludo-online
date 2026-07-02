export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue' | 'orange' | 'purple';

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isHost: boolean;
  isConnected: boolean;
  isBot: boolean;
  peerId?: string;
  wins?: number;
  avatarUrl?: string;
  coins?: number;
  level?: number;
}

export interface Token {
  id: number; // 0, 1, 2, 3
  color: PlayerColor;
  position: number; // 0 = Yard, 1-51 = Common Track, 52-56 = Home Path, 57 = Home (Goal)
}

export interface ChatMsg {
  id: string;
  senderName: string;
  senderColor?: PlayerColor | 'system';
  text: string;
  timestamp: number;
  isSystem: boolean;
}

export interface GameState {
  players: Player[];
  tokens: Token[];
  activePlayerIndex: number;
  diceValue: number;
  diceState: 'idle' | 'rolling' | 'rolled';
  hasRolled: boolean;
  winnerColor: PlayerColor | null;
  logs: string[];
  statusMessage: string;
  chat: ChatMsg[];
  gameStarted: boolean;
  consecutiveSixes: number;
  turnTimer: number | null;
  isPaused?: boolean;
}

export interface NetworkMessage {
  type: 'SYNC_STATE' | 'CHAT' | 'ROLL_DICE' | 'MOVE_TOKEN' | 'RESTART_GAME' | 'JOIN_ROOM' | 'LEAVE_ROOM' | 'BOT_CONFIG' | 'PAUSE_GAME' | 'SEND_EMOJI';
  payload: any;
}
