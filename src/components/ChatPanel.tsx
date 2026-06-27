import React, { useRef, useEffect } from 'react';
import type { ChatMsg, Player } from '../types';
import { Users, Shield } from 'lucide-react';

interface ChatPanelProps {
  chat: ChatMsg[];
  players: Player[];
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chat,
  players
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

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

        .msg-system {
          align-self: center;
          width: 100%;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.04);
          text-align: left;
          font-size: 0.8rem;
          color: var(--neutral-300);
          border-radius: 8px;
          padding: 8px 12px;
          line-height: 1.4;
          box-sizing: border-box;
        }

        .msg-text {
          word-break: break-word;
        }
      `}</style>

      <div className="chat-header">
        <div className="chat-header-title">
          <Shield size={18} className="text-blue-400" />
          <span>Game Logs</span>
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
        {chat.map((msg) => (
          <div key={msg.id} className="chat-msg msg-system chat-message-anim">
            <span className="msg-text">{msg.text}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};
export default ChatPanel;
