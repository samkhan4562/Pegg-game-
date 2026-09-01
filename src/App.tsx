import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MasterPortal } from './components/MasterPortal';
import { GameCanvas3D } from './components/GameCanvas3D';
import { HUD } from './components/HUD';
import { HeroMenu } from './components/HeroMenu';
import { SlideDrawer } from './components/SlideDrawer';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LevelEditorModal } from './components/LevelEditorModal';
import { BridgeGame } from './components/BridgeGame';
import { TicTacToeGame } from './components/TicTacToeGame';
import { FriendsModal } from './components/FriendsModal';
import { IncomingInviteToast } from './components/IncomingInviteToast';
import { LEVELS } from './data/levels';
import { BRIDGE_LEVELS } from './data/bridgeLevels';
import {
  LevelData,
  PegData,
  ValidMove,
  LevelProgress,
  MoveHistoryItem,
  ScreenMode,
  ActiveGameView,
  BridgeProgress,
} from './types';
import { getValidMovesForPeg, isTargetReached } from './game/reflectionMath';
import { sound } from './audio/soundEffects';
import { initFirebaseAuth } from './firebase/config';
import {
  setupPresence,
  updateGameActivity,
  listenForIncomingInvites,
  listenToIncomingFriendRequests,
  listenToAllPlayers,
  getLocalProfile,
  GameInvite,
  FriendRequest,
  UserPresence,
} from './firebase/presence';
import {
  PegsRoom,
  subscribeToPegsRoom,
  makePegsMultiplayerMove,
  leavePegsRoom,
} from './firebase/multiplayer';

export default function App() {
  // Master Platform Game View ('hub' | 'pegs' | 'bridge' | 'tictactoe')
  const [activeGame, setActiveGame] = useState<ActiveGameView>('hub');

  // Online Presence & Profile State
  const [myUid, setMyUid] = useState<string>('usr_guest');
  const [isFriendsOpen, setIsFriendsOpen] = useState<boolean>(false);
  const [incomingInvites, setIncomingInvites] = useState<GameInvite[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<FriendRequest[]>([]);
  const [targetRoomId, setTargetRoomId] = useState<string | null>(null);
  const [onlinePlayersCount, setOnlinePlayersCount] = useState<number>(1);
  const [pegsRoom, setPegsRoom] = useState<PegsRoom | null>(null);

  // Jumping Pegs: Screen Mode ('menu' | 'game')
  const [screenMode, setScreenMode] = useState<ScreenMode>('menu');

  // Jumping Pegs: Level State
  const [levelList, setLevelList] = useState<LevelData[]>(LEVELS);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const currentLevel = levelList[currentLevelIndex] || LEVELS[0];

  // Jumping Pegs: Gameplay State
  const [pegs, setPegs] = useState<PegData[]>([]);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [history, setHistory] = useState<MoveHistoryItem[]>([]);
  const [selectedPegId, setSelectedPegId] = useState<string | null>(null);
  const [focusedMove, setFocusedMove] = useState<ValidMove | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isLevelComplete, setIsLevelComplete] = useState<boolean>(false);
  const [cameraResetTrigger, setCameraResetTrigger] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());

  // Slide Drawer & Modal States (Jumping Pegs)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);

  // Jumping Pegs: Persistence State
  const [progress, setProgress] = useState<Record<number, LevelProgress>>(() => {
    try {
      const saved = localStorage.getItem('peg_puzzle_progress_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      1: { unlocked: true, bestMoves: null, stars: 0 },
    };
  });

  // Midnight Bridge: Persistence State
  const [bridgeProgress, setBridgeProgress] = useState<Record<number, BridgeProgress>>(() => {
    try {
      const saved = localStorage.getItem('bridge_puzzle_progress_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      1: { unlocked: true, bestTime: null, stars: 0 },
    };
  });

  // 1. Initialize Firebase Auth & Real-time Presence
  useEffect(() => {
    let cleanupPresence: (() => void) | undefined;
    let unsubInvites: (() => void) | undefined;
    let unsubFriendReqs: (() => void) | undefined;
    let unsubPlayers: (() => void) | undefined;

    initFirebaseAuth().then((uid) => {
      setMyUid(uid);
      const prof = getLocalProfile();
      cleanupPresence = setupPresence(uid, prof.name, prof.avatar, 'Arcade Hub');

      // Listen for incoming game invites
      unsubInvites = listenForIncomingInvites(uid, (invites) => {
        setIncomingInvites(invites);
      });

      // Listen for incoming friend requests
      unsubFriendReqs = listenToIncomingFriendRequests(uid, (reqs) => {
        setIncomingFriendRequests(reqs);
      });

      // Listen for total online players
      unsubPlayers = listenToAllPlayers((players: UserPresence[]) => {
        const active = players.filter((p) => p.status === 'online' || p.status === 'in-game');
        setOnlinePlayersCount(Math.max(1, active.length));
      });
    });

    return () => {
      if (cleanupPresence) cleanupPresence();
      if (unsubInvites) unsubInvites();
      if (unsubFriendReqs) unsubFriendReqs();
      if (unsubPlayers) unsubPlayers();
    };
  }, []);

  // Update Game Activity in Firebase
  useEffect(() => {
    if (!myUid) return;
    const gameTitles: Record<ActiveGameView, string> = {
      hub: 'Arcade Hub',
      pegs: 'The Jumping Pegs 3D',
      bridge: 'Midnight Bridge & Torch',
      tictactoe: 'Tic-Tac-Toe (कांटा और ज़ीरो)',
    };
    updateGameActivity(myUid, gameTitles[activeGame] || 'Arcade Hub');
  }, [activeGame, myUid]);

  // Calculate Aggregated Stars
  const pegsStars = useMemo(() => {
    return Object.values(progress).reduce((acc: number, p: LevelProgress) => acc + (p?.stars || 0), 0);
  }, [progress]);

  const maxPegsStars = useMemo(() => LEVELS.length * 3, []);

  const bridgeStars = useMemo(() => {
    return Object.values(bridgeProgress).reduce((acc: number, p: BridgeProgress) => acc + (p?.stars || 0), 0);
  }, [bridgeProgress]);

  const maxBridgeStars = useMemo(() => BRIDGE_LEVELS.length * 3, []);

  const refreshHubProgress = useCallback(() => {
    try {
      const bSaved = localStorage.getItem('bridge_puzzle_progress_v2');
      if (bSaved) setBridgeProgress(JSON.parse(bSaved));

      const pSaved = localStorage.getItem('peg_puzzle_progress_v2');
      if (pSaved) setProgress(JSON.parse(pSaved));
    } catch {
      // Ignore
    }
  }, []);

  const saveProgress = useCallback((newProgress: Record<number, LevelProgress>) => {
    setProgress(newProgress);
    try {
      localStorage.setItem('peg_puzzle_progress_v2', JSON.stringify(newProgress));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Initialize/Load Jumping Pegs Level
  const loadLevel = useCallback(
    (index: number) => {
      const lvl = levelList[index] || LEVELS[0];
      setCurrentLevelIndex(index);
      setPegs(lvl.pegs.map((p) => ({ ...p })));
      setMovesCount(0);
      setHistory([]);
      setSelectedPegId(null);
      setFocusedMove(null);
      setIsAnimating(false);
      setIsLevelComplete(false);
      setCameraResetTrigger((prev) => prev + 1);
    },
    [levelList]
  );

  useEffect(() => {
    loadLevel(currentLevelIndex);
  }, [currentLevelIndex, loadLevel]);

  // Subscribe to Pegs Room if active
  useEffect(() => {
    if (activeGame !== 'pegs' || !targetRoomId) {
      setPegsRoom(null);
      return;
    }

    const unsub = subscribeToPegsRoom(targetRoomId, (room) => {
      if (room) {
        setPegsRoom(room);
        if (room.pegs && Array.isArray(room.pegs) && room.pegs.length > 0) {
          setPegs(room.pegs);
        }
        if (typeof room.movesCount === 'number') {
          setMovesCount(room.movesCount);
        }
        if (room.isVictory) {
          setIsLevelComplete(true);
        }
      } else {
        setPegsRoom(null);
      }
    });

    return () => unsub();
  }, [activeGame, targetRoomId]);

  const handleExitPegsRoom = useCallback(() => {
    if (pegsRoom && myUid) {
      leavePegsRoom(pegsRoom.id, myUid);
    }
    setPegsRoom(null);
    setTargetRoomId(null);
    loadLevel(0);
  }, [pegsRoom, myUid, loadLevel]);

  // Execute Point-Reflection Move (Synchronously applied when jump animation lands!)
  const handleExecuteMove = useCallback(
    (move: ValidMove) => {
      if (isLevelComplete) return;

      const previousPegs = pegs.map((p) => ({ ...p }));
      setHistory((prev) => [...prev, { pegs: previousPegs, move }]);

      const updatedPegs = pegs.map((peg) => {
        if (peg.id === move.pegId) {
          return { ...peg, x: move.dest.x, y: move.dest.y };
        }
        return peg;
      });

      setPegs(updatedPegs);
      setSelectedPegId(null);
      setFocusedMove(null);
      setIsAnimating(false);

      const nextMovesCount = movesCount + 1;
      setMovesCount(nextMovesCount);

      const targetAchieved = isTargetReached(updatedPegs, currentLevel.target);

      // In multiplayer room, sync move to Firebase
      if (pegsRoom && myUid) {
        makePegsMultiplayerMove(pegsRoom.id, move, updatedPegs, myUid, targetAchieved);
      }

      if (targetAchieved) {
        setIsLevelComplete(true);
        sound.playWin();

        const finalMoves = nextMovesCount;
        const currentProgress = progress[currentLevel.id];

        let stars = 1;
        if (finalMoves <= currentLevel.parMoves) {
          stars = 3;
        } else if (finalMoves <= currentLevel.parMoves + 2) {
          stars = 2;
        }

        const existingStars = currentProgress?.stars || 0;
        const newStars = Math.max(existingStars, stars);
        const bestMoves =
          currentProgress?.bestMoves === null
            ? finalMoves
            : Math.min(currentProgress?.bestMoves ?? finalMoves, finalMoves);

        const nextLevelId = currentLevel.id + 1;
        const updatedProgress: Record<number, LevelProgress> = {
          ...progress,
          [currentLevel.id]: {
            unlocked: true,
            bestMoves,
            stars: newStars,
          },
        };

        if (nextLevelId <= levelList.length) {
          updatedProgress[nextLevelId] = {
            unlocked: true,
            bestMoves: updatedProgress[nextLevelId]?.bestMoves ?? null,
            stars: updatedProgress[nextLevelId]?.stars ?? 0,
          };
        }

        saveProgress(updatedProgress);
      }
    },
    [isLevelComplete, pegs, currentLevel, movesCount, progress, levelList.length, saveProgress]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0 || isAnimating || isLevelComplete) return;

    sound.playUndo();
    const lastItem = history[history.length - 1];
    setPegs(lastItem.pegs.map((p) => ({ ...p })));
    setHistory((prev) => prev.slice(0, -1));
    setMovesCount((prev) => Math.max(0, prev - 1));
    setSelectedPegId(null);
    setFocusedMove(null);
  }, [history, isAnimating, isLevelComplete]);

  const handleRestart = useCallback(() => {
    sound.playRestart();
    loadLevel(currentLevelIndex);
  }, [loadLevel, currentLevelIndex]);

  const handleNextLevel = useCallback(() => {
    if (currentLevelIndex < levelList.length - 1) {
      loadLevel(currentLevelIndex + 1);
    }
  }, [currentLevelIndex, levelList.length, loadLevel]);

  const handleResetCamera = useCallback(() => {
    setCameraResetTrigger((prev) => prev + 1);
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  const handleStartCampaign = useCallback(() => {
    sound.playSelect();
    let firstIncompleteIndex = 0;
    for (let i = 0; i < levelList.length; i++) {
      const lvl = levelList[i];
      if (progress[lvl.id]?.unlocked && (progress[lvl.id]?.stars || 0) < 3) {
        firstIncompleteIndex = i;
        break;
      }
    }
    loadLevel(firstIncompleteIndex);
    setScreenMode('game');
  }, [levelList, progress, loadLevel]);

  const handlePlayCustomLevel = useCallback((customLevel: LevelData) => {
    sound.playSelect();
    setLevelList((prev) => [customLevel, ...prev.filter((l) => l.id !== customLevel.id)]);
    setCurrentLevelIndex(0);
    setPegs(customLevel.pegs.map((p) => ({ ...p })));
    setMovesCount(0);
    setHistory([]);
    setSelectedPegId(null);
    setFocusedMove(null);
    setIsAnimating(false);
    setIsLevelComplete(false);
    setCameraResetTrigger((prev) => prev + 1);
    setIsSandboxOpen(false);
    setScreenMode('game');
  }, []);

  const validMoves = useMemo(() => {
    if (!selectedPegId) return [];
    return getValidMovesForPeg(selectedPegId, pegs);
  }, [selectedPegId, pegs]);

  const handleAcceptInvite = (invite: GameInvite) => {
    setTargetRoomId(invite.roomId);
    if (invite.gameId === 'tictactoe') {
      setActiveGame('tictactoe');
    } else if (invite.gameId === 'pegs') {
      setActiveGame('pegs');
      setScreenMode('game');
    } else if (invite.gameId === 'bridge') {
      setActiveGame('bridge');
    }
  };

  const handleLaunchGameWithRoom = (gameId: string, roomId: string) => {
    setTargetRoomId(roomId);
    if (gameId === 'tictactoe') {
      setActiveGame('tictactoe');
    } else if (gameId === 'pegs') {
      setActiveGame('pegs');
      setScreenMode('game');
    } else if (gameId === 'bridge') {
      setActiveGame('bridge');
    }
  };

  return (
    <>
      {/* ==========================================================
          GLOBAL INCOMING INVITE POP-UP TOAST
         ========================================================== */}
      <IncomingInviteToast
        invites={incomingInvites}
        friendRequests={incomingFriendRequests}
        myUid={myUid}
        onAcceptInvite={handleAcceptInvite}
      />

      {/* ==========================================================
          FRIENDS & COMMUNITY MODAL
         ========================================================== */}
      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        myUid={myUid}
        onLaunchGameWithRoom={handleLaunchGameWithRoom}
      />

      {/* ==========================================================
          RENDER VIEW: 1. MASTER PORTAL HUB
         ========================================================== */}
      {activeGame === 'hub' && (
        <MasterPortal
          pegsStars={pegsStars}
          maxPegsStars={maxPegsStars}
          bridgeStars={bridgeStars}
          maxBridgeStars={maxBridgeStars}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onSelectGame={(game) => {
            sound.playSelect();
            setTargetRoomId(null);
            setActiveGame(game);
          }}
          onOpenFriends={() => setIsFriendsOpen(true)}
          onlineCount={onlinePlayersCount}
        />
      )}

      {/* ==========================================================
          RENDER VIEW: 2. GAME 2: MIDNIGHT BRIDGE & TORCH
         ========================================================== */}
      {activeGame === 'bridge' && (
        <BridgeGame
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          myUid={myUid}
          initialRoomId={targetRoomId}
          onOpenFriends={() => setIsFriendsOpen(true)}
          onReturnToHub={() => {
            refreshHubProgress();
            sound.playSelect();
            setTargetRoomId(null);
            setActiveGame('hub');
          }}
        />
      )}

      {/* ==========================================================
          RENDER VIEW: 3. GAME 3: TIC-TAC-TOE PRO (कांटा और ज़ीरो)
         ========================================================== */}
      {activeGame === 'tictactoe' && (
        <TicTacToeGame
          myUid={myUid}
          initialRoomId={targetRoomId}
          onBackToHub={() => {
            sound.playSelect();
            setTargetRoomId(null);
            setActiveGame('hub');
          }}
          onOpenFriends={() => setIsFriendsOpen(true)}
        />
      )}

      {/* ==========================================================
          RENDER VIEW: 4. GAME 1: THE JUMPING PEGS 3D
         ========================================================== */}
      {activeGame === 'pegs' && (
        <div className="relative w-screen h-screen bg-[#0a0c10] overflow-hidden select-none font-sans text-slate-100">
          {/* 3D WebGL Canvas Layer */}
          <GameCanvas3D
            pegs={pegs}
            target={currentLevel.target}
            selectedPegId={selectedPegId}
            validMoves={validMoves}
            isAnimating={isAnimating}
            isMenuMode={screenMode === 'menu'}
            cameraResetTrigger={cameraResetTrigger}
            levelCameraPos={currentLevel.cameraPos}
            onSelectPeg={setSelectedPegId}
            onExecuteMove={handleExecuteMove}
            onFocusMove={setFocusedMove}
          />

          {/* Screen Mode 1: Main Title Screen (Hero Menu) */}
          {screenMode === 'menu' && (
            <HeroMenu
              currentLevelIndex={currentLevelIndex}
              totalLevels={levelList.length}
              progress={progress}
              onStartCampaign={handleStartCampaign}
              onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
              onOpenSandbox={() => setIsSandboxOpen(true)}
              onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
              onReturnToHub={() => {
                sound.playSelect();
                setActiveGame('hub');
              }}
            />
          )}

          {/* Screen Mode 2: Active In-Game HUD (with Top Hamburger & Floating Bottom Dock) */}
          {screenMode === 'game' && (
            <HUD
              currentLevel={currentLevel}
              levelIndex={currentLevelIndex}
              totalLevels={levelList.length}
              movesCount={movesCount}
              canUndo={history.length > 0 && !isAnimating && !isLevelComplete}
              isMuted={isMuted}
              target={currentLevel.target}
              focusedMove={focusedMove}
              pegsRoom={pegsRoom}
              myUid={myUid}
              onUndo={handleUndo}
              onRestart={handleRestart}
              onResetCamera={handleResetCamera}
              onToggleMute={handleToggleMute}
              onOpenDrawer={() => setIsDrawerOpen(true)}
              onExitRoom={handleExitPegsRoom}
            />
          )}

          {/* Slide-over Glassmorphic Drawer Navigation */}
          <SlideDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            progress={progress}
            totalLevels={levelList.length}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
            onOpenSandbox={() => setIsSandboxOpen(true)}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onReturnToMainMenu={() => {
              setIsDrawerOpen(false);
              setScreenMode('menu');
            }}
            onReturnToHub={() => {
              setIsDrawerOpen(false);
              sound.playSelect();
              setActiveGame('hub');
            }}
          />

          {/* Level Complete Celebration Modal */}
          <LevelCompleteModal
            isOpen={isLevelComplete}
            level={currentLevel}
            levelIndex={currentLevelIndex}
            totalLevels={levelList.length}
            movesCount={movesCount}
            onNextLevel={handleNextLevel}
            onReplay={handleRestart}
            onOpenLevelSelect={() => {
              setIsLevelComplete(false);
              setIsLevelSelectOpen(true);
            }}
          />

          {/* Level Select Catalog Modal */}
          <LevelSelectModal
            isOpen={isLevelSelectOpen}
            levels={levelList}
            currentLevelIndex={currentLevelIndex}
            progress={progress}
            onSelectLevel={(idx) => {
              loadLevel(idx);
              setScreenMode('game');
            }}
            onClose={() => setIsLevelSelectOpen(false)}
          />

          {/* How To Play & Parity Explanation Modal */}
          <HowToPlayModal
            isOpen={isHowToPlayOpen}
            onClose={() => setIsHowToPlayOpen(false)}
          />

          {/* Custom Sandbox Puzzle Creator Modal */}
          <LevelEditorModal
            isOpen={isSandboxOpen}
            onPlayCustomLevel={handlePlayCustomLevel}
            onClose={() => setIsSandboxOpen(false)}
          />
        </div>
      )}
    </>
  );
}
