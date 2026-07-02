export interface AvatarOption {
  id: string;
  emoji: string;
  label: string;
  bg: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'boy', emoji: '🧑‍💻', label: 'Gamer Boy', bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
  { id: 'girl', emoji: '👩‍🎤', label: 'Rockstar Girl', bg: 'linear-gradient(135deg, #ec4899, #be185d)' },
  { id: 'captain', emoji: '👨‍✈️', label: 'Captain', bg: 'linear-gradient(135deg, #10b981, #047857)' },
  { id: 'ninja', emoji: '🥷', label: 'Shadow Ninja', bg: 'linear-gradient(135deg, #6b7280, #374151)' },
  { id: 'wizard', emoji: '🧙‍♂️', label: 'Archmage', bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
  { id: 'robot', emoji: '🤖', label: 'Cyborg-9', bg: 'linear-gradient(135deg, #f59e0b, #b45309)' },
  { id: 'king', emoji: '👑', label: 'Ludo King', bg: 'linear-gradient(135deg, #ef4444, #b91c1c)' }
];

export const getAvatarById = (id: string | undefined): AvatarOption => {
  return AVATAR_OPTIONS.find((av) => av.id === id) || AVATAR_OPTIONS[0];
};
