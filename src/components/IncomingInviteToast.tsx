import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Check, X, Bell, UserPlus, Gamepad2 } from 'lucide-react';
import {
  GameInvite,
  FriendRequest,
  respondToInvite,
  respondToFriendRequest,
  getLocalProfile,
} from '../firebase/presence';
import { sound } from '../audio/soundEffects';

interface IncomingInviteToastProps {
  invites: GameInvite[];
  friendRequests?: FriendRequest[];
  myUid: string;
  onAcceptInvite: (invite: GameInvite) => void;
  onAcceptFriendRequest?: () => void;
}

export const IncomingInviteToast: React.FC<IncomingInviteToastProps> = ({
  invites,
  friendRequests = [],
  myUid,
  onAcceptInvite,
  onAcceptFriendRequest,
}) => {
  const profile = getLocalProfile();
  const hasInvite = invites && invites.length > 0;
  const hasRequest = friendRequests && friendRequests.length > 0;

  if (!hasInvite && !hasRequest) return null;

  const currentInvite = hasInvite ? invites[0] : null;
  const currentRequest = !hasInvite && hasRequest ? friendRequests[0] : null;

  const handleAcceptInvite = async () => {
    if (!currentInvite) return;
    sound.playWin();
    await respondToInvite(myUid, currentInvite.id, 'accepted');
    onAcceptInvite(currentInvite);
  };

  const handleDeclineInvite = async () => {
    if (!currentInvite) return;
    sound.playSelect();
    await respondToInvite(myUid, currentInvite.id, 'declined');
  };

  const handleAcceptRequest = async () => {
    if (!currentRequest) return;
    sound.playWin();
    await respondToFriendRequest(myUid, profile.name, profile.avatar, currentRequest, true);
    if (onAcceptFriendRequest) onAcceptFriendRequest();
  };

  const handleDeclineRequest = async () => {
    if (!currentRequest) return;
    sound.playSelect();
    await respondToFriendRequest(myUid, profile.name, profile.avatar, currentRequest, false);
  };

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full font-sans px-4 sm:px-0">
        {currentInvite && (
          <motion.div
            key={currentInvite.id || 'game-invite-toast'}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-slate-900/95 border-2 border-cyan-500 rounded-3xl p-4 shadow-2xl backdrop-blur-xl text-white shadow-cyan-500/30"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-3xl shrink-0 shadow-md">
                {currentInvite.fromAvatar || '👾'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-extrabold uppercase tracking-wider mb-0.5">
                  <Gamepad2 size={13} className="animate-bounce" />
                  Live Game Challenge!
                </div>
                <h4 className="font-extrabold text-sm text-white truncate">
                  {currentInvite.fromName}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Invited you to play{' '}
                  <span className="text-amber-400 font-bold">
                    {currentInvite.gameName}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-slate-800">
              <button
                onClick={handleAcceptInvite}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
              >
                <Check size={15} strokeWidth={3} />
                Accept &amp; Join Game
              </button>
              <button
                onClick={handleDeclineInvite}
                className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <X size={14} />
                Decline
              </button>
            </div>
          </motion.div>
        )}

        {!currentInvite && currentRequest && (
          <motion.div
            key={currentRequest.id || 'friend-request-toast'}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-slate-900/95 border-2 border-amber-500 rounded-3xl p-4 shadow-2xl backdrop-blur-xl text-white shadow-amber-500/30"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shrink-0 shadow-md">
                {currentRequest.fromAvatar || '👾'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-extrabold uppercase tracking-wider mb-0.5">
                  <UserPlus size={13} className="animate-pulse" />
                  Friend Request!
                </div>
                <h4 className="font-extrabold text-sm text-white truncate">
                  {currentRequest.fromName}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sent you a friend request on Axiom Labs Arcade
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-slate-800">
              <button
                onClick={handleAcceptRequest}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
              >
                <Check size={15} strokeWidth={3} />
                Accept Friend
              </button>
              <button
                onClick={handleDeclineRequest}
                className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <X size={14} />
                Decline
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};
