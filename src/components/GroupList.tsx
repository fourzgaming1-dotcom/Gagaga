import React, { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { USER_VAULT_LINKS } from '../data/links.ts';
import { triggerHaptic, sounds } from '../utils/telegram.ts';

export const GroupList: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    sounds.playKeypress();
    triggerHaptic('light');

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-2.5">
      {USER_VAULT_LINKS.map((item) => {
        const isCopied = copiedId === item.id;
        const displayText = item.title ? `${item.title} - ${item.url}` : item.url;

        return (
          <div
            key={item.id}
            className={`w-full rounded-xl border transition-all duration-200 flex items-center justify-between p-3.5 group ${
              item.isMegaFolder
                ? 'bg-gradient-to-r from-blue-950/70 to-[#07132c] border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : item.isAddlist
                ? 'bg-gradient-to-r from-cyan-950/70 to-[#07132c] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                : 'bg-[#070e20] border-cyan-500/25 hover:border-cyan-400/60'
            }`}
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHaptic('light')}
              className="flex-1 flex items-center gap-2.5 min-w-0 pr-3"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition" />
              <span className="font-mono text-xs sm:text-sm text-cyan-200 group-hover:text-white truncate font-medium">
                {displayText}
              </span>
            </a>

            <button
              type="button"
              onClick={(e) => handleCopy(item.id, item.url, e)}
              className="shrink-0 p-2 rounded-lg bg-[#0b1633] border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 transition"
              title="Copy link"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
