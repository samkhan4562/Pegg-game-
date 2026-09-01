import React, { useState, useEffect, useCallback } from 'react';
import { BridgeCanvas3D } from './BridgeCanvas3D';
import { BridgeHUD } from './BridgeHUD';
import { BridgeSlideDrawer } from './BridgeSlideDrawer';
import { BridgeVictoryModal } from './BridgeVictoryModal';
import { BridgeComparisonModal } from './BridgeComparisonModal';
import { BridgeLevelSelectModal } from './BridgeLevelSelectModal';
import { BridgeHowToPlayModal } from './BridgeHowToPlayModal';
import { BridgeEditorModal } from './BridgeEditorModal';
import { BRIDGE_LEVELS } from '../data/bridgeLevels';
import {
  BridgeLevelData,
  Traveler,
  BridgeBank,
  BridgeStep,
  BridgeHistorySnapshot,
  BridgeProgress,
} from '../types';
import { getCrossingDuration, validateCrossing, solveBridgeCrossing } from '../game/bridgeMath';
import { sound } from '../audio/soundEffects';
import {
  BridgeRoom,
  createBridgeRoom,
  joinBridgeRoom,
  makeBridgeMultiplayerCrossing,
  subscribeToBridgeRoom,
  leaveBridgeRoom,
  requestBridgeRematch,
  sendBridgeReaction,
} from '../firebase/multiplayer';
import { getLocalProfile } from '../firebase/presence';

interface BridgeGameProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnToHub: () => void;
  myUid?: string;
  initialRoomId?: string | null;
  onOpenFriends?: () => void;
}

export const BridgeGame: React.FC<BridgeGameProps> = ({
  isMuted,
  onToggleMute,
  onReturnToHub,
  myUid = 'usr_guest',
  initialRoomId,
  onOpenFriends,
}) => {
  const profile = getLocalProfile();

  // Level State
  const [levelList, setLevelList] = useState<BridgeLevelData[]>(BRIDGE_LEVELS);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const currentLevel = levelList[currentLevelIndex] || BRIDGE_LEVELS[0];

  // Bank & Gameplay State
  const [leftBank, setLeftBank] = useState<Traveler[]>([]);
  const [rightBank, setRightBank] = useState<Traveler[]>([]);
  const [torchBank, setTorchBank] = useState<BridgeBank>('left');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [history, setHistory] = useState<BridgeHistorySnapshot[]>([]);

  // Animation & Transition State
  const [crossingTravelers, setCrossingTravelers] = useState<Traveler[] | null>(null);
  const [crossingDirection, setCrossingDirection] = useState<'forward' | 'backward' | null>(null);
  const [crossingProgress, setCrossingProgress] = useState<number>(0);
  const [isLevelComplete, setIsLevelComplete] = useState<boolean>(false);
  const [cameraResetTrigger, setCameraResetTrigger] = useState<number>(0);

  // Multiplayer Online State
  const [onlineRoom, setOnlineRoom] = useState<BridgeRoom | null>(null);
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(initialRoomId || null);

  // Modals & Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);

  // Progress Persistence
  const [progress, setProgress] = useState<Record<number, BridgeProgress>>(() => {
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

  // Subscribe to Online Room if active
  useEffect(() => {
    if (!onlineRoomId) return;
    const unsub = subscribeToBridgeRoom(onlineRoomId, (room) => {
      if (room) {
        setOnlineRoom(room);
        setLeftBank(room.leftBank || []);
        setRightBank(room.rightBank || []);
        setTorchBank(room.torchBank || 'left');
        setElapsedTime(room.elapsedTime || 0);
        setIsLevelComplete(room.isVictory || false);
      } else {
        setOnlineRoom(null);
        setOnlineRoomId(null);
      }
    });
    return () => unsub();
  }, [onlineRoomId]);

  // Load Level Helper
  const loadLevel = useCallback(
    (index: number) => {
      const targetLevel = levelList[index] || levelList[0];
      setCurrentLevelIndex(index);
      setLeftBank(targetLevel.travelers.map((t) => ({ ...t })));
      setRightBank([]);
      setTorchBank('left');
      setSelectedIds([]);
      setElapsedTime(0);
      setHistory([]);
      setCrossingTravelers(null);
      setCrossingDirection(null);
      setCrossingProgress(0);
      setIsLevelComplete(false);
      setCameraResetTrigger((prev) => prev + 1);
    },
    [levelList]
  );

  // Initialize on mount
  useEffect(() => {
    loadLevel(0);
  }, [loadLevel]);

  // Sync initialRoomId if prop changes
  useEffect(() => {
    if (initialRoomId) {
      setOnlineRoomId(initialRoomId);
    }
  }, [initialRoomId]);

  const handleExitRoom = useCallback(() => {
    if (onlineRoom && myUid) {
      leaveBridgeRoom(onlineRoom.id, myUid);
    }
    setOnlineRoom(null);
    setOnlineRoomId(null);
    loadLevel(0);
  }, [onlineRoom, myUid, loadLevel]);

  // Handle Traveler Selection
  const handleSelectTraveler = useCallback(
    (travelerId: string) => {
      if (isLevelComplete || crossingTravelers !== null) return;

      // In online mode, check if it's my turn
      if (onlineRoom && onlineRoom.currentTurnUid !== myUid) return;

      sound.playSelect();
      setSelectedIds((prev) => {
        if (prev.includes(travelerId)) {
          return prev.filter((id) => id !== travelerId);
        } else {
          if (prev.length >= currentLevel.bridgeCapacity) {
            return [...prev.slice(1), travelerId];
          }
          return [...prev, travelerId];
        }
      });
    },
    [isLevelComplete, crossingTravelers, currentLevel.bridgeCapacity, onlineRoom, myUid]
  );

  // Execute Bridge Crossing
  const handleCross = useCallback(() => {
    if (selectedIds.length === 0 || crossingTravelers !== null || isLevelComplete) return;

    if (onlineRoom && onlineRoom.currentTurnUid !== myUid) return;

    const sourceBankTravelers = torchBank === 'left' ? leftBank : rightBank;
    const movingTravelers = sourceBankTravelers.filter((t) => selectedIds.includes(t.id));

    if (movingTravelers.length === 0) return;

    const validation = validateCrossing(
      movingTravelers,
      torchBank,
      leftBank,
      rightBank,
      currentLevel.bridgeCapacity
    );

    if (!validation.valid) {
      sound.playError();
      return;
    }

    const crossingTime = getCrossingDuration(movingTravelers);
    const direction: 'forward' | 'backward' = torchBank === 'left' ? 'forward' : 'backward';

    // Start Crossing Animation
    sound.playMove();
    setCrossingTravelers(movingTravelers);
    setCrossingDirection(direction);
    setCrossingProgress(0);

    const animationDuration = 900; // ms
    const startTime = performance.now();

    const animateCrossing = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressRatio = Math.min(elapsed / animationDuration, 1);
      setCrossingProgress(progressRatio);

      if (progressRatio < 1) {
        requestAnimationFrame(animateCrossing);
      } else {
        // Animation Complete: Update Banks
        let nextLeft: Traveler[];
        let nextRight: Traveler[];
        let nextTorch: BridgeBank;

        if (direction === 'forward') {
          nextLeft = leftBank.filter((t) => !selectedIds.includes(t.id));
          nextRight = [...rightBank, ...movingTravelers];
          nextTorch = 'right';
        } else {
          nextRight = rightBank.filter((t) => !selectedIds.includes(t.id));
          nextLeft = [...leftBank, ...movingTravelers];
          nextTorch = 'left';
        }

        const nextElapsed = elapsedTime + crossingTime;
        const isVictory = nextRight.length === currentLevel.travelers.length;

        setLeftBank(nextLeft);
        setRightBank(nextRight);
        setTorchBank(nextTorch);
        setElapsedTime(nextElapsed);
        setSelectedIds([]);
        setCrossingTravelers(null);
        setCrossingDirection(null);
        setCrossingProgress(0);

        if (onlineRoom) {
          makeBridgeMultiplayerCrossing(
            onlineRoom.id,
            selectedIds,
            direction,
            crossingTime,
            nextLeft,
            nextRight,
            nextTorch,
            nextElapsed,
            myUid,
            isVictory
          );
        }

        if (isVictory) {
          setIsLevelComplete(true);
          sound.playWin();

          // Calculate Stars
          let stars = 1;
          if (nextElapsed <= currentLevel.parTime) {
            stars = 3;
          } else if (nextElapsed <= currentLevel.parTime + 4) {
            stars = 2;
          }

          const currentLevelProgress = progress[currentLevel.id];
          const newStars = Math.max(currentLevelProgress?.stars || 0, stars);
          const bestTime =
            currentLevelProgress?.bestTime === null
              ? nextElapsed
              : Math.min(currentLevelProgress?.bestTime ?? nextElapsed, nextElapsed);

          const nextLevelId = currentLevel.id + 1;
          const updatedProgress: Record<number, BridgeProgress> = {
            ...progress,
            [currentLevel.id]: {
              unlocked: true,
              bestTime,
              stars: newStars,
            },
          };

          if (nextLevelId <= levelList.length) {
            updatedProgress[nextLevelId] = {
              unlocked: true,
              bestTime: updatedProgress[nextLevelId]?.bestTime ?? null,
              stars: updatedProgress[nextLevelId]?.stars ?? 0,
            };
          }

          setProgress(updatedProgress);
          try {
            localStorage.setItem('bridge_puzzle_progress_v2', JSON.stringify(updatedProgress));
          } catch {
            // Ignore
          }
        }
      }
    };

    requestAnimationFrame(animateCrossing);
  }, [
    selectedIds,
    crossingTravelers,
    isLevelComplete,
    torchBank,
    leftBank,
    rightBank,
    currentLevel,
    elapsedTime,
    onlineRoom,
    myUid,
    progress,
    levelList.length,
  ]);

  const handleUndo = useCallback(() => {
    if (history.length === 0 || crossingTravelers !== null || isLevelComplete || onlineRoom) return;
    sound.playUndo();
    const lastSnapshot = history[history.length - 1];
    setLeftBank(currentLevel.travelers.filter((t) => lastSnapshot.leftBankIds.includes(t.id)));
    setRightBank(currentLevel.travelers.filter((t) => lastSnapshot.rightBankIds.includes(t.id)));
    setTorchBank(lastSnapshot.torchPosition);
    setElapsedTime(lastSnapshot.elapsedTime);
    setSelectedIds([]);
    setHistory((prev) => prev.slice(0, -1));
  }, [history, crossingTravelers, isLevelComplete, currentLevel, onlineRoom]);

  const handleRestart = useCallback(() => {
    sound.playRestart();
    if (onlineRoom) {
      requestBridgeRematch(onlineRoom.id, myUid, currentLevel.travelers);
    } else {
      loadLevel(currentLevelIndex);
    }
  }, [currentLevelIndex, loadLevel, onlineRoom, myUid, currentLevel.travelers]);

  const handleNextLevel = useCallback(() => {
    if (currentLevelIndex < levelList.length - 1) {
      loadLevel(currentLevelIndex + 1);
    }
  }, [currentLevelIndex, levelList.length, loadLevel]);

  const handleSelectLevel = useCallback(
    (index: number) => {
      loadLevel(index);
      setIsLevelSelectOpen(false);
    },
    [loadLevel]
  );

  const handleResetCamera = useCallback(() => {
    setCameraResetTrigger((prev) => prev + 1);
  }, []);

  const handlePlayCustomLevel = useCallback((customLevel: BridgeLevelData) => {
    sound.playSelect();
    setLevelList((prev) => [customLevel, ...prev.filter((l) => l.id !== customLevel.id)]);
    setCurrentLevelIndex(0);
    setLeftBank(customLevel.travelers.map((t) => ({ ...t })));
    setRightBank([]);
    setTorchBank('left');
    setSelectedIds([]);
    setElapsedTime(0);
    setHistory([]);
    setCrossingTravelers(null);
    setCrossingDirection(null);
    setCrossingProgress(0);
    setIsLevelComplete(false);
    setCameraResetTrigger((prev) => prev + 1);
    setIsSandboxOpen(false);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#07090e] overflow-hidden select-none font-sans text-slate-100 touch-none">
      {/* 3D WebGL Three.js Canvas */}
      <BridgeCanvas3D
        leftBank={leftBank}
        rightBank={rightBank}
        torchBank={torchBank}
        selectedIds={selectedIds}
        crossingTravelers={crossingTravelers}
        crossingDirection={crossingDirection}
        crossingProgress={crossingProgress}
        cameraResetTrigger={cameraResetTrigger}
        onSelectTraveler={handleSelectTraveler}
      />

      {/* In-Game HUD Controls */}
      <BridgeHUD
        level={currentLevel}
        currentLevel={currentLevel}
        levelIndex={currentLevelIndex}
        totalLevels={levelList.length}
        elapsedTime={elapsedTime}
        torchBank={torchBank}
        selectedIds={selectedIds}
        leftBank={leftBank}
        rightBank={rightBank}
        isMuted={isMuted}
        onlineRoom={onlineRoom}
        myUid={myUid}
        isCrossing={crossingTravelers !== null}
        canUndo={history.length > 0 && crossingTravelers === null && !isLevelComplete && !onlineRoom}
        canCross={selectedIds.length > 0 && crossingTravelers === null && !isLevelComplete}
        onSelectTraveler={handleSelectTraveler}
        onExecuteCrossing={handleCross}
        onCross={handleCross}
        onUndo={handleUndo}
        onRestart={handleRestart}
        onResetCamera={handleResetCamera}
        onToggleMute={onToggleMute}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onExitRoom={handleExitRoom}
      />

      {/* Slide Navigation Drawer */}
      <BridgeSlideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        progress={progress}
        totalLevels={levelList.length}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onReturnToHub={onReturnToHub}
      />

      {/* Victory Modal */}
      <BridgeVictoryModal
        isOpen={isLevelComplete}
        level={currentLevel}
        levelIndex={currentLevelIndex}
        totalLevels={levelList.length}
        elapsedTime={elapsedTime}
        onNextLevel={handleNextLevel}
        onReplay={handleRestart}
        onOpenLevelSelect={() => {
          setIsLevelComplete(false);
          setIsLevelSelectOpen(true);
        }}
        onCompareOptimal={() => {
          setIsLevelComplete(false);
          setIsComparisonOpen(true);
        }}
      />

      {/* Level Select Modal */}
      <BridgeLevelSelectModal
        isOpen={isLevelSelectOpen}
        levels={levelList}
        currentLevelIndex={currentLevelIndex}
        progress={progress}
        onSelectLevel={handleSelectLevel}
        onClose={() => setIsLevelSelectOpen(false)}
      />

      {/* How To Play Modal */}
      <BridgeHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* AI Comparison Modal */}
      <BridgeComparisonModal
        isOpen={isComparisonOpen}
        currentLevel={currentLevel}
        playerTime={elapsedTime}
        onClose={() => setIsComparisonOpen(false)}
      />

      {/* Custom Bridge Level Sandbox Editor */}
      <BridgeEditorModal
        isOpen={isSandboxOpen}
        onPlayCustomLevel={handlePlayCustomLevel}
        onClose={() => setIsSandboxOpen(false)}
      />
    </div>
  );
};
