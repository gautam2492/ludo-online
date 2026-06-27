import { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { NetworkMessage } from '../types';

type MessageCallback = (msg: NetworkMessage) => void;

class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private onMessageCallback: MessageCallback | null = null;
  private isHostFlag: boolean = false;
  private roomId: string = '';
  private myPlayerId: string = '';
  private myName: string = '';

  constructor() {
    this.myPlayerId = 'player_' + Math.random().toString(36).substr(2, 9);
  }

  public initHost(name: string, onReady: (id: string) => void, onError: (err: any) => void) {
    this.cleanup();
    this.isHostFlag = true;
    this.myName = name;
    
    // Generate a simple, readable room ID
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.roomId = `LUDO-${randomHex}`;

    this.peer = new Peer(this.roomId, {
      debug: 1
    });

    this.peer.on('open', (id) => {
      onReady(id);
    });

    this.peer.on('error', (err) => {
      console.error('Peer error:', err);
      // If the ID is already taken, try a different random ID
      if (err.type === 'unavailable-id') {
        setTimeout(() => this.initHost(name, onReady, onError), 1000);
      } else {
        onError(err);
      }
    });

    this.peer.on('connection', (conn) => {
      this.setupHostConnectionHandlers(conn);
    });
  }

  public initOffline(name: string, onReady: (id: string) => void) {
    this.cleanup();
    this.isHostFlag = true;
    this.myName = name;
    this.roomId = 'OFFLINE';
    onReady(this.roomId);
  }

  public initGuest(roomId: string, name: string, onConnected: () => void, onError: (err: any) => void) {
    this.cleanup();
    this.isHostFlag = false;
    this.roomId = roomId.toUpperCase().trim();
    this.myName = name;

    this.peer = new Peer({
      debug: 1
    });

    this.peer.on('open', () => {
      const conn = this.peer!.connect(this.roomId);
      this.hostConnection = conn;
      
      const handleGuestOpen = () => {
        onConnected();
        // Send initial join message
        this.sendToHost({
          type: 'JOIN_ROOM',
          payload: {
            id: this.myPlayerId,
            name: this.myName,
            peerId: this.getPeerId()
          }
        });
      };

      if (conn.open) {
        handleGuestOpen();
      } else {
        conn.on('open', handleGuestOpen);
      }

      conn.on('data', (data: any) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(data as NetworkMessage);
        }
      });

      conn.on('close', () => {
        console.log('Connection to host closed');
        onError(new Error('Connection to host lost'));
      });

      conn.on('error', (err) => {
        console.error('Connection error:', err);
        onError(err);
      });
    });

    this.peer.on('error', (err) => {
      console.error('Guest Peer error:', err);
      onError(err);
    });
  }

  private setupHostConnectionHandlers(conn: DataConnection) {
    const handleHostOpen = () => {
      console.log('Client connected:', conn.peer);
      this.connections.set(conn.peer, conn);
    };

    if (conn.open) {
      handleHostOpen();
    } else {
      conn.on('open', handleHostOpen);
    }

    conn.on('data', (data: any) => {
      // Safety Sync Check: if data is received, connection is active. Ensure mapping exists.
      if (!this.connections.has(conn.peer)) {
        this.connections.set(conn.peer, conn);
      }

      const msg = data as NetworkMessage;
      if (msg.type === 'JOIN_ROOM') {
        // Associate connection metadata
        (conn as any).playerId = msg.payload.id;
        (conn as any).playerName = msg.payload.name;
      }
      
      if (this.onMessageCallback) {
        this.onMessageCallback(msg);
      }
    });

    conn.on('close', () => {
      console.log('Client disconnected:', conn.peer);
      const pid = (conn as any).playerId;
      this.connections.delete(conn.peer);
      
      if (this.onMessageCallback && pid) {
        this.onMessageCallback({
          type: 'LEAVE_ROOM',
          payload: { id: pid }
        });
      }
    });

    conn.on('error', (err) => {
      console.error('Host connection error from client:', conn.peer, err);
    });
  }

  public registerCallbacks(onMessage: MessageCallback) {
    this.onMessageCallback = onMessage;
  }

  public sendToHost(msg: NetworkMessage) {
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(msg);
    }
  }

  public broadcast(msg: NetworkMessage) {
    if (!this.isHostFlag) {
      this.sendToHost(msg);
      return;
    }

    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  public getPlayerId(): string {
    return this.myPlayerId;
  }

  public isHost(): boolean {
    return this.isHostFlag;
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public getConnectedClientsCount(): number {
    return this.connections.size;
  }

  public getPeer(): Peer | null {
    return this.peer;
  }

  public getPeerId(): string {
    return this.peer ? this.peer.id : '';
  }

  public cleanup() {
    this.connections.forEach(conn => conn.close());
    this.connections.clear();

    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.isHostFlag = false;
    this.roomId = '';
  }
}

export const peerService = new PeerService();
export default peerService;
