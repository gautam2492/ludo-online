import React, { useState, useEffect, useRef } from 'react';
import type { GameState, Player, Token, ChatMsg, PlayerColor, NetworkMessage } from './types';
import Lobby from './components/Lobby';
import LudoBoard from './components/LudoBoard';
import Dice from './components/Dice';
import ChatPanel from './components/ChatPanel';
import peerService from './services/peerService';
import { audio } from './utils/audio';
import {
  isValidMove,
  getNextPosition,
  getCapturedTokens,
  hasValidMoves,
  hasPlayerWon
} from './utils/ludoLogic';
import { Volume2, VolumeX, LogOut, Info, RotateCcw } from 'lucide-react';


const INITIAL_TOKENS = (): Token[] => {
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
  const tokens: Token[] = [];
  colors.forEach((color) => {
    for (let id = 0; id < 4; id++) {
      tokens.push({ id, color, position: 0 });
    }
  });
  return tokens;
};

export const App: React.FC = () => {
  // Navigation & connection UI states
  const [inGame, setInGame] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(audio.isEnabled());

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    tokens: INITIAL_TOKENS(),
    activePlayerIndex: 0,
    diceValue: 1,
    diceState: 'idle',
    hasRolled: false,
    winnerColor: null,
    logs: [],
    chat: [],
    gameStarted: false,
    statusMessage: 'Welcome to Ludo! Host a room or join one to start.',
    consecutiveSixes: 0
  });

  // Reference to game state for event handlers / callbacks
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  // Sound toggle helper
  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    audio.setEnabled(newVal);
  };

  // Helper to log messages to the chat and log streams
  const addSystemLog = (text: string) => {
    const systemMsg: ChatMsg = {
      id: 'sys_' + Math.random().toString(36).substr(2, 9),
      senderName: 'System',
      senderColor: 'system',
      text,
      timestamp: Date.now(),
      isSystem: true
    };
    setGameState((prev) => ({
      ...prev,
      chat: [...prev.chat, systemMsg],
      logs: [...prev.logs.slice(-49), text] // Keep last 50 logs
    }));
  };

  // Helper to get active player
  const getActivePlayer = (state: GameState = stateRef.current): Player | undefined => {
    if (state.players.length === 0) return undefined;
    return state.players[state.activePlayerIndex];
  };

  // Turn rotation logic
  const advanceTurn = (state: GameState, rolledSix: boolean = false, captured: boolean = false, reachedGoal: boolean = false) => {
    if (state.players.length === 0) return state;

    // Check if current player has won
    const activePlayer = state.players[state.activePlayerIndex];
    if (hasPlayerWon(state.tokens, activePlayer.color)) {
      addSystemLog(`🎉 Player ${activePlayer.name} (${activePlayer.color.toUpperCase()}) has won the game!`);
      audio.playWin();
      return {
        ...state,
        winnerColor: activePlayer.color,
        hasRolled: false
      };
    }

    // Standard Ludo Rule: If rolled a 6, captured a token, or reached home goal, keep turn
    if ((rolledSix || captured || reachedGoal) && !state.winnerColor) {
      const bonusType = rolledSix ? 'a 6' : captured ? 'a capture' : 'reaching home';
      return {
        ...state,
        hasRolled: false,
        diceState: 'idle' as const,
        statusMessage: `${activePlayer.name}'s bonus turn (earned by ${bonusType})!`
      };
    }

    // Otherwise, advance to next player who is connected or is a bot
    let nextIdx = state.activePlayerIndex;
    let iterations = 0;
    
    do {
      nextIdx = (nextIdx + 1) % state.players.length;
      iterations++;
    } while (
      !state.players[nextIdx].isConnected && 
      !state.players[nextIdx].isBot && 
      iterations < state.players.length
    );

    const nextPlayer = state.players[nextIdx];

    return {
      ...state,
      activePlayerIndex: nextIdx,
      hasRolled: false,
      diceState: 'idle' as const,
      consecutiveSixes: 0,
      statusMessage: `It is now ${nextPlayer.name}'s turn (${nextPlayer.color.toUpperCase()})`
    };
  };

  // Handle Roll Dice action (Authoritative Host only)
  const rollDice = () => {
    const state = stateRef.current;
    if (state.hasRolled || state.diceState === 'rolling' || state.winnerColor) return;

    const activePlayer = getActivePlayer(state);
    if (!activePlayer) return;

    // Trigger rolling state
    setGameState((prev) => ({
      ...prev,
      diceState: 'rolling'
    }));

    if (isHost) {
      peerService.broadcast({ type: 'SYNC_STATE', payload: { ...state, diceState: 'rolling' } });
    }

    // Dice roll finishes after 800ms animation
    setTimeout(() => {
      const finalVal = Math.floor(Math.random() * 6) + 1;
      setGameState((prev) => {
        const activePl = prev.players[prev.activePlayerIndex];
        const isSix = finalVal === 6;
        const newSixesCount = isSix ? prev.consecutiveSixes + 1 : 0;
        
        let updatedLogs = [...prev.logs];
        
        if (newSixesCount === 3) {
          updatedLogs.push(`${activePl.name} rolled three 6s in a row! Turn passed.`);
        } else {
          updatedLogs.push(`${activePl.name} rolled a ${finalVal}`);
        }
        
        // Build state update
        let nextState: GameState = {
          ...prev,
          diceValue: finalVal,
          diceState: 'rolled',
          hasRolled: true,
          consecutiveSixes: newSixesCount,
          logs: updatedLogs
        };

        if (newSixesCount === 3) {
          // Skip turn immediately
          nextState = advanceTurn(nextState, false, false, false);
          nextState.consecutiveSixes = 0;
          if (isHost) {
            peerService.broadcast({ type: 'SYNC_STATE', payload: nextState });
          }
          return nextState;
        }

        // If no moves are possible, check if we rolled a 6
        const movesPossible = hasValidMoves(prev.tokens, finalVal, activePl.color);
        if (!movesPossible) {
          if (isSix) {
            // Keep turn (rolled 6 bonus roll even if no moves possible)
            nextState.statusMessage = `${activePl.name} rolled a 6 but has no valid moves. Roll again!`;
            nextState.hasRolled = false;
            nextState.diceState = 'idle' as const;
          } else {
            nextState.statusMessage = `${activePl.name} has no valid moves with ${finalVal}!`;
            setTimeout(() => {
              setGameState((currentState) => {
                // Safety check: ensure turn wasn't advanced/changed in the meantime
                if (currentState.activePlayerIndex !== prev.activePlayerIndex || !currentState.hasRolled) {
                  return currentState;
                }
                const advancedState = advanceTurn(currentState, false, false, false);
                if (isHost) {
                  peerService.broadcast({ type: 'SYNC_STATE', payload: advancedState });
                }
                return advancedState;
              });
            }, 1500);
          }
        } else {
          nextState.statusMessage = `${activePl.name} rolled a ${finalVal}. Select a token to move.`;
        }

        if (isHost) {
          peerService.broadcast({ type: 'SYNC_STATE', payload: nextState });
        }
        return nextState;
      });
    }, 800);
  };

  // Handle Token Move action (Authoritative Host only)
  const moveToken = (tokenId: number) => {
    const state = stateRef.current;
    if (!state.hasRolled || state.diceState !== 'rolled' || state.winnerColor) return;

    const activePlayer = getActivePlayer(state);
    if (!activePlayer) return;

    const tokenIndex = state.tokens.findIndex(
      (t) => t.color === activePlayer.color && t.id === tokenId
    );

    if (tokenIndex === -1) return;
    const token = state.tokens[tokenIndex];

    if (!isValidMove(token, state.diceValue, activePlayer.color)) return;

    audio.playMove();

    setGameState((prev) => {
      const currentToken = prev.tokens[tokenIndex];
      const nextPos = getNextPosition(currentToken, prev.diceValue);

      // Check captures
      const captures = getCapturedTokens(currentToken, nextPos, prev.tokens);
      let capturedFlag = false;

      // Update tokens array
      const newTokens = prev.tokens.map((t, idx) => {
        if (idx === tokenIndex) {
          return { ...t, position: nextPos };
        }
        // If captured, return to yard (position 0)
        const isCaptured = captures.some((c) => c.color === t.color && c.id === t.id);
        if (isCaptured) {
          capturedFlag = true;
          return { ...t, position: 0 };
        }
        return t;
      });

      const reachedGoal = nextPos === 56;

      // System message feedback
      let logMsg = `${activePlayer.name} moved token ${tokenId + 1} to space ${nextPos}`;
      if (reachedGoal) {
        logMsg = `🎉 ${activePlayer.name}'s token ${tokenId + 1} got home!`;
        audio.playHome();
      } else if (capturedFlag) {
        captures.forEach((opp) => {
          logMsg = `💥 ${activePlayer.name} captured Opponent's token (${opp.color.toUpperCase()})!`;
        });
        audio.playCapture();
      }

      // Compile state update
      let nextState = {
        ...prev,
        tokens: newTokens,
        logs: [...prev.logs, logMsg]
      };

      // Check if this move triggers bonus turn or advances
      const rolledSix = prev.diceValue === 6;
      nextState = advanceTurn(nextState, rolledSix, capturedFlag, reachedGoal);

      if (isHost) {
        peerService.broadcast({ type: 'SYNC_STATE', payload: nextState });
      }

      return nextState;
    });
  };

  // Host Action: Restart Match
  const restartGame = () => {
    if (!isHost) return;
    audio.playHome();
    setGameState((prev) => {
      const nextState = {
        ...prev,
        tokens: INITIAL_TOKENS(),
        activePlayerIndex: 0,
        diceValue: 1,
        diceState: 'idle' as const,
        hasRolled: false,
        winnerColor: null,
        consecutiveSixes: 0,
        logs: [...prev.logs, 'Host restarted the match!']
      };
      peerService.broadcast({ type: 'SYNC_STATE', payload: nextState });
      return nextState;
    });
  };

  // P2P Message handler
  const handleNetworkMessage = (msg: NetworkMessage) => {
    switch (msg.type) {
      case 'SYNC_STATE':
        setGameState(msg.payload);
        break;

      case 'CHAT':
        setGameState((prev) => {
          const nextState = {
            ...prev,
            chat: [...prev.chat, msg.payload]
          };
          if (isHost) {
            peerService.broadcast({ type: 'SYNC_STATE', payload: nextState });
          }
          return nextState;
        });
        break;

      case 'JOIN_ROOM':
        if (isHost) {
          const { id, name } = msg.payload;
          setGameState((prev) => {
            // Find first available color
            const assignedColors = prev.players.map((p) => p.color);
            const colorsList: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
            const freeColor = colorsList.find((c) => !assignedColors.includes(c)) || 'red';

            // Add new player
            const newPlayer: Player = {
              id,
              name,
              color: freeColor,
              isHost: false,
              isConnected: true,
              isBot: false
            };

            const updatedPlayers = [...prev.players, newPlayer];
            const nextState = {
              ...prev,
              players: updatedPlayers
            };

            setTimeout(() => {
              addSystemLog(`${name} connected as ${freeColor.toUpperCase()}`);
              peerService.broadcast({ type: 'SYNC_STATE', payload: nextState });
            }, 100);

            return nextState;
          });
        }
        break;

      case 'LEAVE_ROOM':
        if (isHost) {
          const { id } = msg.payload;
          setGameState((prev) => {
            const playerLeaving = prev.players.find((p) => p.id === id);
            if (!playerLeaving) return prev;

            // Disconnect player. Replace them with a Bot so the game doesn't break!
            const updatedPlayers = prev.players.map((p) => {
              if (p.id === id) {
                return { ...p, isConnected: false, isBot: true, name: `${p.name} (Bot)` };
              }
              return p;
            });

            const nextState = {
              ...prev,
              players: updatedPlayers
            };

            setTimeout(() => {
              addSystemLog(`${playerLeaving.name} left. A Bot took over their slot.`);
              peerService.broadcast({ type: 'SYNC_STATE', payload: nextState });
            }, 100);

            return nextState;
          });
        }
        break;

      case 'ROLL_DICE':
        if (isHost) {
          rollDice();
        }
        break;

      case 'MOVE_TOKEN':
        if (isHost) {
          moveToken(msg.payload.tokenId);
        }
        break;

      case 'RESTART_GAME':
        if (isHost) {
          restartGame();
        }
        break;
      
      default:
        break;
    }
  };

  // Host setup triggers
  const hostRoom = (hostName: string, hostColor: PlayerColor) => {
    setIsConnecting(true);
    peerService.initHost(
      hostName,
      (id) => {
        setRoomId(id);
        setIsHost(true);
        setIsConnecting(false);
        setInGame(true);
        
        // Host player configuration
        const hostPlayer: Player = {
          id: peerService.getPlayerId(),
          name: hostName,
          color: hostColor,
          isHost: true,
          isConnected: true,
          isBot: false
        };

        setGameState((prev) => ({
          ...prev,
          players: [hostPlayer],
          chat: [],
          gameStarted: false
        }));

        peerService.registerCallbacks(handleNetworkMessage);
      },
      (_err) => {
        setErrorMsg('Failed to create peer host server. Try again.');
        setIsConnecting(false);
      }
    );
  };

  // Guest setup triggers
  const joinRoom = (guestName: string, _guestColor: PlayerColor, code: string) => {
    setIsConnecting(true);
    setErrorMsg('');
    peerService.initGuest(
      code,
      guestName,
      () => {
        setRoomId(code.toUpperCase());
        setIsHost(false);
        setIsConnecting(false);
        setInGame(true);

        peerService.registerCallbacks(handleNetworkMessage);
      },
      (_err) => {
        setErrorMsg('Failed to join room. Verify the Room ID and try again.');
        setIsConnecting(false);
      }
    );
  };

  // Host Action: Add a bot player to fill empty lobby slot
  const addBot = () => {
    if (!isHost) return;
    setGameState((prev) => {
      if (prev.players.length >= 4) return prev;
      
      const assignedColors = prev.players.map((p) => p.color);
      const colorsList: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
      const freeColor = colorsList.find((c) => !assignedColors.includes(c)) || 'red';

      const botNames = ['RoboRoller', 'ByteBiter', 'CyberPawn', 'AI-Player'];
      const botName = botNames[Math.floor(Math.random() * botNames.length)] + ` (${freeColor.toUpperCase()})`;

      const botPlayer: Player = {
        id: 'bot_' + Math.random().toString(36).substr(2, 9),
        name: botName,
        color: freeColor,
        isHost: false,
        isConnected: true,
        isBot: true
      };

      const nextState = {
        ...prev,
        players: [...prev.players, botPlayer]
      };
      
      peerService.broadcast({ type: 'SYNC_STATE', payload: nextState });
      return nextState;
    });
  };

  // Host Action: Remove a bot player from lobby
  const removeBot = (pid: string) => {
    if (!isHost) return;
    setGameState((prev) => {
      const nextState = {
        ...prev,
        players: prev.players.filter((p) => p.id !== pid)
      };
      peerService.broadcast({ type: 'SYNC_STATE', payload: nextState });
      return nextState;
    });
  };

  // Start the match
  const startGame = () => {
    if (!isHost) return;
    setGameState((prev) => {
      const nextState = {
        ...prev,
        gameStarted: true,
        statusMessage: `Match started! ${prev.players[0].name}'s turn.`
      };
      peerService.broadcast({ type: 'SYNC_STATE', payload: nextState });
      return nextState;
    });
  };

  // Send a chat message
  const sendChatMessage = (text: string) => {
    const activePlayer = gameState.players.find((p) => p.id === peerService.getPlayerId());
    const chatMsg: ChatMsg = {
      id: 'chat_' + Math.random().toString(36).substr(2, 9),
      senderName: activePlayer?.name || 'Spectator',
      senderColor: activePlayer?.color,
      text,
      timestamp: Date.now(),
      isSystem: false
    };

    if (isHost) {
      setGameState((prev) => {
        const nextState = {
          ...prev,
          chat: [...prev.chat, chatMsg]
        };
        peerService.broadcast({ type: 'SYNC_STATE', payload: nextState });
        return nextState;
      });
    } else {
      peerService.sendToHost({
        type: 'CHAT',
        payload: chatMsg
      });
    }
  };

  // Disconnect / Leave game
  const leaveGame = () => {
    peerService.cleanup();
    setInGame(false);
    setRoomId('');
    setIsHost(false);
    setGameState({
      players: [],
      tokens: INITIAL_TOKENS(),
      activePlayerIndex: 0,
      diceValue: 1,
      diceState: 'idle',
      hasRolled: false,
      winnerColor: null,
      logs: [],
      chat: [],
      gameStarted: false,
      statusMessage: '',
      consecutiveSixes: 0
    });
  };

  // Roll / Move wrapper mapping to network action if client
  const triggerRollIntent = () => {
    if (isHost) {
      rollDice();
    } else {
      peerService.sendToHost({ type: 'ROLL_DICE', payload: null });
    }
  };

  const triggerMoveIntent = (tokenId: number) => {
    if (isHost) {
      moveToken(tokenId);
    } else {
      peerService.sendToHost({ type: 'MOVE_TOKEN', payload: { tokenId } });
    }
  };

  // BOT AI turn automation
  useEffect(() => {
    if (!isHost || !gameState.gameStarted || gameState.winnerColor) return;

    const activePlayer = getActivePlayer();
    if (!activePlayer || !activePlayer.isBot) return;

    // Bot rolling logic
    if (!gameState.hasRolled && gameState.diceState === 'idle') {
      const timer = setTimeout(() => {
        rollDice();
      }, 1200);
      return () => clearTimeout(timer);
    }

    // Bot moving logic
    if (gameState.hasRolled && gameState.diceState === 'rolled') {
      const timer = setTimeout(() => {
        const myTokens = gameState.tokens.filter((t) => t.color === activePlayer.color);
        const validTokens = myTokens.filter((t) => isValidMove(t, gameState.diceValue, activePlayer.color));

        if (validTokens.length === 0) return; // Will auto-advance in rollDice handler

        // Heuristic AI selection:
        let bestToken = validTokens[0];
        let maxScore = -100;

        validTokens.forEach((token) => {
          let score = 0;
          const nextPos = getNextPosition(token, gameState.diceValue);

          // 1. Capture opponent is highest priority
          const captures = getCapturedTokens(token, nextPos, gameState.tokens);
          if (captures.length > 0) {
            score += 1000;
          }

          // 2. Getting a token out of the yard
          if (token.position === 0 && nextPos === 1) {
            score += 500;
          }

          // 3. Reaching goal
          if (nextPos === 56) {
            score += 400;
          }

          // 4. Moving closer to goal path
          if (token.position > 40 && nextPos >= 51) {
            score += 200;
          }

          // 5. Prefer moving tokens furthest along the track
          score += token.position;

          if (score > maxScore) {
            maxScore = score;
            bestToken = token;
          }
        });

        moveToken(bestToken.id);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [
    isHost,
    gameState.gameStarted,
    gameState.activePlayerIndex,
    gameState.diceState,
    gameState.hasRolled,
    gameState.winnerColor
  ]);

  const activePlayer = getActivePlayer();
  const myPlayerId = peerService.getPlayerId();
  const isMyTurn = activePlayer && activePlayer.id === myPlayerId;

  return (
    <div className="app-container">
      <style>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header {
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(11, 15, 25, 0.4);
        }

        .logo {
          font-weight: 900;
          font-size: 1.4rem;
          background: linear-gradient(135deg, var(--ludo-red), var(--ludo-blue));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-light);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: var(--border-focus);
        }

        .main-game {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          padding: 24px;
          max-width: 1000px;
          width: 100%;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .main-game {
            grid-template-columns: 1.3fr 1fr;
            align-items: start;
          }
        }

        .game-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .game-controls-panel {
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
        }

        .status-box {
          font-size: 1.05rem;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-light);
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .dice-outer {
          display: flex;
          align-items: center;
          gap: 24px;
          justify-content: center;
          width: 100%;
          padding: 10px;
        }

        .winner-banner {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(6, 8, 14, 0.85);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }

        .winner-title {
          font-size: 3rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-align: center;
        }
      `}</style>

      {/* Winner Screen Overlay */}
      {gameState.winnerColor && (
        <div className="winner-banner animate-winner">
          <h2
            className="winner-title"
            style={{
              color:
                gameState.winnerColor === 'red'
                  ? 'var(--ludo-red)'
                  : gameState.winnerColor === 'green'
                  ? 'var(--ludo-green)'
                  : gameState.winnerColor === 'yellow'
                  ? 'var(--ludo-yellow)'
                  : 'var(--ludo-blue)',
              textShadow: `0 0 30px var(--ludo-${gameState.winnerColor}-glow)`
            }}
          >
            {gameState.players.find((p) => p.color === gameState.winnerColor)?.name} Wins!
          </h2>
          <p className="text-lg text-slate-300">All tokens successfully made it home.</p>
          {isHost ? (
            <button className="glass-button glow-green" onClick={restartGame}>
              Play Again
            </button>
          ) : (
            <div className="text-sm text-slate-400">Waiting for host to restart match...</div>
          )}
          <button className="glass-button" onClick={leaveGame}>
            <LogOut size={16} /> Return to Lobby
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="header">
        <h1 className="logo">LUDO P2P</h1>
        <div className="header-controls">
          <button className="icon-btn" onClick={toggleSound} title="Toggle Sounds">
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          {inGame && (
            <button className="icon-btn text-red-400" onClick={leaveGame} title="Leave Game">
              <LogOut size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Primary Area */}
      {!inGame || !gameState.gameStarted ? (
        <Lobby
          onHost={hostRoom}
          onJoin={joinRoom}
          players={gameState.players}
          roomId={roomId}
          isHost={isHost}
          onStartGame={startGame}
          onAddBot={addBot}
          onRemoveBot={removeBot}
          isConnecting={isConnecting}
          errorMsg={errorMsg}
        />
      ) : (
        <main className="main-game">
          {/* Column 1: Board & Dice */}
          <div className="game-column">
            <LudoBoard
              tokens={gameState.tokens}
              activeColor={activePlayer?.color || null}
              diceValue={gameState.diceValue}
              hasRolled={gameState.hasRolled}
              onTokenClick={triggerMoveIntent}
            />

            <div className="game-controls-panel glass-panel">
              <div className="status-box">
                {gameState.statusMessage || 'Welcome to Ludo! Roll to begin.'}
              </div>

              <div className="dice-outer">
                <Dice
                  value={gameState.diceValue}
                  isRolling={gameState.diceState === 'rolling'}
                  onClick={triggerRollIntent}
                  disabled={!isMyTurn || gameState.hasRolled}
                  playerColor={activePlayer?.color || null}
                />
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                    Active Turn
                  </div>
                  <div
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: activePlayer ? `var(--ludo-${activePlayer.color})` : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: activePlayer ? `var(--ludo-${activePlayer.color})` : 'white',
                        boxShadow: activePlayer ? `0 0 10px var(--ludo-${activePlayer.color})` : 'none'
                      }}
                    />
                    {activePlayer?.name} {isMyTurn ? '(You)' : ''}
                  </div>
                </div>
              </div>

              {isHost && (
                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                  <button
                    className="glass-button"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                    onClick={restartGame}
                  >
                    <RotateCcw size={14} /> Reset Board
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Chat & Game Logs */}
          <div className="game-column">
            <ChatPanel
              chat={gameState.chat}
              players={gameState.players}
              onSendMessage={sendChatMessage}
              myPlayerId={myPlayerId}
            />
            
            <div className="glass-panel" style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 700, color: 'var(--neutral-300)' }}>
                <Info size={14} />
                <span>HOW TO PLAY ONLINE</span>
              </div>
              <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Host a game and share the Room ID with friends to join.</li>
                <li>Roll a 6 to release a token from your yard onto the starting cell.</li>
                <li>Earn a bonus turn if you roll a 6, capture an opponent's token, or get a token home.</li>
                <li>If a player leaves, a Bot will instantly take over their turn so you can finish!</li>
              </ul>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};
export default App;
