import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Search, CheckCircle2, XCircle, Share2, Info } from 'lucide-react';

const dailySongPool = {
  easy: {
    title: "ฝนตกไหม",
    artist: "Three Man Down",
    audio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/71/6a/51/716a51d9-8356-896c-b362-d27376c8db80/mza_1067253578794403328.plus.aac.p.m4a"
  },
  medium: {
    title: "พิง",
    artist: "NONT TANONT",
    audio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/a4/60/76/a4607632-6a84-93ec-e889-25f00c732cb6/mza_14093952702161730030.plus.aac.p.m4a"
  },
  hard: {
    title: "ซ่อนกลิ่น",
    artist: "Palmy",
    audio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/6c/42/47/6c42472d-3d46-4e5c-02cf-37b51b34e402/mza_1669226168923058862.plus.aac.p.m4a"
  },
  expert: {
    title: "คิดแต่ไม่ถึง",
    artist: "Tilly Birds",
    audio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/43/8d/4b/438d4b3c-6239-0d19-4869-2f2b3e8c05bb/mza_11977755866164287848.plus.aac.p.m4a"
  },
  impossible: {
    title: "ลบไม่ได้ช่วยให้ลืม",
    artist: "Ink Waruntorn",
    audio: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/31/5b/19/315b19b6-8c41-7994-4061-26c71048b613/mza_2375836894082218858.plus.aac.p.m4a"
  }
};

const ALL_ANSWERS = [
  "ฝนตกไหม - Three Man Down",
  "พิง - NONT TANONT",
  "ซ่อนกลิ่น - Palmy",
  "คิดแต่ไม่ถึง - Tilly Birds",
  "ลบไม่ได้ช่วยให้ลืม - Ink Waruntorn",
  "โต๊ะริม - NONT TANONT",
  "เพื่อนเล่น ไม่เล่นเพื่อน - Tilly Birds",
  "แสงสุดท้าย - Bodyslam",
  "นะหน้าทอง - Joey Phuwasit",
  "ทรงอย่างแบด - Paper Planes"
];

const DEFAULT_DIFFICULTIES = [
  { id: 'easy', label: 'Easy', color: 'bg-green-500' },
  { id: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { id: 'hard', label: 'Hard', color: 'bg-orange-500' },
  { id: 'expert', label: 'Expert', color: 'bg-red-500' },
  { id: 'impossible', label: 'Impossible', color: 'bg-purple-500' }
];

const TIME_STEPS = [0.5, 2.0, 5.0, 10.0, 15.0, 30.0];
const MAX_GUESSES = 6;
const MAX_DURATION = 30.0;

export default function App() {
  const [currentDiff, setCurrentDiff] = useState('easy');
  const [timeRemaining, setTimeRemaining] = useState('23:59:59');
  
  const [gameStates, setGameStates] = useState({
    easy: { guesses: [], step: 0, status: 'playing' },
    medium: { guesses: [], step: 0, status: 'playing' },
    hard: { guesses: [], step: 0, status: 'playing' },
    expert: { guesses: [], step: 0, status: 'playing' },
    impossible: { guesses: [], step: 0, status: 'playing' }
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const audioRef = useRef(null);
  const animationRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const currentState = gameStates[currentDiff];
  const currentSong = dailySongPool[currentDiff];
  const currentAllowedTime = TIME_STEPS[currentState.step];
  const currentCorrectAnswer = `${currentSong.title} - ${currentSong.artist}`;

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

  useEffect(() => {
    const checkAudioTime = () => {
      if (audioRef.current && isPlaying) {
        const currentTime = audioRef.current.currentTime;
        setProgress(currentTime);

        if (currentTime >= currentAllowedTime) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
          setProgress(0);
        } else {
          animationRef.current = requestAnimationFrame(checkAudioTime);
        }
      }
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(checkAudioTime);
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, currentAllowedTime]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
    setIsPlaying(false);
    setProgress(0);
  }, [currentDiff]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.error("Audio playback error:", e));
    }
  };

  const handleGuess = (guessValue) => {
    if (currentState.status !== 'playing') return;

    const isCorrect = guessValue === currentCorrectAnswer;
    const newGuesses = [...currentState.guesses, { text: guessValue, isCorrect }];
    
    let newStatus = 'playing';
    let newStep = currentState.step;

    if (isCorrect) {
      newStatus = 'won';
      newStep = TIME_STEPS.length - 1;
    } else if (newGuesses.length >= MAX_GUESSES) {
      newStatus = 'lost';
      newStep = TIME_STEPS.length - 1;
    } else {
      newStep = Math.min(currentState.step + 1, TIME_STEPS.length - 1);
    }

    setGameStates(prev => ({
      ...prev,
      [currentDiff]: { guesses: newGuesses, step: newStep, status: newStatus }
    }));
    
    setSearchInput('');
    setShowDropdown(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setProgress(0);
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

      <div className="w-full max-w-2xl bg-slate-900 p-1.5 rounded-2xl flex gap-1 mb-10 border border-slate-800">
        {DEFAULT_DIFFICULTIES.map(diff => (
          <button
            key={diff.id}
            onClick={() => setCurrentDiff(diff.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer z-10
              ${currentDiff === diff.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <div className={`w-2 h-2 rounded-full ${diff.color}`} />
            {diff.label}
          </button>
        ))}
      </div>

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

      <div className="mb-12 relative z-20">
        <button 
          onClick={togglePlay}
          className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-slate-950 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
        </button>
      </div>

      {currentState.status === 'playing' && (
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

      {currentState.status !== 'playing' && (
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8 text-center z-20">
          <h2 className="text-2xl font-black mb-2">
            {currentState.status === 'won' ? <span className="text-cyan-400">CORRECT! 🎯</span> : <span className="text-red-400">GAME OVER 💔</span>}
          </h2>
          <p className="text-slate-400 mb-6">The song was: <br/><span className="text-xl text-white font-bold">{currentCorrectAnswer}</span></p>
          <button 
            onClick={() => alert("Result copied!")}
            className="inline-flex items-center gap-2 bg-cyan-400 text-slate-950 font-black px-8 py-3 rounded-full cursor-pointer"
          >
            <Share2 size={20} /> SHARE RESULT
          </button>
        </div>
      )}

      <div className="w-full max-w-2xl space-y-3">
        {[...Array(MAX_GUESSES)].map((_, i) => {
          const guess = currentState.guesses[i];
          const isCurrentRow = i === currentState.guesses.length;
          
          return (
            <div 
              key={i} 
              className={`flex items-center p-4 rounded-xl border-2 transition-all
                ${guess 
                  ? guess.isCorrect ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-red-500 bg-red-500/10 text-red-400'
                  : isCurrentRow && currentState.status === 'playing' ? 'border-slate-700 bg-slate-900' : 'border-slate-800 bg-transparent'}`}
            >
              <div className="w-6 font-mono text-slate-500 text-sm">{i + 1}</div>
              <div className="flex-1 px-4 font-medium truncate">
                {guess ? guess.text : (isCurrentRow && currentState.status === 'playing' ? <span className="text-slate-600">Guess #{i + 1}...</span> : '')}
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
