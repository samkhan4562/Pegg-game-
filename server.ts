import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================================
// IN-MEMORY REAL-TIME DATA STORE
// ==========================================================

interface UserPresence {
  uid: string;
  name: string;
  avatar: string;
  status: 'online' | 'in-game' | 'offline';
  currentGame?: string;
  lastSeen: number;
}

interface FriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromAvatar: string;
  targetUid: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

interface FriendEntry {
  uid: string;
  name: string;
  avatar: string;
  addedAt: number;
}

interface GameInvite {
  id: string;
  fromUid: string;
  fromName: string;
  fromAvatar: string;
  gameId: 'tictactoe' | 'pegs' | 'bridge';
  gameName: string;
  roomId: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

// Global state in-memory
const activePresences = new Map<string, UserPresence>();
const friendsMap = new Map<string, Map<string, FriendEntry>>(); // userUid -> Map<friendUid, FriendEntry>
const friendRequestsMap = new Map<string, FriendRequest>(); // reqId -> FriendRequest
const gameInvitesMap = new Map<string, GameInvite>(); // inviteId -> GameInvite
const roomsMap = new Map<string, any>(); // roomId -> Room object

// Active SSE Connections
const sseClients = new Map<string, Set<Response>>();

function broadcastToUser(uid: string, eventType: string, data: any) {
  const clientSet = sseClients.get(uid);
  if (clientSet) {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    clientSet.forEach((res) => {
      try {
        res.write(payload);
      } catch {
        clientSet.delete(res);
      }
    });
  }
}

function broadcastPresenceUpdate() {
  const now = Date.now();
  // Filter out any user that hasn't pinged in 30 seconds
  const onlineList: UserPresence[] = [];
  for (const [uid, user] of activePresences.entries()) {
    if (now - user.lastSeen < 30000 && user.status !== 'offline') {
      onlineList.push(user);
    }
  }

  const payload = `event: presence\ndata: ${JSON.stringify(onlineList)}\n\n`;
  for (const clientSet of sseClients.values()) {
    clientSet.forEach((res) => {
      try {
        res.write(payload);
      } catch {
        clientSet.delete(res);
      }
    });
  }
}

function broadcastRoomUpdate(roomId: string, roomData: any) {
  const payload = `event: room_${roomId}\ndata: ${JSON.stringify(roomData)}\n\n`;
  for (const clientSet of sseClients.values()) {
    clientSet.forEach((res) => {
      try {
        res.write(payload);
      } catch {
        clientSet.delete(res);
      }
    });
  }
}

// Cleanup inactive users every 15s
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [uid, user] of activePresences.entries()) {
    if (now - user.lastSeen > 35000) {
      activePresences.delete(uid);
      changed = true;
    }
  }
  if (changed) {
    broadcastPresenceUpdate();
  }
}, 15000);

// ==========================================================
// API ROUTES
// ==========================================================

// SSE Stream for instant live updates
app.get('/api/events', (req: Request, res: Response) => {
  const uid = String(req.query.uid || '');
  if (!uid) {
    res.status(400).send('Missing uid parameter');
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(uid)) {
    sseClients.set(uid, new Set());
  }
  sseClients.get(uid)!.add(res);

  // Send initial ping
  res.write(`event: connected\ndata: {"status":"connected"}\n\n`);

  req.on('close', () => {
    const set = sseClients.get(uid);
    if (set) {
      set.delete(res);
      if (set.size === 0) {
        sseClients.delete(uid);
      }
    }
  });
});

// 1. Presence & Heartbeat
app.post('/api/presence/heartbeat', (req: Request, res: Response) => {
  const { uid, name, avatar, currentGame, status } = req.body;
  if (!uid) {
    res.status(400).json({ error: 'Missing uid' });
    return;
  }

  const existing = activePresences.get(uid);
  const updated: UserPresence = {
    uid,
    name: name || existing?.name || 'Player',
    avatar: avatar || existing?.avatar || '👾',
    status: status || (currentGame && currentGame !== 'Arcade Hub' ? 'in-game' : 'online'),
    currentGame: currentGame || 'Arcade Hub',
    lastSeen: Date.now(),
  };

  activePresences.set(uid, updated);
  broadcastPresenceUpdate();
  res.json({ success: true });
});

app.post('/api/presence/disconnect', (req: Request, res: Response) => {
  const { uid } = req.body;
  if (uid && activePresences.has(uid)) {
    activePresences.delete(uid);
    broadcastPresenceUpdate();
  }
  res.json({ success: true });
});

app.get('/api/presence/players', (req: Request, res: Response) => {
  const now = Date.now();
  const list: UserPresence[] = [];
  for (const [_, user] of activePresences.entries()) {
    if (now - user.lastSeen < 30000 && user.status !== 'offline') {
      list.push(user);
    }
  }
  res.json(list);
});

// 2. Friend Requests
app.post('/api/friends/request', (req: Request, res: Response) => {
  const { fromUid, fromName, fromAvatar, targetUid } = req.body;
  if (!fromUid || !targetUid) {
    res.status(400).json({ success: false, message: 'Missing sender or recipient ID' });
    return;
  }

  const cleanTarget = String(targetUid).trim();
  const cleanFrom = String(fromUid).trim();

  if (cleanTarget === cleanFrom) {
    res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
    return;
  }

  // Check if already friends
  const myFriends = friendsMap.get(cleanFrom);
  if (myFriends && myFriends.has(cleanTarget)) {
    res.json({ success: true, message: 'You are already friends with this player!' });
    return;
  }

  const reqId = `freq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const friendReq: FriendRequest = {
    id: reqId,
    fromUid: cleanFrom,
    fromName: fromName || 'Player',
    fromAvatar: fromAvatar || '👾',
    targetUid: cleanTarget,
    timestamp: Date.now(),
    status: 'pending',
  };

  friendRequestsMap.set(reqId, friendReq);

  // Notify recipient immediately
  broadcastToUser(cleanTarget, 'friend_request', friendReq);

  res.json({ success: true, message: `Friend request sent successfully to ${cleanTarget}!` });
});

app.get('/api/friends/requests/:uid', (req: Request, res: Response) => {
  const uid = req.params.uid;
  const pending: FriendRequest[] = [];
  for (const [_, reqData] of friendRequestsMap.entries()) {
    if (reqData.targetUid === uid && reqData.status === 'pending') {
      pending.push(reqData);
    }
  }
  res.json(pending);
});

app.post('/api/friends/respond', (req: Request, res: Response) => {
  const { requestId, myUid, myName, myAvatar, accept } = req.body;
  const reqData = friendRequestsMap.get(requestId);

  if (!reqData) {
    res.status(404).json({ success: false, message: 'Request not found' });
    return;
  }

  if (accept) {
    reqData.status = 'accepted';

    // Add to recipient's friend list
    if (!friendsMap.has(myUid)) friendsMap.set(myUid, new Map());
    friendsMap.get(myUid)!.set(reqData.fromUid, {
      uid: reqData.fromUid,
      name: reqData.fromName,
      avatar: reqData.fromAvatar,
      addedAt: Date.now(),
    });

    // Add to sender's friend list
    if (!friendsMap.has(reqData.fromUid)) friendsMap.set(reqData.fromUid, new Map());
    friendsMap.get(reqData.fromUid)!.set(myUid, {
      uid: myUid,
      name: myName || 'Friend',
      avatar: myAvatar || '👾',
      addedAt: Date.now(),
    });

    // Notify sender that request was accepted
    broadcastToUser(reqData.fromUid, 'friend_accepted', {
      friend: { uid: myUid, name: myName, avatar: myAvatar },
    });
  } else {
    reqData.status = 'declined';
  }

  friendRequestsMap.delete(requestId);
  res.json({ success: true });
});

app.get('/api/friends/list/:uid', (req: Request, res: Response) => {
  const uid = req.params.uid;
  const userFriends = friendsMap.get(uid);
  if (!userFriends) {
    res.json([]);
    return;
  }
  res.json(Array.from(userFriends.values()));
});

app.post('/api/friends/remove', (req: Request, res: Response) => {
  const { myUid, friendUid } = req.body;
  if (myUid && friendUid) {
    friendsMap.get(myUid)?.delete(friendUid);
    friendsMap.get(friendUid)?.delete(myUid);
  }
  res.json({ success: true });
});

// 3. Game Invites
app.post('/api/invites/send', (req: Request, res: Response) => {
  const { targetUid, fromUid, fromName, fromAvatar, gameId, gameName, roomId } = req.body;
  if (!targetUid || !fromUid || !roomId) {
    res.status(400).json({ error: 'Missing invite parameters' });
    return;
  }

  const inviteId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const invite: GameInvite = {
    id: inviteId,
    fromUid,
    fromName,
    fromAvatar,
    gameId,
    gameName,
    roomId,
    timestamp: Date.now(),
    status: 'pending',
  };

  gameInvitesMap.set(inviteId, invite);
  broadcastToUser(targetUid, 'game_invite', invite);
  res.json({ success: true, inviteId });
});

app.get('/api/invites/pending/:uid', (req: Request, res: Response) => {
  const uid = req.params.uid;
  const now = Date.now();
  const pending: GameInvite[] = [];

  for (const [_, inv] of gameInvitesMap.entries()) {
    if (inv.status === 'pending' && now - inv.timestamp < 180000) {
      // Find invites for this uid
      // In this format, we can return pending invites targeted to this uid
      pending.push(inv);
    }
  }
  res.json(pending);
});

app.post('/api/invites/respond', (req: Request, res: Response) => {
  const { inviteId, accept } = req.body;
  const inv = gameInvitesMap.get(inviteId);
  if (inv) {
    inv.status = accept ? 'accepted' : 'declined';
    if (!accept) {
      gameInvitesMap.delete(inviteId);
    }
  }
  res.json({ success: true });
});

// 4. Universal Multiplayer Rooms (Tic-Tac-Toe, Pegs, Bridge)
app.post('/api/rooms/create', (req: Request, res: Response) => {
  const { gameType, roomData } = req.body;
  if (!roomData || !roomData.id) {
    res.status(400).json({ error: 'Missing room data' });
    return;
  }
  roomsMap.set(roomData.id, roomData);
  broadcastRoomUpdate(roomData.id, roomData);
  res.json({ success: true, room: roomData });
});

app.get('/api/rooms/:roomId', (req: Request, res: Response) => {
  const roomId = req.params.roomId;
  const room = roomsMap.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json(room);
});

app.post('/api/rooms/update', (req: Request, res: Response) => {
  const { roomId, updates } = req.body;
  const room = roomsMap.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  const updatedRoom = { ...room, ...updates, updatedAt: Date.now() };
  roomsMap.set(roomId, updatedRoom);
  broadcastRoomUpdate(roomId, updatedRoom);
  res.json({ success: true, room: updatedRoom });
});

// ==========================================================
// VITE MIDDLEWARE & SERVER STARTUP
// ==========================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Arcade Real-Time Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
