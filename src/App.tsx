import { useState, useEffect } from 'react';
import { GroupList } from './components/GroupList.tsx';
import { TelegramUserData, UserAccessState } from './types.ts';
import {
  getDetectedTelegramUser,
  loadUserAccess,
  saveUserAccess,
  clearUserAccess,
  triggerHaptic,
  sounds,
} from './utils/telegram.ts';
import { Lock, Unlock, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

const TARGET_CODE = '75996';

export default function App() {
  const [currentUser] = useState<TelegramUserData>(getDetectedTelegramUser());
  const [accessState, setAccessState] = useState<UserAccessState | null>(null);

  // Keypad state
  const [digits, setDigits] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync access state
  useEffect(() => {
    const saved = loadUserAccess(currentUser.id);
    if (saved) {
      setAccessState(saved);
    } else {
      setAccessState({
        hasPaid: false,
        hasEnteredCode: false,
        telegramUser: currentUser,
      });
    }
  }, [currentUser]);

  const isUnlocked = Boolean(accessState?.hasEnteredCode);

  // Physical keyboard support when locked
  useEffect(() => {
    if (isUnlocked || isSuccess) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleAddDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, isSuccess, digits]);

  const handleAddDigit = (num: string) => {
    if (digits.length >= TARGET_CODE.length || isSuccess) return;

    sounds.playKeypress();
    triggerHaptic('light');

    const nextDigits = digits + num;
    setDigits(nextDigits);
    setIsError(false);

    if (nextDigits.length === TARGET_CODE.length) {
      if (nextDigits === TARGET_CODE) {
        setIsSuccess(true);
        sounds.playVaultOpen();
        triggerHaptic('success');

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00b4d8', '#0077b6', '#38bdf8', '#ffffff'],
          });
        } catch {
          // Ignore
        }

        setTimeout(() => {
          const updated: UserAccessState = {
            hasPaid: true,
            hasEnteredCode: true,
            telegramUser: currentUser,
            paidAt: new Date().toISOString(),
          };
          setAccessState(updated);
          saveUserAccess(updated);
          setIsSuccess(false);
          setDigits('');
        }, 800);
      } else {
        setIsError(true);
        sounds.playError();
        triggerHaptic('error');
        setTimeout(() => {
          setDigits('');
        }, 600);
      }
    }
  };

  const handleBackspace = () => {
    if (digits.length > 0 && !isSuccess) {
      sounds.playKeypress();
      triggerHaptic('light');
      setDigits((prev) => prev.slice(0, -1));
      setIsError(false);
    }
  };

  const handleClear = () => {
    sounds.playKeypress();
    triggerHaptic('light');
    setDigits('');
    setIsError(false);
  };

  const handleResetAccess = () => {
    clearUserAccess(currentUser.id);
    setAccessState({
      hasPaid: false,
      hasEnteredCode: false,
      telegramUser: currentUser,
    });
    setDigits('');
    setIsError(false);
    setIsSuccess(false);
    triggerHaptic('medium');
  };

  return (
    <div className="min-h-screen bg-[#050811] bg-vault-grid text-slate-100 flex flex-col items-center px-4 py-6 selection:bg-cyan-500 selection:text-white">
      {/* Top subtle bar with user handle and test reset option */}
      <div className="w-full max-w-xl flex items-center justify-between mb-4 text-xs text-slate-500">
        <span className="font-mono text-cyan-400/80">{currentUser.username}</span>
        {isUnlocked && (
          <button
            onClick={handleResetAccess}
            className="flex items-center gap-1 text-slate-500 hover:text-cyan-400 transition"
            title="Lock app again"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        )}
      </div>

      {/* Picture of the UK Vault thing */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto mb-6 flex justify-center">
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border border-cyan-400/40 shadow-[0_0_35px_rgba(6,182,212,0.35)] bg-[#050914]">
          <img
            src="/assets/aistudio/D3B5526D-CEAA-439C-92DC-0CC97EF1385B_ca2cc99e.png"
            alt="UK Content Vault"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isUnlocked ? (
        /* Links Only */
        <GroupList />
      ) : (
        /* Code Input Keypad (Clean & Direct) */
        <div className="w-full max-w-xs mx-auto flex flex-col items-center">
          {/* Lock Icon */}
          <div className="mb-3">
            <div
              className={`w-12 h-12 rounded-full border ${
                isSuccess
                  ? 'border-emerald-400 bg-emerald-950/40 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                  : isError
                  ? 'border-red-400 bg-red-950/40 text-red-400 shadow-[0_0_20px_rgba(248,113,113,0.4)]'
                  : 'border-cyan-400 bg-[#071128] text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              } flex items-center justify-center transition-all duration-200`}
            >
              {isSuccess ? <Unlock className="w-5 h-5 animate-bounce" /> : <Lock className="w-5 h-5" />}
            </div>
          </div>

          {/* 5-Pin Display */}
          <div
            className={`flex justify-center items-center gap-2.5 mb-5 ${
              isError ? 'animate-shake' : ''
            }`}
          >
            {Array.from({ length: TARGET_CODE.length }).map((_, index) => {
              const hasChar = index < digits.length;
              return (
                <div
                  key={index}
                  className={`w-10 h-12 rounded-xl border flex items-center justify-center text-lg font-bold font-mono transition-all duration-150 ${
                    isSuccess
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                      : hasChar
                      ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                      : 'border-cyan-500/20 bg-[#081024] text-slate-600'
                  }`}
                >
                  {hasChar ? (isSuccess ? digits[index] : '●') : ''}
                </div>
              );
            })}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full mb-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleAddDigit(num)}
                disabled={isSuccess}
                className="h-12 rounded-xl bg-[#0b1633] border border-cyan-500/25 hover:border-cyan-400/70 hover:bg-[#0f1f45] active:scale-95 text-white font-bold text-lg transition duration-150 shadow-sm flex items-center justify-center"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              disabled={isSuccess}
              className="h-12 rounded-xl bg-[#091128] border border-slate-700/60 hover:border-red-400/50 hover:text-red-300 text-slate-400 font-semibold text-xs transition duration-150 flex items-center justify-center"
            >
              CLEAR
            </button>

            <button
              type="button"
              onClick={() => handleAddDigit('0')}
              disabled={isSuccess}
              className="h-12 rounded-xl bg-[#0b1633] border border-cyan-500/25 hover:border-cyan-400/70 hover:bg-[#0f1f45] active:scale-95 text-white font-bold text-lg transition duration-150 flex items-center justify-center"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              disabled={isSuccess}
              className="h-12 rounded-xl bg-[#091128] border border-slate-700/60 hover:border-cyan-400/50 text-slate-300 font-bold text-base transition duration-150 flex items-center justify-center"
            >
              ⌫
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
