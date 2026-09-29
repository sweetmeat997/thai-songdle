import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Search, CheckCircle2, XCircle, Info } from 'lucide-react';

// คลังเพลงหลัก (5 เพลง) แก้ไข เพิ่ม หรือเปลี่ยนลิงก์ตรงนี้ได้ตลอดเวลาบน GitHub
const MASTER_SONG_LIBRARY = [
  { 
    title: "ฝนตกไหม", 
    artist: "Three Man Down", 
    audio: "https://files.catbox.moe/5a7lll.mp3" 
  },
  { 
    title: "พิง", 
    artist: "NONT TANONT", 
    audio: "https://files.catbox.moe/33rs0y.mp3" 
  },
  { 
    title: "ซ่อนกลิ่น", 
    artist: "Palmy", 
    audio: "https://files.catbox.moe/bhcdd3.mp3" 
  },
  { 
    title: "คิดแต่ไม่ถึง", 
    artist: "Tilly Birds", 
    audio: "https://files.catbox.moe/0bom5h.mp3" 
  },
  { 
    title: "ลบไม่ได้ช่วยให้ลืม", 
    artist: "Ink Waruntorn", 
    audio: "https://files.catbox.moe/be0kr1.mp3" 
  }
];

const ALL_ANSWERS = MASTER_SONG_LIBRARY.map(song => `${song.title} - ${song.artist}`);

const TIME_STEPS = [0.5, 2.0, 5.0, 10.0, 15.0, 30.0];
const MAX_GUESSES = 6;
const MAX_DURATION = 30.0;

export default function App() {
  const [timeRemaining, setTimeRemaining] = useState('23:59:59');
  const [guesses, setGuesses] = useState([]);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('playing'); // playing, won, lost

  const [isPlaying, setIsPlaying] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef(null);

  // เลือกเพลงประจำวัน (อิงตามวันที่ เพื่อให้ทุกคนได้เล่นเพลงเดียวกัน)
  const getDailySong = () => {
    const today = new Date();
    const dayIndex = Math.floor(today.setHours(0,0,0,0) / (1000 * 60 * 60 * 24));
    return MASTER_SONG_LIBRARY[dayIndex % MASTER_SONG_LIBRARY.length];
  };

  const currentSong = getDailySong();
  const currentAllowedTime = TIME_STEPS[step];
  const currentCorrectAnswer = `${currentSong.title} - ${currentSong.artist}`;

  // นับถอยหลังเปลี่ยนเพลงใหม่ทุกเที่ยงคืน
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow - now;

      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ควบคุมเวลาเล่นเสียงเพลงไม่ให้เกินสเตปที่ปลดล็อก
  useEffect(() => {
    let animationFrame;
    const updateProgress = () => {
      if (audioRef.current && isPlaying) {
        const currentTime = audioRef.current.currentTime;
        setProgress(currentTime);

        if (currentTime >= currentAllowedTime) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
          setProgress(0);
        } else {
          animationFrame = requestAnimationFrame(updateProgress);
        }
      }
    };

    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.log("Play error:", err);
        setIsPlaying(false);
      });
      animationFrame = requestAnimationFrame(updateProgress);
    } else if (audioRef.current) {
      audioRef.current.pause();
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, currentAllowedTime]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
    } else {
      setIsPlaying(true);
    }
  };

  const handleGuess = (guessValue) => {
    if (status !== 'playing') return;

    const isCorrect = guessValue === currentCorrectAnswer;
    const newGuesses = [...guesses, { text: guessValue, isCorrect }];
    
    let newStatus = 'playing';
    let newStep = step;

    if (isCorrect) {
      newStatus = 'won';
      newStep = TIME_STEPS.length - 1;
    } else if (newGuesses.length >= MAX_GUESSES) {
      newStatus = 'lost';
      newStep = TIME_STEPS.length - 1;
    } else {
      newStep = Math.min(step + 1, TIME_STEPS.length - 1);
    }

    setGuesses(newGuesses);
    setStep(newStep);
    setStatus(newStatus);
    
    setSearchInput('');
    setShowDropdown(false);
    setIsPlaying(false);
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleSkip = () => {
    handleGuess('SKIPPED');
  };

  const filteredAnswers = ALL_ANSWERS.filter(ans => 
    ans.toLowerCase().includes(searchInput.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-8 px-4 font-sans select-none">
      <audio ref={audioRef} src={currentSong.audio} preload="auto" />

      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black tracking-tighter text-cyan-400">THAI SONGDLE</h1>
        <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-800 text-sm">
          <Info size={16} className="text-cyan-400" />
          <span>Next song in: {timeRemaining}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-12">
        <div className="relative h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="absolute top-0 left-0 h-full bg-slate-800"
            style={{ width: `${(currentAllowedTime / MAX_DURATION) * 100}%` }}
          />
          <div 
            className="absolute top-0 left-0 h-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] transition-all duration-75"
            style={{ width: `${(progress / MAX_DURATION) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-slate-400 font-medium">
          <span>0s</span>
          <span className="text-cyan-400 font-bold">{currentAllowedTime}s unlocked</span>
          <span>30s</span>
        </div>
      </div>

      {/* Play Button */}
      <div className="mb-12 relative z-20">
        <button 
          onClick={togglePlay}
          className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-slate-950 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
        </button>
      </div>

      {/* Search & Skip Controls */}
      {status === 'playing' && (
        <div className="w-full max-w-2xl flex gap-3 mb-8 relative z-20">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={20} className="text-slate-500" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Type song title or artist..."
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-400"
            />
            
            {showDropdown && searchInput.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50">
                {filteredAnswers.length > 0 ? (
                  filteredAnswers.map((ans, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleGuess(ans)}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-800 border-b border-slate-800 last:border-0 cursor-pointer"
                    >
                      {ans}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500">No matching songs found.</div>
                )}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleSkip}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
          >
            <SkipForward size={20} />
            Skip
          </button>
        </div>
      )}

      {/* Game Over / Win State (No Share Button) */}
      {status !== 'playing' && (
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8 text-center z-20">
          <h2 className="text-2xl font-black mb-2">
            {status === 'won' ? <span className="text-cyan-400">CORRECT! 🎯</span> : <span className="text-red-400">GAME OVER 💔</span>}
          </h2>
          <p className="text-slate-400 mb-2">The song was:</p>
          <span className="text-xl text-white font-bold">{currentCorrectAnswer}</span>
        </div>
      )}

      {/* Guess Rows */}
      <div className="w-full max-w-2xl space-y-3">
        {[...Array(MAX_GUESSES)].map((_, i) => {
          const guess = guesses[i];
          const isCurrentRow = i === guesses.length;
          
          return (
            <div 
              key={i} 
              className={`flex items-center p-4 rounded-xl border-2 transition-all
                ${guess 
                  ? guess.isCorrect ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-red-500 bg-red-500/10 text-red-400'
                  : isCurrentRow && status === 'playing' ? 'border-slate-700 bg-slate-900' : 'border-slate-800 bg-transparent'}`}
            >
              <div className="w-6 font-mono text-slate-500 text-sm">{i + 1}</div>
              <div className="flex-1 px-4 font-medium truncate">
                {guess ? guess.text : (isCurrentRow && status === 'playing' ? <span className="text-slate-600">Guess #{i + 1}...</span> : '')}
              </div>
              <div>
                {guess && (guess.isCorrect ? <CheckCircle2 className="text-cyan-400" size={20} /> : <XCircle className="text-red-400" size={20} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
