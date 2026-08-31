import {
  ref,
  onValue,
  set,
  get,
  update,
  onDisconnect,
  serverTimestamp,
  remove,
  push,
} from 'firebase/database';
import { rtdb } from './config';

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
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

export const AVATAR_OPTIONS = ['👾', '🤖', '🦊', '⚡', '🐉', '🎯', '🚀', '⭐', '🧠', '🎲'];

// Local profile caching
const LOCAL_PROFILE_KEY = 'axiom_user_profile';

export function getLocalProfile(): { name: string; avatar: string } {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore error
  }
  const defaultNames = ['AxiomPro', 'CyberAce', 'LogicMaster', 'QuantumPawn', 'NexusKnight', 'TorchRunner'];
  const randomName = defaultNames[Math.floor(Math.random() * defaultNames.length)] + '_' + Math.floor(100 + Math.random() * 900);
  const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
  const profile = { name: randomName, avatar: randomAvatar };
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function saveLocalProfile(name: string, avatar: string) {
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify({ name, avatar }));
}

/**
 * Sets up online presence listeners with Firebase RTDB
 */
export function setupPresence(
  uid: string,
  name: string,
  avatar: string,
  currentGame = 'Arcade Hub'
) {
  const userStatusRef = ref(rtdb, `/presence/${uid}`);
  const connectedRef = ref(rtdb, '.info/connected');

  const presenceData: UserPresence = {
    uid,
    name,
    avatar,
    status: currentGame === 'Arcade Hub' ? 'online' : 'in-game',
    currentGame,
    lastSeen: Date.now(),
  };

  const unsubscribe = onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      // Set onDisconnect handler
      onDisconnect(userStatusRef).set({
        uid,
        name,
        avatar,
        status: 'offline',
        currentGame: '',
        lastSeen: serverTimestamp(),
      });

      // Mark online immediately
      set(userStatusRef, {
        ...presenceData,
        lastSeen: serverTimestamp(),
      });
    }
  });

  return () => {
    unsubscribe();
    set(userStatusRef, {
      uid,
      name,
      avatar,
      status: 'offline',
      currentGame: '',
      lastSeen: Date.now(),
    });
  };
}

/**
 * Updates current game status for the active user
 */
export function updateGameActivity(uid: string, currentGame: string) {
  const userStatusRef = ref(rtdb, `/presence/${uid}`);
  update(userStatusRef, {
    status: currentGame === 'Arcade Hub' ? 'online' : 'in-game',
    currentGame,
    lastSeen: serverTimestamp(),
  });
}

/**
 * Listen to all online/recent players
 */
export function listenToAllPlayers(callback: (players: UserPresence[]) => void) {
  const presenceRef = ref(rtdb, '/presence');
  return onValue(presenceRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const playersMap = new Map<string, UserPresence>();
    Object.entries(data).forEach(([key, val]: [string, any]) => {
      if (!val) return;
      const uid = val.uid || key;
      if (!uid) return;
      playersMap.set(uid, {
        uid,
        name: val.name || 'Player',
        avatar: val.avatar || '👾',
        status: val.status || 'offline',
        currentGame: val.currentGame || '',
        lastSeen: typeof val.lastSeen === 'number' ? val.lastSeen : Date.now(),
      });
    });
    callback(Array.from(playersMap.values()));
  });
}

/**
 * Friend list management stored per user
 */
const FRIENDS_KEY = 'axiom_friends_list';

export function getLocalFriends(): string[] {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLocalFriend(uid: string) {
  const list = getLocalFriends();
  if (!list.includes(uid)) {
    list.push(uid);
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(list));
  }
}

export function removeLocalFriend(uid: string) {
  const list = getLocalFriends().filter((id) => id !== uid);
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(list));
}

/**
 * Send real-time Game Invite to an online friend
 */
export async function sendGameInvite(
  targetUid: string,
  invite: Omit<GameInvite, 'id' | 'timestamp' | 'status'>
) {
  const inviteRef = ref(rtdb, `/invites/${targetUid}`);
  const newInviteRef = push(inviteRef);
  await set(newInviteRef, {
    ...invite,
    id: newInviteRef.key,
    timestamp: serverTimestamp(),
    status: 'pending',
  });
  return newInviteRef.key;
}

/**
 * Listen for incoming game invites for current user
 */
export function listenForIncomingInvites(
  myUid: string,
  callback: (invites: GameInvite[]) => void
) {
  const myInvitesRef = ref(rtdb, `/invites/${myUid}`);
  return onValue(myInvitesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const list: GameInvite[] = Object.entries(data).map(([key, val]: [string, any]) => ({
      ...val,
      id: key,
    }));
    // Only return pending recent invites (last 2 minutes)
    const now = Date.now();
    const activeInvites = list.filter(
      (inv) => inv.status === 'pending' && (now - (inv.timestamp || now)) < 120000
    );
    callback(activeInvites);
  });
}

/**
 * Accept or decline an invite
 */
export async function respondToInvite(
  myUid: string,
  inviteId: string,
  status: 'accepted' | 'declined'
) {
  const targetRef = ref(rtdb, `/invites/${myUid}/${inviteId}`);
  if (status === 'declined') {
    await remove(targetRef);
  } else {
    await update(targetRef, { status: 'accepted' });
    // Remove after short delay
    setTimeout(() => {
      remove(targetRef).catch(() => {});
    }, 5000);
  }
}
