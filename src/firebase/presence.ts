export interface UserPresence {
  uid: string;
  name: string;
  avatar: string;
  status: 'online' | 'in-game' | 'offline';
  currentGame?: string;
  lastSeen: number;
}

export interface GameInvite {
  id: string;
  fromUid: string;
  fromName: string;
  fromAvatar: string;
  gameId: 'tictactoe' | 'pegs' | 'bridge';
  gameName: string;
  roomId: string;
  levelIndex?: number;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromAvatar: string;
  targetUid: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

export interface FriendEntry {
  uid: string;
  name: string;
  avatar: string;
  addedAt: number;
}

export const AVATAR_OPTIONS = ['👾', '🤖', '🦊', '⚡', '🐉', '🎯', '🚀', '⭐', '🧠', '🎲', '👑', '🔥'];

// Local profile caching
const LOCAL_PROFILE_KEY = 'axiom_user_profile';

export function getLocalProfile(): { name: string; avatar: string } {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name && parsed.avatar) return parsed;
    }
  } catch {
    // Ignore error
  }
  const defaultNames = ['Player', 'Player_Ace', 'CyberPlayer', 'Gamer'];
  const randomName = defaultNames[Math.floor(Math.random() * defaultNames.length)] + '_' + Math.floor(100 + Math.random() * 900);
  const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
  const profile = { name: randomName, avatar: randomAvatar };
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function saveLocalProfile(name: string, avatar: string) {
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify({ name, avatar }));
}

// ==========================================================
// SSE EVENT STREAM CLIENT
// ==========================================================

let sseEventSource: EventSource | null = null;
let currentSseUid: string | null = null;
const friendReqCallbacks = new Set<(reqs: FriendRequest[]) => void>();
const inviteCallbacks = new Set<(invites: GameInvite[]) => void>();
const presenceCallbacks = new Set<(players: UserPresence[]) => void>();
const friendsListCallbacks = new Set<(friends: FriendEntry[]) => void>();

function getEventSource(uid: string): EventSource {
  if (sseEventSource && currentSseUid === uid) {
    return sseEventSource;
  }
  if (sseEventSource) {
    sseEventSource.close();
  }

  currentSseUid = uid;
  const es = new EventSource(`/api/events?uid=${encodeURIComponent(uid)}`);
  sseEventSource = es;

  es.addEventListener('friend_request', (e) => {
    try {
      const data = JSON.parse(e.data);
      // Fetch latest requests
      fetch(`/api/friends/requests/${encodeURIComponent(uid)}`)
        .then((res) => res.json())
        .then((reqs) => {
          friendReqCallbacks.forEach((cb) => cb(reqs));
        })
        .catch(() => {});
    } catch {
      // ignore
    }
  });

  es.addEventListener('game_invite', (e) => {
    try {
      const invite = JSON.parse(e.data);
      inviteCallbacks.forEach((cb) => cb([invite]));
    } catch {
      // ignore
    }
  });

  es.addEventListener('presence', (e) => {
    try {
      const players = JSON.parse(e.data);
      presenceCallbacks.forEach((cb) => cb(players));
    } catch {
      // ignore
    }
  });

  es.addEventListener('friend_accepted', () => {
    fetch(`/api/friends/list/${encodeURIComponent(uid)}`)
      .then((res) => res.json())
      .then((list) => {
        friendsListCallbacks.forEach((cb) => cb(list));
      })
      .catch(() => {});
  });

  return es;
}

/**
 * Sets up online presence listeners with Real-Time Server
 */
export function setupPresence(
  uid: string,
  name: string,
  avatar: string,
  currentGame = 'Arcade Hub'
) {
  getEventSource(uid);

  // Send initial heartbeat
  const sendHeartbeat = () => {
    fetch('/api/presence/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        name,
        avatar,
        currentGame,
        status: currentGame === 'Arcade Hub' ? 'online' : 'in-game',
      }),
    }).catch(() => {});
  };

  sendHeartbeat();
  const interval = setInterval(sendHeartbeat, 10000);

  const handleUnload = () => {
    navigator.sendBeacon(
      '/api/presence/disconnect',
      JSON.stringify({ uid })
    );
  };

  window.addEventListener('beforeunload', handleUnload);

  return () => {
    clearInterval(interval);
    window.removeEventListener('beforeunload', handleUnload);
    fetch('/api/presence/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    }).catch(() => {});
  };
}

/**
 * Updates current game status for the active user
 */
export function updateGameActivity(uid: string, currentGame: string) {
  const profile = getLocalProfile();
  fetch('/api/presence/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid,
      name: profile.name,
      avatar: profile.avatar,
      currentGame,
      status: currentGame === 'Arcade Hub' ? 'online' : 'in-game',
    }),
  }).catch(() => {});
}

/**
 * Listen to all real active online players (ZERO dummy/stale players)
 */
export function listenToAllPlayers(callback: (players: UserPresence[]) => void) {
  presenceCallbacks.add(callback);

  const fetchPlayers = () => {
    fetch('/api/presence/players')
      .then((res) => res.json())
      .then((data: UserPresence[]) => {
        if (Array.isArray(data)) {
          callback(data);
        }
      })
      .catch(() => {});
  };

  fetchPlayers();
  const timer = setInterval(fetchPlayers, 4000);

  return () => {
    presenceCallbacks.delete(callback);
    clearInterval(timer);
  };
}

// ==========================================================
// REAL-TIME GLOBAL FRIENDS & FRIEND REQUEST SYSTEM
// ==========================================================

const FRIENDS_LOCAL_KEY = 'axiom_friends_list_v2';

export function getLocalFriends(): string[] {
  try {
    const raw = localStorage.getItem(FRIENDS_LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalFriends(uids: string[]) {
  try {
    localStorage.setItem(FRIENDS_LOCAL_KEY, JSON.stringify(uids));
  } catch {
    // ignore
  }
}

/**
 * Send real-time Friend Request - 100% reliable server API
 */
export async function sendRealtimeFriendRequest(
  fromUid: string,
  fromName: string,
  fromAvatar: string,
  targetUid: string
): Promise<{ success: boolean; message: string }> {
  const cleanTarget = targetUid.trim();
  const cleanFrom = fromUid.trim();

  if (cleanFrom === cleanTarget) {
    return { success: false, message: 'You cannot send a friend request to yourself.' };
  }

  try {
    const res = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUid: cleanFrom,
        fromName,
        fromAvatar,
        targetUid: cleanTarget,
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: data.message || `Friend request sent to ${cleanTarget}!` };
    } else {
      return { success: false, message: data.message || 'Failed to send friend request.' };
    }
  } catch (err: any) {
    return { success: false, message: 'Connection error: ' + (err.message || 'Server unreachable') };
  }
}

/**
 * Listen for Incoming Friend Requests
 */
export function listenToIncomingFriendRequests(
  myUid: string,
  callback: (requests: FriendRequest[]) => void
) {
  friendReqCallbacks.add(callback);
  getEventSource(myUid);

  const fetchRequests = () => {
    fetch(`/api/friends/requests/${encodeURIComponent(myUid)}`)
      .then((res) => res.json())
      .then((data: FriendRequest[]) => {
        if (Array.isArray(data)) {
          callback(data);
        }
      })
      .catch(() => {});
  };

  fetchRequests();
  const timer = setInterval(fetchRequests, 3000);

  return () => {
    friendReqCallbacks.delete(callback);
    clearInterval(timer);
  };
}

/**
 * Respond to Friend Request (Accept or Decline)
 */
export async function respondToFriendRequest(
  myUid: string,
  myName: string,
  myAvatar: string,
  request: FriendRequest,
  accept: boolean
) {
  try {
    const res = await fetch('/api/friends/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: request.id,
        myUid,
        myName,
        myAvatar,
        accept,
      }),
    });

    if (accept) {
      const current = getLocalFriends();
      if (!current.includes(request.fromUid)) {
        saveLocalFriends([...current, request.fromUid]);
      }
    }
    return await res.json();
  } catch (err) {
    console.error('Error responding to request:', err);
  }
}

/**
 * Listen to User's Global Friends (Real friends only)
 */
export function listenToUserFriends(
  myUid: string,
  callback: (friends: FriendEntry[]) => void
) {
  friendsListCallbacks.add(callback);

  const fetchFriends = () => {
    fetch(`/api/friends/list/${encodeURIComponent(myUid)}`)
      .then((res) => res.json())
      .then((list: FriendEntry[]) => {
        if (Array.isArray(list)) {
          saveLocalFriends(list.map((f) => f.uid));
          callback(list);
        }
      })
      .catch(() => {});
  };

  fetchFriends();
  const timer = setInterval(fetchFriends, 4000);

  return () => {
    friendsListCallbacks.delete(callback);
    clearInterval(timer);
  };
}

/**
 * Remove / Unfriend
 */
export async function removeFriendGlobally(myUid: string, friendUid: string) {
  try {
    await fetch('/api/friends/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ myUid, friendUid }),
    });
    const current = getLocalFriends().filter((id) => id !== friendUid);
    saveLocalFriends(current);
  } catch (err) {
    console.error('Error removing friend:', err);
  }
}

// ==========================================================
// REAL-TIME GAME INVITATIONS
// ==========================================================

/**
 * Send real-time Game Invite to an online friend
 */
export async function sendGameInvite(
  targetUid: string,
  invite: Omit<GameInvite, 'id' | 'timestamp' | 'status'>
) {
  try {
    const res = await fetch('/api/invites/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUid,
        ...invite,
      }),
    });
    const data = await res.json();
    return data.inviteId;
  } catch (err) {
    console.error('Error sending invite:', err);
  }
}

/**
 * Listen for incoming game invites for current user
 */
export function listenForIncomingInvites(
  myUid: string,
  callback: (invites: GameInvite[]) => void
) {
  inviteCallbacks.add(callback);
  getEventSource(myUid);

  const fetchInvites = () => {
    fetch(`/api/invites/pending/${encodeURIComponent(myUid)}`)
      .then((res) => res.json())
      .then((data: GameInvite[]) => {
        if (Array.isArray(data)) {
          const now = Date.now();
          const active = data.filter((i) => i.status === 'pending' && now - (i.timestamp || now) < 180000);
          callback(active);
        }
      })
      .catch(() => {});
  };

  fetchInvites();
  const timer = setInterval(fetchInvites, 3000);

  return () => {
    inviteCallbacks.delete(callback);
    clearInterval(timer);
  };
}

/**
 * Accept or decline an invite
 */
export async function respondToInvite(
  myUid: string,
  inviteId: string,
  status: 'accepted' | 'declined'
) {
  try {
    await fetch('/api/invites/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        myUid,
        inviteId,
        accept: status === 'accepted',
      }),
    });
  } catch (err) {
    console.error('Error responding to invite:', err);
  }
}
