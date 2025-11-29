interface PlayButtonProps {
  isPlaying: boolean;
  onClick: () => void;
}

export function PlayButton({ isPlaying, onClick }: PlayButtonProps) {
  return (
    <button
      id="play-button"
      onClick={onClick}
      className={`
        w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-lg transition-all duration-300
        ${isPlaying 
          ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-pink-500/50 hover:scale-105 active:scale-95' 
          : 'bg-slate-700 hover:bg-slate-600 text-slate-300 shadow-black/30 hover:scale-105 active:scale-95'
        }
      `}
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      {isPlaying ? (
        <svg className="w-12 h-12 fill-current" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg className="w-12 h-12 fill-current ml-1" viewBox="0 0 24 24">
          <path 
            d="M8 5v14l11-7z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      )}
    </button>
  );
}

