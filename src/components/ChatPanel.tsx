import React, { useState, useRef, useEffect } from 'react';
import type { ChatMsg, Player, PlayerColor } from '../types';
import { Send, Smile, Users, Shield } from 'lucide-react';

interface ChatPanelProps {
  chat: ChatMsg[];
  players: Player[];
  onSendMessage: (text: string) => void;
  myPlayerId: string;
}

const EMOJIS = ['😂', '😮', '😢', '🎉', '😠', '👍', '🔥', '🎲', '👑'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chat,
  players,
  onSendMessage,
  myPlayerId
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const getPlayerColorClass = (color?: PlayerColor | 'system') => {
    if (!color || color === 'system') return 'text-slate-400';
    return `color-${color}`;
  };

  return (
    <div className="chat-panel glass-panel">
      <style>{`
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 400px;
          border-radius: 16px;
          overflow: hidden;
        }

        .chat-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-light);
          background: rgba(255, 255, 255, 0.02);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header-title {
          font-weight: 700;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .players-summary {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: var(--neutral-300);
          background: rgba(255,255,255,0.05);
          padding: 4px 8px;
          border-radius: 20px;
        }

        .players-list {
          display: flex;
          gap: 6px;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border-light);
          overflow-x: auto;
          background: rgba(0,0,0,0.15);
        }

        .player-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          border: 1px solid transparent;
        }

        .badge-red { background: hsla(346, 85%, 57%, 0.15); border-color: hsla(346, 85%, 57%, 0.3); color: var(--ludo-red); }
        .badge-green { background: hsla(142, 72%, 45%, 0.15); border-color: hsla(142, 72%, 45%, 0.3); color: var(--ludo-green); }
        .badge-yellow { background: hsla(45, 93%, 50%, 0.15); border-color: hsla(45, 93%, 50%, 0.3); color: var(--ludo-yellow); }
        .badge-blue { background: hsla(217, 91%, 56%, 0.15); border-color: hsla(217, 91%, 56%, 0.3); color: var(--ludo-blue); }
        
        .badge-offline {
          opacity: 0.5;
          text-decoration: line-through;
        }

        .chat-body {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 380px;
        }

        .chat-msg {
          display: flex;
          flex-direction: column;
          max-width: 85%;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .msg-mine {
          align-self: flex-end;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-bottom-right-radius: 2px;
        }

        .msg-other {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-light);
          border-bottom-left-radius: 2px;
        }

        .msg-system {
          align-self: center;
          max-width: 95%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.04);
          text-align: center;
          font-size: 0.8rem;
          color: var(--neutral-300);
          border-radius: 8px;
          padding: 4px 10px;
        }

        .msg-sender {
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .msg-text {
          word-break: break-word;
        }

        .color-red { color: var(--ludo-red); }
        .color-green { color: var(--ludo-green); }
        .color-yellow { color: var(--ludo-yellow); }
        .color-blue { color: var(--ludo-blue); }

        .chat-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border-light);
          background: rgba(255,255,255,0.01);
          position: relative;
        }

        .chat-input-wrapper {
          display: flex;
          gap: 8px;
          position: relative;
        }

        .emoji-trigger {
          background: none;
          border: none;
          color: var(--neutral-500);
          cursor: pointer;
          padding: 0 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .emoji-trigger:hover {
          color: var(--ludo-yellow);
        }

        .emoji-picker {
          position: absolute;
          bottom: 100%;
          left: 16px;
          background: var(--bg-card);
          backdrop-filter: blur(16px);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 8px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
          box-shadow: 0 -8px 24px rgba(0,0,0,0.3);
          z-index: 100;
          margin-bottom: 8px;
        }

        .emoji-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .emoji-btn:hover {
          background: rgba(255,255,255,0.08);
        }
      `}</style>

      <div className="chat-header">
        <div className="chat-header-title">
          <Shield size={18} className="text-blue-400" />
          <span>Game Central</span>
        </div>
        <div className="players-summary">
          <Users size={14} />
          <span>{players.length}/4 Players</span>
        </div>
      </div>

      <div className="players-list">
        {players.map((p) => (
          <div
            key={p.id}
            className={`player-badge badge-${p.color} ${!p.isConnected && !p.isBot ? 'badge-offline' : ''}`}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: p.isConnected || p.isBot ? 'currentColor' : '#64748b'
              }}
            />
            {p.name} {p.isBot ? '(Bot)' : p.isHost ? '(Host)' : ''}
          </div>
        ))}
      </div>

      <div className="chat-body">
        {chat.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="chat-msg msg-system chat-message-anim">
                <span className="msg-text">{msg.text}</span>
              </div>
            );
          }

          const isMine = msg.senderName === players.find((p) => p.id === myPlayerId)?.name;
          const colorClass = getPlayerColorClass(msg.senderColor);

          return (
            <div
              key={msg.id}
              className={`chat-msg ${isMine ? 'msg-mine' : 'msg-other'} chat-message-anim`}
            >
              {!isMine && (
                <span className={`msg-sender ${colorClass}`}>{msg.senderName}</span>
              )}
              <span className="msg-text">{msg.text}</span>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-footer">
        {showEmojiPicker && (
          <div className="emoji-picker">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="emoji-btn"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="chat-input-wrapper">
          <button
            type="button"
            className="emoji-trigger"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={20} />
          </button>
          <input
            type="text"
            className="glass-input"
            style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="glass-button" style={{ padding: '8px 12px' }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
export default ChatPanel;
