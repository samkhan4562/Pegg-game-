import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Check, X, Bell } from 'lucide-react';
import { GameInvite, respondToInvite } from '../firebase/presence';

interface IncomingInviteToastProps {
  invites: GameInvite[];
  myUid: string;
  onAcceptInvite: (invite: GameInvite) => void;
}

export const IncomingInviteToast: React.FC<IncomingInviteToastProps> = ({
  invites,
  myUid,
  onAcceptInvite,
}) => {
  if (!invites || invites.length === 0) return null;

  const currentInvite = invites[0];

  const handleAccept = async () => {
    await respondToInvite(myUid, currentInvite.id, 'accepted');
    onAcceptInvite(currentInvite);
  };

  const handleDecline = async () => {
    await respondToInvite(myUid, currentInvite.id, 'declined');
  };

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full font-sans">
        <motion.div
          key={currentInvite.id || 'invite-toast'}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="bg-slate-900/95 border-2 border-cyan-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-white shadow-cyan-500/20"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl shrink-0">
              {currentInvite.fromAvatar || '👾'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-0.5">
                <Bell size={12} className="animate-bounce" />
                Game Challenge!
              </div>
              <h4 className="font-bold text-sm text-white">
                {currentInvite.fromName} challenged you!
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Game: <span className="text-amber-400 font-semibold">{currentInvite.gameName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
            <button
              onClick={handleAccept}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Check size={14} />
              Accept &amp; Play
            </button>
            <button
              onClick={handleDecline}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <X size={14} />
              Decline
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
