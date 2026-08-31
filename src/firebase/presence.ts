import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
  onDisconnect,
  DatabaseReference,
  Unsubscribe,
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
  const defaultNames = ['AxiomPro', 'LogicMaster', 'QuantumPawn', 'NexusGamer', 'CyberPilot'];
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
 * Setup Real-time Presence using Firebase Realtime Database
 */
export function setupPresence(
  uid: string,
  name: string,
  avatar: string,
  currentGame = 'Arcade Hub'
): () => void {
  try {
    const userRef = ref(rtdb, `presence/${uid}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        onDisconnect(userRef)
          .update({
            status: 'offline',
            lastSeen: Date.now(),
          })
          .catch(() => {});

        set(userRef, {
          uid,
          name,
          avatar,
          status: currentGame === 'Arcade Hub' ? 'online' : 'in-game',
          currentGame,
          lastSeen: Date.now(),
        }).catch((err) => {
          console.warn('Presence set error:', err);
        });
      }
    });

    // Heartbeat every 15 seconds
    const interval = setInterval(() => {
      update(userRef, {
        lastSeen: Date.now(),
        name,
        avatar,
        status: currentGame === 'Arcade Hub' ? 'online' : 'in-game',
        currentGame,
      }).catch(() => {});
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      update(userRef, {
        status: 'offline',
        lastSeen: Date.now(),
      }).catch(() => {});
    };
  } catch (err) {
    console.warn('setupPresence init error:', err);
    return () => {};
  }
}

/**
 * Updates current game status for the active user
 */
export function updateGameActivity(uid: string, currentGame: string) {
  const profile = getLocalProfile();
  try {
    const userRef = ref(rtdb, `presence/${uid}`);
    update(userRef, {
      name: profile.name,
      avatar: profile.avatar,
      currentGame,
      status: currentGame === 'Arcade Hub' ? 'online' : 'in-game',
      lastSeen: Date.now(),
    }).catch(() => {});
  } catch (err) {
    console.warn('updateGameActivity error:', err);
  }
}

/**
 * Listen to all REAL active online players (ZERO dummy/mock players)
 */
export function listenToAllPlayers(callback: (players: UserPresence[]) => void): Unsubscribe {
  try {
    const presenceRef = ref(rtdb, 'presence');
    return onValue(
      presenceRef,
      (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          callback([]);
          return;
        }

        const now = Date.now();
        const playersList: UserPresence[] = Object.values(data as Record<string, UserPresence>).filter(
          (p) => p && p.uid && p.status !== 'offline' && now - (p.lastSeen || 0) < 45000
        );

        callback(playersList);
      },
      (error) => {
        console.warn('listenToAllPlayers error:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('listenToAllPlayers setup error:', err);
    return () => {};
  }
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
 * Send real-time Friend Request directly via Firebase Realtime Database
 */
export async function sendRealtimeFriendRequest(
  fromUid: string,
  fromName: string,
  fromAvatar: string,
  targetUid: string
): Promise<{ success: boolean; message: string; isPermissionDenied?: boolean }> {
  const cleanTarget = targetUid.trim();
  const cleanFrom = fromUid.trim();

  if (!cleanTarget) {
    return { success: false, message: 'Please enter a valid Gamer ID.' };
  }

  if (cleanFrom === cleanTarget) {
    return { success: false, message: 'You cannot send a friend request to yourself.' };
  }

  try {
    // Generate request ID
    const reqRef = push(ref(rtdb, `friendRequests/${cleanTarget}`));
    const reqId = reqRef.key || `freq_${Date.now()}`;

    const friendReq: FriendRequest = {
      id: reqId,
      fromUid: cleanFrom,
      fromName: fromName || 'Player',
      fromAvatar: fromAvatar || '👾',
      targetUid: cleanTarget,
      timestamp: Date.now(),
      status: 'pending',
    };

    await set(ref(rtdb, `friendRequests/${cleanTarget}/${reqId}`), friendReq);

    return {
      success: true,
      message: `Friend request sent to ${cleanTarget}! They will receive an instant notification.`,
    };
  } catch (err: any) {
    console.error('sendRealtimeFriendRequest error:', err);
    const isPerm = err?.message?.includes('PERMISSION_DENIED') || err?.code === 'PERMISSION_DENIED';
    return {
      success: false,
      isPermissionDenied: isPerm,
      message: isPerm
        ? 'Firebase Realtime Database Permission Denied. Follow the 1-minute setup guide below to enable Database Rules in Firebase Console.'
        : `Failed to send request: ${err?.message || 'Unknown network error'}`,
    };
  }
}

/**
 * Listen for Incoming Friend Requests
 */
export function listenToIncomingFriendRequests(
  myUid: string,
  callback: (requests: FriendRequest[]) => void
): Unsubscribe {
  try {
    const requestsRef = ref(rtdb, `friendRequests/${myUid}`);
    return onValue(
      requestsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          callback([]);
          return;
        }

        const requests: FriendRequest[] = Object.values(data as Record<string, FriendRequest>).filter(
          (r) => r && r.status === 'pending'
        );

        callback(requests);
      },
      (error) => {
        console.warn('listenToIncomingFriendRequests error:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('listenToIncomingFriendRequests setup error:', err);
    return () => {};
  }
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
    if (accept) {
      // 1. Add to my friends list
      await set(ref(rtdb, `userFriends/${myUid}/${request.fromUid}`), {
        uid: request.fromUid,
        name: request.fromName,
        avatar: request.fromAvatar,
        addedAt: Date.now(),
      });

      // 2. Add to sender's friends list
      await set(ref(rtdb, `userFriends/${request.fromUid}/${myUid}`), {
        uid: myUid,
        name: myName,
        avatar: myAvatar,
        addedAt: Date.now(),
      });

      // Cache locally
      const current = getLocalFriends();
      if (!current.includes(request.fromUid)) {
        saveLocalFriends([...current, request.fromUid]);
      }
    }

    // 3. Remove the request
    await remove(ref(rtdb, `friendRequests/${myUid}/${request.id}`));
  } catch (err) {
    console.error('respondToFriendRequest error:', err);
  }
}

/**
 * Listen to User's Global Friends
 */
export function listenToUserFriends(
  myUid: string,
  callback: (friends: FriendEntry[]) => void
): Unsubscribe {
  try {
    const friendsRef = ref(rtdb, `userFriends/${myUid}`);
    return onValue(
      friendsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          callback([]);
          return;
        }

        const list: FriendEntry[] = Object.values(data as Record<string, FriendEntry>).filter(
          (f) => f && f.uid
        );

        saveLocalFriends(list.map((f) => f.uid));
        callback(list);
      },
      (error) => {
        console.warn('listenToUserFriends error:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('listenToUserFriends setup error:', err);
    return () => {};
  }
}

/**
 * Remove / Unfriend Globally
 */
export async function removeFriendGlobally(myUid: string, friendUid: string) {
  try {
    await remove(ref(rtdb, `userFriends/${myUid}/${friendUid}`));
    await remove(ref(rtdb, `userFriends/${friendUid}/${myUid}`));
    const current = getLocalFriends().filter((id) => id !== friendUid);
    saveLocalFriends(current);
  } catch (err) {
    console.error('removeFriendGlobally error:', err);
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
): Promise<{ success: boolean; inviteId?: string; isPermissionDenied?: boolean; message?: string }> {
  try {
    const invitesRef = ref(rtdb, `gameInvites/${targetUid}`);
    const newInvRef = push(invitesRef);
    const inviteId = newInvRef.key || `inv_${Date.now()}`;

    const newInvite: GameInvite = {
      ...invite,
      id: inviteId,
      timestamp: Date.now(),
      status: 'pending',
    };

    await set(ref(rtdb, `gameInvites/${targetUid}/${inviteId}`), newInvite);
    return { success: true, inviteId };
  } catch (err: any) {
    console.error('sendGameInvite error:', err);
    const isPerm = err?.message?.includes('PERMISSION_DENIED') || err?.code === 'PERMISSION_DENIED';
    return {
      success: false,
      isPermissionDenied: isPerm,
      message: isPerm
        ? 'Firebase Realtime Database Permission Denied. Follow setup guide to enable rules in Firebase Console.'
        : `Failed to send invite: ${err?.message || 'Error'}`,
    };
  }
}

/**
 * Listen for incoming game invites for current user
 */
export function listenForIncomingInvites(
  myUid: string,
  callback: (invites: GameInvite[]) => void
): Unsubscribe {
  try {
    const invitesRef = ref(rtdb, `gameInvites/${myUid}`);
    return onValue(
      invitesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          callback([]);
          return;
        }

        const now = Date.now();
        const active: GameInvite[] = Object.values(data as Record<string, GameInvite>).filter(
          (inv) => inv && inv.status === 'pending' && now - (inv.timestamp || now) < 180000
        );

        callback(active);
      },
      (error) => {
        console.warn('listenForIncomingInvites error:', error);
        callback([]);
      }
    );
  } catch (err) {
    console.warn('listenForIncomingInvites setup error:', err);
    return () => {};
  }
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
    if (status === 'accepted') {
      await update(ref(rtdb, `gameInvites/${myUid}/${inviteId}`), { status: 'accepted' });
    } else {
      await remove(ref(rtdb, `gameInvites/${myUid}/${inviteId}`));
    }
  } catch (err) {
    console.error('respondToInvite error:', err);
  }
}
