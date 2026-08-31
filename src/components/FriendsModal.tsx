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
} from 'lucide-react';
import {
  UserPresence,
  listenToAllPlayers,
  getLocalProfile,
  saveLocalProfile,
  getLocalFriends,
  addLocalFriend,
  removeLocalFriend,
  sendGameInvite,
  AVATAR_OPTIONS,
} from '../firebase/presence';
import { createTicTacToeRoom } from '../firebase/multiplayer';

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
  const [friendIds, setFriendIds] = useState<string[]>(getLocalFriends());
  const [activeTab, setActiveTab] = useState<'friends' | 'online' | 'add'>('friends');
  const [searchId, setSearchId] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [invitingUid, setInvitingUid] = useState<string | null>(null);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  // Subscribe to all players online / presence
  useEffect(() => {
    if (!isOpen) return;
    const unsub = listenToAllPlayers((players) => {
      setAllPlayers(players);
    });
    return () => unsub();
  }, [isOpen]);

  const handleSaveProfile = () => {
    if (!editName.trim()) return;
    saveLocalProfile(editName.trim(), editAvatar);
    setProfile({ name: editName.trim(), avatar: editAvatar });
    setIsEditingProfile(false);
  };

  const handleCopyMyId = () => {
    navigator.clipboard.writeText(myUid);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleToggleFriend = (uid: string) => {
    if (friendIds.includes(uid)) {
      removeLocalFriend(uid);
      setFriendIds(getLocalFriends());
    } else {
      addLocalFriend(uid);
      setFriendIds(getLocalFriends());
    }
  };

  const handleAddFriendById = () => {
    const clean = searchId.trim();
    if (!clean) return;
    addLocalFriend(clean);
    setFriendIds(getLocalFriends());
    setSearchId('');
    setActiveTab('friends');
  };

  const handleInviteToTicTacToe = async (targetPlayer: UserPresence) => {
    try {
      setInvitingUid(targetPlayer.uid);
      // Create a room first
      const room = await createTicTacToeRoom({
        uid: myUid,
        name: profile.name,
        avatar: profile.avatar,
      });

      // Send real-time invite
      await sendGameInvite(targetPlayer.uid, {
        fromUid: myUid,
        fromName: profile.name,
        fromAvatar: profile.avatar,
        gameId: 'tictactoe',
        gameName: 'Tic-Tac-Toe (कांटा और ज़ीरो)',
        roomId: room.id,
      });

      setInviteSuccessMsg(`Invite sent to ${targetPlayer.name}! Joining room...`);
      setTimeout(() => {
        setInvitingUid(null);
        setInviteSuccessMsg(null);
        onClose();
        if (onLaunchGameWithRoom) {
          onLaunchGameWithRoom('tictactoe', room.id);
        }
      }, 1200);
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

  // Filter friends vs online with strict unique UID map
  const uniquePlayersMap = new Map<string, UserPresence>();
  allPlayers.forEach((p) => {
    if (p && p.uid && p.uid !== myUid) {
      uniquePlayersMap.set(p.uid, p);
    }
  });
  const otherPlayers = Array.from(uniquePlayersMap.values());
  const friendPlayers = otherPlayers.filter((p) => friendIds.includes(p.uid));
  const onlinePlayers = otherPlayers.filter((p) => p.status === 'online' || p.status === 'in-game');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div key="friends-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
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
                  Friends &amp; Community
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    LIVE
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time multiplayer lobbies &amp; player activity
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
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-slate-400 hover:text-cyan-400 text-xs p-1"
                    title="Edit Profile"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-slate-500">
                    ID: {myUid.substring(0, 10)}...
                  </span>
                  <button
                    onClick={handleCopyMyId}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId ? <Check size={11} /> : <Copy size={11} />}
                    {copiedId ? 'Copied' : 'Copy My ID'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
          </div>

          {/* Edit Profile Dropdown */}
          {isEditingProfile && (
            <div className="p-4 bg-slate-850 border-b border-slate-700/80">
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Choose Avatar &amp; Nickname
              </label>
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {AVATAR_OPTIONS.map((av, idx) => (
                  <button
                    key={`avatar-opt-${av}-${idx}`}
                    onClick={() => setEditAvatar(av)}
                    className={`text-2xl p-2 rounded-xl border transition-all ${
                      editAvatar === av
                        ? 'bg-cyan-500/20 border-cyan-400 scale-110'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={18}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your nickname"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
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

          {/* Nav Tabs */}
          <div className="flex border-b border-slate-800 px-4 pt-2 gap-2 bg-slate-900/50">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'friends'
                  ? 'bg-slate-800 text-cyan-400 border-t-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck size={14} />
              My Friends ({friendPlayers.length})
            </button>
            <button
              onClick={() => setActiveTab('online')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'online'
                  ? 'bg-slate-800 text-cyan-400 border-t-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio size={14} className="text-emerald-400 animate-pulse" />
              Active Online ({onlinePlayers.length})
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'add'
                  ? 'bg-slate-800 text-cyan-400 border-t-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus size={14} />
              Add by ID
            </button>
          </div>

          {/* Success Message Banner */}
          {inviteSuccessMsg && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <Sparkles size={16} />
              {inviteSuccessMsg}
            </div>
          )}

          {/* Tab Contents */}
          <div className="flex-1 p-4 overflow-y-auto min-h-[260px] max-h-[380px] custom-scrollbar">
            {activeTab === 'friends' && (
              <div className="space-y-2.5">
                {friendPlayers.length === 0 ? (
                  <div className="text-center py-10">
                    <Users size={36} className="mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No friends added yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Play an online match with anyone to automatically add them, or add friends via
                      their Gamer ID!
                    </p>
                    <button
                      onClick={() => setActiveTab('online')}
                      className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-all cursor-pointer"
                    >
                      View Online Players
                    </button>
                  </div>
                ) : (
                  friendPlayers.map((player, idx) => (
                    <PlayerCard
                      key={`friend-card-${player.uid || idx}-${idx}`}
                      player={player}
                      isFriend={true}
                      onToggleFriend={() => handleToggleFriend(player.uid)}
                      onInvite={() => handleInviteToTicTacToe(player)}
                      isInviting={invitingUid === player.uid}
                      formatLastSeen={formatLastSeen}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'online' && (
              <div className="space-y-2.5">
                {onlinePlayers.length === 0 ? (
                  <div className="text-center py-10">
                    <Radio size={36} className="mx-auto text-slate-600 mb-2 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-300">No other players online right now</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Share your room link or play with our Smart AI Bot!
                    </p>
                  </div>
                ) : (
                  onlinePlayers.map((player, idx) => (
                    <PlayerCard
                      key={`online-card-${player.uid || idx}-${idx}`}
                      player={player}
                      isFriend={friendIds.includes(player.uid)}
                      onToggleFriend={() => handleToggleFriend(player.uid)}
                      onInvite={() => handleInviteToTicTacToe(player)}
                      isInviting={invitingUid === player.uid}
                      formatLastSeen={formatLastSeen}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'add' && (
              <div className="py-4">
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Enter Friend&apos;s Gamer ID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="e.g. usr_8k9a2..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleAddFriendById}
                    disabled={!searchId.trim()}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserPlus size={14} />
                    Add Friend
                  </button>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    How to invite friends:
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    1. Share your Gamer ID with your friend.<br />
                    2. When they add you, they will appear in your friends list.<br />
                    3. Click <strong>&quot;Invite to Play&quot;</strong> and they will receive an instant
                    notification on their screen!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Firebase Realtime Sync Active
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface PlayerCardProps {
  player: UserPresence;
  isFriend: boolean;
  onToggleFriend: () => void;
  onInvite: () => void;
  isInviting: boolean;
  formatLastSeen: (ts: number) => string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isFriend,
  onToggleFriend,
  onInvite,
  isInviting,
  formatLastSeen,
}) => {
  const isOnline = player.status === 'online' || player.status === 'in-game';

  return (
    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        <div className="relative text-2xl p-1.5 bg-slate-900 rounded-xl border border-slate-800">
          {player.avatar || '👾'}
          <span
            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 ${
              isOnline ? 'bg-emerald-400' : 'bg-slate-600'
            }`}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{player.name}</span>
            {isFriend && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                Friend
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            {player.status === 'in-game' ? (
              <span className="text-amber-400 flex items-center gap-1 font-medium">
                <Gamepad2 size={12} />
                Playing: {player.currentGame || 'Game'}
              </span>
            ) : isOnline ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <Circle size={8} className="fill-emerald-400" />
                Online in Lobby
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1">
                <Clock size={11} />
                Last seen: {formatLastSeen(player.lastSeen)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onInvite}
          disabled={!isOnline || isInviting}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          title={isOnline ? 'Invite to play Tic-Tac-Toe' : 'Player is offline'}
        >
          <Swords size={13} />
          {isInviting ? 'Inviting...' : 'Invite'}
        </button>

        <button
          onClick={onToggleFriend}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            isFriend
              ? 'bg-slate-900 border-slate-700 text-cyan-400 hover:text-red-400'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-emerald-400'
          }`}
          title={isFriend ? 'Remove from Friends' : 'Add to Friends'}
        >
          {isFriend ? <UserCheck size={15} /> : <UserPlus size={15} />}
        </button>
      </div>
    </div>
  );
};
