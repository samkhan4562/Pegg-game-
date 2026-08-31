import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  UserCheck,
  Gamepad2,
  Clock,
  Send,
  X,
  Copy,
  Check,
  Edit2,
  Sparkles,
  Circle,
  Radio,
  Search,
  Swords,
  Trash2,
  ChevronDown,
  Shield,
  Zap,
} from 'lucide-react';
import {
  UserPresence,
  FriendRequest,
  FriendEntry,
  listenToAllPlayers,
  listenToIncomingFriendRequests,
  listenToUserFriends,
  sendRealtimeFriendRequest,
  respondToFriendRequest,
  removeFriendGlobally,
  getLocalProfile,
  saveLocalProfile,
  sendGameInvite,
  AVATAR_OPTIONS,
} from '../firebase/presence';
import {
  createTicTacToeRoom,
  createPegsRoom,
  createBridgeRoom,
} from '../firebase/multiplayer';
import { LEVELS } from '../data/levels';
import { BRIDGE_LEVELS } from '../data/bridgeLevels';
import { sound } from '../audio/soundEffects';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  myUid: string;
  onLaunchGameWithRoom?: (gameId: string, roomId: string) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  myUid,
  onLaunchGameWithRoom,
}) => {
  const [profile, setProfile] = useState(getLocalProfile());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);

  const [allPlayers, setAllPlayers] = useState<UserPresence[]>([]);
  const [friendsList, setFriendsList] = useState<FriendEntry[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'online' | 'add'>('friends');
  const [searchId, setSearchId] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [invitingUid, setInvitingUid] = useState<string | null>(null);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [requestFeedback, setRequestFeedback] = useState<{ msg: string; error?: boolean; isPermissionDenied?: boolean } | null>(null);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [gameSelectForPlayer, setGameSelectForPlayer] = useState<string | null>(null);

  const FIREBASE_RULES_SNIPPET = `{
  "rules": {
    ".read": true,
    ".write": true
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIREBASE_RULES_SNIPPET);
    setCopiedRules(true);
    sound.playSelect();
    setTimeout(() => setCopiedRules(false), 2500);
  };

  // Subscribe to all players online / presence
  useEffect(() => {
    if (!isOpen) return;
    const unsubPlayers = listenToAllPlayers((players) => {
      setAllPlayers(players);
    });
    const unsubRequests = listenToIncomingFriendRequests(myUid, (reqs) => {
      setIncomingRequests(reqs);
    });
    const unsubFriends = listenToUserFriends(myUid, (friends) => {
      setFriendsList(friends);
    });

    return () => {
      unsubPlayers();
      unsubRequests();
      unsubFriends();
    };
  }, [isOpen, myUid]);

  const handleSaveProfile = () => {
    if (!editName.trim()) return;
    saveLocalProfile(editName.trim(), editAvatar);
    setProfile({ name: editName.trim(), avatar: editAvatar });
    setIsEditingProfile(false);
    sound.playSelect();
  };

  const handleCopyMyId = () => {
    navigator.clipboard.writeText(myUid);
    setCopiedId(true);
    sound.playSelect();
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSendFriendRequest = async (targetUid: string) => {
    const clean = targetUid.trim();
    if (!clean) return;
    try {
      sound.playSelect();
      const res = await sendRealtimeFriendRequest(myUid, profile.name, profile.avatar, clean);
      setRequestFeedback({
        msg: res.message,
        error: !res.success,
        isPermissionDenied: res.isPermissionDenied,
      });
      if (res.isPermissionDenied) {
        setShowFirebaseGuide(true);
      }
      if (res.success) {
        setSearchId('');
        setTimeout(() => setRequestFeedback(null), 5000);
      }
    } catch (err: any) {
      setRequestFeedback({
        msg: 'Failed to send request: ' + err.message,
        error: true,
      });
    }
  };

  const handleAcceptRequest = async (req: FriendRequest) => {
    try {
      sound.playWin();
      await respondToFriendRequest(myUid, profile.name, profile.avatar, req, true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineRequest = async (req: FriendRequest) => {
    try {
      sound.playSelect();
      await respondToFriendRequest(myUid, profile.name, profile.avatar, req, false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFriend = async (friendUid: string) => {
    sound.playSelect();
    await removeFriendGlobally(myUid, friendUid);
  };

  // Launch and Invite to Game
  const handleInviteToGame = async (
    targetPlayer: { uid: string; name: string; avatar: string },
    gameId: 'tictactoe' | 'pegs' | 'bridge'
  ) => {
    try {
      sound.playSelect();
      setInvitingUid(targetPlayer.uid);
      setGameSelectForPlayer(null);

      let roomId = '';
      let gameTitle = '';

      if (gameId === 'tictactoe') {
        const room = await createTicTacToeRoom({
          uid: myUid,
          name: profile.name,
          avatar: profile.avatar,
        });
        roomId = room.id;
        gameTitle = 'Tic-Tac-Toe Pro (कांटा और ज़ीरो)';
      } else if (gameId === 'pegs') {
        const firstLevel = LEVELS[0];
        const room = await createPegsRoom(
          { uid: myUid, name: profile.name, avatar: profile.avatar },
          0,
          firstLevel.pegs,
          firstLevel.target
        );
        roomId = room.id;
        gameTitle = 'The Jumping Pegs 3D';
      } else if (gameId === 'bridge') {
        const firstLevel = BRIDGE_LEVELS[0];
        const room = await createBridgeRoom(
          { uid: myUid, name: profile.name, avatar: profile.avatar },
          0,
          firstLevel.travelers
        );
        roomId = room.id;
        gameTitle = 'Midnight Bridge & Torch';
      }

      // Send real-time invite
      await sendGameInvite(targetPlayer.uid, {
        fromUid: myUid,
        fromName: profile.name,
        fromAvatar: profile.avatar,
        gameId,
        gameName: gameTitle,
        roomId,
      });

      setInviteSuccessMsg(`Invite sent to ${targetPlayer.name}! Launching room...`);
      setTimeout(() => {
        setInvitingUid(null);
        setInviteSuccessMsg(null);
        onClose();
        if (onLaunchGameWithRoom) {
          onLaunchGameWithRoom(gameId, roomId);
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to send invite:', err);
      setInvitingUid(null);
    }
  };

  const formatLastSeen = (timestamp: number) => {
    if (!timestamp) return 'Recently';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Map online players & unique players
  const playerPresenceMap = new Map<string, UserPresence>();
  allPlayers.forEach((p) => {
    if (p && p.uid) {
      playerPresenceMap.set(p.uid, p);
    }
  });

  const friendUids = friendsList.map((f) => f.uid);
  const otherPlayers = allPlayers.filter((p) => p.uid !== myUid && (p.status === 'online' || p.status === 'in-game'));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        key="friends-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans"
      >
        <motion.div
          key="friends-modal-panel"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Global Friends &amp; Multiplayer
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                    LIVE
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Connect, send requests &amp; play all 3 games in real-time
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Profile Bar */}
          <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl p-1 bg-slate-800 rounded-2xl border border-slate-700">
                {profile.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{profile.name}</span>
                  <button
                    onClick={() => {
                      setEditName(profile.name);
                      setEditAvatar(profile.avatar);
                      setIsEditingProfile(!isEditingProfile);
                    }}
                    className="text-slate-400 hover:text-cyan-400 transition-colors p-1 cursor-pointer"
                    title="Edit Profile"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {myUid.substring(0, 10)}...
                  </span>
                  <button
                    onClick={handleCopyMyId}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedId ? (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Check size={11} /> Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <Copy size={11} /> Copy My ID
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </div>
          </div>

          {/* Edit Profile Drawer */}
          {isEditingProfile && (
            <div className="p-4 bg-slate-900 border-b border-slate-800 animate-fade-in">
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Choose Avatar &amp; Nickname
              </label>
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {AVATAR_OPTIONS.map((av, idx) => (
                  <button
                    key={`avatar-opt-${av}-${idx}`}
                    onClick={() => setEditAvatar(av)}
                    className={`text-2xl p-2 rounded-xl border transition-all ${
                      editAvatar === av
                        ? 'bg-cyan-500/20 border-cyan-400 scale-105'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={18}
                  placeholder="Enter your nickname"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Alert / Feedback message */}
          {requestFeedback && (
            <div
              className={`p-3 text-xs font-semibold text-center border-b ${
                requestFeedback.error
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {requestFeedback.msg}
            </div>
          )}

          {inviteSuccessMsg && (
            <div className="p-3 bg-cyan-500/20 border-b border-cyan-500/40 text-cyan-300 text-xs font-semibold text-center animate-pulse">
              {inviteSuccessMsg}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 pb-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'friends'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck size={15} />
              <span>Friends</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {friendsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 pb-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer relative ${
                activeTab === 'requests'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus size={15} />
              <span>Requests</span>
              {incomingRequests.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black animate-pulse">
                  {incomingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('online')}
              className={`flex-1 pb-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'online'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio size={15} />
              <span>Online ({otherPlayers.filter((p) => p.status !== 'offline').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 pb-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'add'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search size={15} />
              <span>Add ID</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px]">
            {/* 1. FRIENDS TAB */}
            {activeTab === 'friends' && (
              <>
                {friendsList.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-3">
                      <Users size={22} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-300">No Friends Yet</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Send a real-time friend request to online players or enter their Gamer ID.
                    </p>
                    <button
                      onClick={() => setActiveTab('online')}
                      className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-colors cursor-pointer"
                    >
                      Browse Online Players
                    </button>
                  </div>
                ) : (
                  friendsList.map((friend, idx) => {
                    const presence = playerPresenceMap.get(friend.uid);
                    const isOnline = presence?.status === 'online' || presence?.status === 'in-game';
                    const currentGame = presence?.currentGame || '';
                    const isGameMenuOpen = gameSelectForPlayer === friend.uid;

                    return (
                      <div
                        key={`friend-card-${friend.uid || idx}-${idx}`}
                        className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5 transition-all hover:border-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="text-2xl p-1 bg-slate-800 rounded-xl border border-slate-700">
                                {presence?.avatar || friend.avatar || '👾'}
                              </div>
                              <span
                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 ${
                                  isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-sm">
                                  {presence?.name || friend.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold">
                                  Friend
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                {isOnline ? (
                                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {currentGame || 'Online in Arcade'}
                                  </span>
                                ) : (
                                  <span>Last seen: {formatLastSeen(presence?.lastSeen || friend.addedAt)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setGameSelectForPlayer(isGameMenuOpen ? null : friend.uid)}
                              disabled={invitingUid === friend.uid}
                              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              <Gamepad2 size={14} />
                              <span>Play Together</span>
                              <ChevronDown size={12} className={isGameMenuOpen ? 'rotate-180' : ''} />
                            </button>

                            <button
                              onClick={() => handleRemoveFriend(friend.uid)}
                              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Remove Friend"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Dropdown Game Selection */}
                        {isGameMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2"
                          >
                            <button
                              onClick={() =>
                                handleInviteToGame(
                                  { uid: friend.uid, name: friend.name, avatar: friend.avatar },
                                  'pegs'
                                )
                              }
                              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left hover:border-cyan-500/50 transition-all cursor-pointer"
                            >
                              <div className="text-[11px] font-bold text-cyan-400">Jumping Pegs 3D</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">2-Player Turn Co-op</div>
                            </button>

                            <button
                              onClick={() =>
                                handleInviteToGame(
                                  { uid: friend.uid, name: friend.name, avatar: friend.avatar },
                                  'bridge'
                                )
                              }
                              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left hover:border-amber-500/50 transition-all cursor-pointer"
                            >
                              <div className="text-[11px] font-bold text-amber-400">Midnight Bridge</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Torch Crossing Duel</div>
                            </button>

                            <button
                              onClick={() =>
                                handleInviteToGame(
                                  { uid: friend.uid, name: friend.name, avatar: friend.avatar },
                                  'tictactoe'
                                )
                              }
                              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left hover:border-emerald-500/50 transition-all cursor-pointer"
                            >
                              <div className="text-[11px] font-bold text-emerald-400">Tic-Tac-Toe Pro</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">कांटा और ज़ीरो 1v1</div>
                            </button>
                          </motion.div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* 2. REQUESTS TAB */}
            {activeTab === 'requests' && (
              <>
                {incomingRequests.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-3">
                      <UserPlus size={22} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-300">No Pending Requests</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      When someone sends you a friend request, it will appear here in real-time.
                    </p>
                  </div>
                ) : (
                  incomingRequests.map((req, idx) => (
                    <div
                      key={`incoming-req-${req.id || idx}`}
                      className="bg-slate-950/70 border border-amber-500/40 rounded-2xl p-3.5 flex items-center justify-between shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl p-1 bg-slate-800 rounded-xl border border-slate-700">
                          {req.fromAvatar || '👾'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{req.fromName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                              Pending Request
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Sent {formatLastSeen(req.timestamp)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptRequest(req)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
                        >
                          <Check size={14} />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <X size={14} />
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* 3. ACTIVE ONLINE PLAYERS TAB */}
            {activeTab === 'online' && (
              <>
                {otherPlayers.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-400">
                      No other active players detected right now. Share the room code with a friend!
                    </p>
                  </div>
                ) : (
                  otherPlayers.map((player, idx) => {
                    const isFriend = friendUids.includes(player.uid);
                    const isGameMenuOpen = gameSelectForPlayer === player.uid;

                    return (
                      <div
                        key={`online-card-${player.uid || idx}-${idx}`}
                        className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5 transition-all hover:border-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="text-2xl p-1 bg-slate-800 rounded-xl border border-slate-700">
                                {player.avatar || '👾'}
                              </div>
                              <span
                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 ${
                                  player.status === 'online' || player.status === 'in-game'
                                    ? 'bg-emerald-400'
                                    : 'bg-slate-600'
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-sm">{player.name}</span>
                                {isFriend && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold">
                                    Friend
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                {player.status === 'online' || player.status === 'in-game' ? (
                                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {player.currentGame || 'Online in Arcade'}
                                  </span>
                                ) : (
                                  <span>Last seen {formatLastSeen(player.lastSeen)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isFriend ? (
                              <button
                                onClick={() => setGameSelectForPlayer(isGameMenuOpen ? null : player.uid)}
                                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
                              >
                                <Gamepad2 size={14} />
                                Invite
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSendFriendRequest(player.uid)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <UserPlus size={14} />
                                Add Friend
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dropdown Game Selection for online player */}
                        {isGameMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2"
                          >
                            <button
                              onClick={() =>
                                handleInviteToGame(
                                  { uid: player.uid, name: player.name, avatar: player.avatar },
                                  'pegs'
                                )
                              }
                              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left hover:border-cyan-500/50 transition-all cursor-pointer"
                            >
                              <div className="text-[11px] font-bold text-cyan-400">Jumping Pegs 3D</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">2-Player Turn Co-op</div>
                            </button>

                            <button
                              onClick={() =>
                                handleInviteToGame(
                                  { uid: player.uid, name: player.name, avatar: player.avatar },
                                  'bridge'
                                )
                              }
                              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left hover:border-amber-500/50 transition-all cursor-pointer"
                            >
                              <div className="text-[11px] font-bold text-amber-400">Midnight Bridge</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Torch Crossing Duel</div>
                            </button>

                            <button
                              onClick={() =>
                                handleInviteToGame(
                                  { uid: player.uid, name: player.name, avatar: player.avatar },
                                  'tictactoe'
                                )
                              }
                              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left hover:border-emerald-500/50 transition-all cursor-pointer"
                            >
                              <div className="text-[11px] font-bold text-emerald-400">Tic-Tac-Toe Pro</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">कांटा और ज़ीरो 1v1</div>
                            </button>
                          </motion.div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* 4. ADD FRIEND BY ID TAB */}
            {activeTab === 'add' && (
              <div className="p-2 space-y-4">
                {/* Search Gamer ID */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    Enter Friend's Gamer ID:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      placeholder="e.g. usr_8k9a2... or paste ID"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={() => handleSendFriendRequest(searchId)}
                      disabled={!searchId.trim()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Send size={13} />
                      Send Request
                    </button>
                  </div>
                </div>

                {/* My ID Quick Share Card */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="text-xl p-1 bg-slate-800 rounded-xl">{profile.avatar}</div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-semibold">Your Gamer ID:</div>
                      <div className="text-xs font-mono font-bold text-cyan-300">{myUid}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyMyId}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedId ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                {/* Firebase Permission Guide Box */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <Shield size={16} />
                      <span>Firebase Realtime Database Setup (यदि Permission Denied आए)</span>
                    </div>
                    <button
                      onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-0.5"
                    >
                      {showFirebaseGuide ? 'Hide Guide' : 'View Fix Steps'}
                      <ChevronDown size={14} className={`transform transition-transform ${showFirebaseGuide ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    अगर आपको <code className="text-rose-400 font-mono">PERMISSION_DENIED</code> एरर आता है, तो इसका मतलब आपके Firebase Realtime Database में Rules लॉक हैं। इसे ठीक करने के लिए नीचे दिए गए 2 आसान स्टेप्स करें:
                  </p>

                  {showFirebaseGuide && (
                    <div className="space-y-3 pt-2 border-t border-slate-800 text-xs text-slate-300">
                      <div className="space-y-1">
                        <span className="font-bold text-cyan-400">Step 1: Firebase Console में Rules बदलें</span>
                        <p className="text-[11px] text-slate-400">
                          1. <strong className="text-white">console.firebase.google.com</strong> पर जाएं और प्रोजेक्ट <strong>pagg-game</strong> खोलें।<br />
                          2. Left Sidebar में <strong>Build &gt; Realtime Database</strong> &gt; <strong>Rules</strong> टैब पर जाएं।<br />
                          3. Rules में नीचे दिया गया कोड पेस्ट करके <strong>Publish</strong> दबाएं:
                        </p>
                        <div className="relative mt-2">
                          <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                            {FIREBASE_RULES_SNIPPET}
                          </pre>
                          <button
                            onClick={handleCopyRules}
                            className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-cyan-300 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedRules ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            <span>{copiedRules ? 'Copied!' : 'Copy Rules'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="font-bold text-cyan-400">Step 2: Anonymous Sign-in चालू करें</span>
                        <p className="text-[11px] text-slate-400">
                          <strong>Build &gt; Authentication &gt; Sign-in method</strong> में जाएं &gt; <strong>Anonymous</strong> पर क्लिक करके <strong className="text-emerald-400">Enable</strong> करें और Save करें।
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                    <Sparkles size={15} />
                    <span>How real-time friendship works:</span>
                  </div>
                  <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                    <li>Share your Gamer ID with your friend.</li>
                    <li>When you send a request, they get an instant real-time pop-up notification.</li>
                    <li>Once they click &quot;Accept&quot;, you are instantly added to each other&apos;s global friends list!</li>
                    <li>You can invite them to play any of the 3 multiplayer games together anytime.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Firebase Real-time Sync Active</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
