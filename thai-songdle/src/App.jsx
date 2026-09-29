import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Search, CheckCircle2, XCircle, Share2, Info } from 'lucide-react';

// คลังเพลงโดยใช้ YouTube Video ID
const MASTER_SONG_LIBRARY = [
  { title: "ฝนตกไหม", artist: "Three Man Down", youtubeId: "36Y1v27T7OM" },
  { title: "พิง", artist: "NONT TANONT", youtubeId: "V54w1a_9-94" },
  { title: "ซ่อนกลิ่น", artist: "Palmy", youtubeId: "V6709h0i_10" },
  { title: "คิดแต่ไม่ถึง", artist: "Tilly Birds", youtubeId: "7L2f9y8z1k0" },
  { title: "ลบไม่ได้ช่วยให้ลืม", artist: "Ink Waruntorn", youtubeId: "6X4z2q3w8v0" }
];

const ALL_ANSWERS = MASTER_SONG_LIBRARY.map(song => `${song.title} - ${song.artist}`);

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
  const [progress, setProgress] = useState(0);

  const playerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const currentState = gameStates[currentDiff];
  
  // สลับเพลงประจำวันตามวันที่
  const getDailySong = () => {
    const today = new Date();
    const dayIndex = Math.floor(today.setHours(0,0,0,0) / (1000 * 60 * 60 * 24));
    return MASTER_SONG_LIBRARY[dayIndex % MASTER_SONG_LIBRARY.length];
  };

  const currentSong = getDailySong();
  const currentAllowedTime = TIME_STEPS[currentState.step];
  const currentCorrectAnswer = `${currentSong.title} - ${currentSong.artist}`;

  // โหลด YouTube IFrame API Script เข้ามาในระบบ
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer(currentSong.youtubeId);
      };
    } else if (window.YT && window.YT.Player) {
      initPlayer(currentSong.youtubeId);
    }
  }, []);

  const initPlayer = (videoId) => {
    playerRef.current = new window.YT.Player('youtube-player', {
      height: '0',
      width: '0',
      videoId: videoId,
      playerVars: {
        'playsinline': 1,
        'controls': 0,
      },
      events: {
        'onReady': () => setIsPlayerReady(true),
        'onStateChange': onPlayerStateChange
      }
    });
  };

  const onPlayerStateChange = (event) => {
    // ถ้าเล่นเพลงจบหรือเกินเวลาที่กำหนด ให้หยุด
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  // ควบคุมเวลาเล่นไม่ให้เกินโควตาสเตป
  useEffect(() => {
    let interval;
    if (isPlaying && isPlayerReady) {
      const startTime = Date.now() - (progress * 1000);
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= currentAllowedTime) {
          if (playerRef.current && playerRef.current.pauseVideo) {
            playerRef.current.pauseVideo();
            playerRef.current.seekTo(0);
          }
          setIsPlaying(false);
          setProgress(0);
          clearInterval(interval);
        } else {
          setProgress(elapsed);
        }
      }, 50);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentAllowedTime, isPlayerReady]);

  const togglePlay = () => {
    if (!isPlayerReady || !playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();
      setIsPlaying(true);
      setProgress(0);
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
    if (playerRef.current && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo();
      playerRef.current.seekTo(0);
    }
    setIsPlaying(false);
    setProgress(0);
  };

  const handleSkip = () => {
    handleGuess('SKIPPED');
  };

  const filteredAnswers = ALL_ANSWERS.filter(ans => 
    ans.toLowerCase().includes(searchInput.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-8 px-4 font-sans select-none">
      {/* ซ่อน YouTube Player ไว้ตรงนี้ */}
      <div id="youtube-player" className="hidden"></div>

      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black tracking-tighter text-cyan-400">THAI SONGDLE</h1>
        <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-800 text-sm">
          <Info size={16} className="text-cyan-400" />
          <span>New Song Daily</span>
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