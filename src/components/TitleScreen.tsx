import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  FileText, 
  Play, 
  Pause, 
  Upload, 
  ShieldAlert, 
  Info,
  ChevronRight,
  Sparkles,
  Lock,
  Compass,
  X,
  HelpCircle
} from 'lucide-react';

interface TitleScreenProps {
  onStartClick: () => void;
  onOpenArgWeb?: () => void;
}

export default function TitleScreen({ onStartClick, onOpenArgWeb }: TitleScreenProps) {
  // 몰입형 프롤로그 오버레이 상태 (첫 진입 시 신비로운 타이프라이터 연출)
  const [showPrologue, setShowPrologue] = useState(true);
  const [prologueProgress, setPrologueProgress] = useState(0);
  
  const [soundOn, setSoundOn] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  
  // 모달/서브레이어 제어 상태들
  const [showPledgeFolder, setShowPledgeFolder] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<'seoyeon' | 'gyuri' | 'suin' | 'aran' | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showAutoSaveToast, setShowAutoSaveToast] = useState(false);
  
  // 지능 수집: 지문 스캐닝 제어 상태
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);
  const [fingerprintClueUnlocked, setFingerprintClueUnlocked] = useState(false);

  // 입사(입소) 동의 서약 서류 상태값
  const [applicantName, setApplicantName] = useState('권서연');
  const [selectedTrack, setSelectedTrack] = useState('A');
  const [agreedPledges, setAgreedPledges] = useState({
    noDevice: true,
    bioTracking: true,
    analogConsent: true,
    gasRoomConsent: false, // 가스방 필수 동동의
  });
  
  const [touchedSubmit, setTouchedSubmit] = useState(false);

  // 비디오 파일 로드 관리 상태
  const [videoSrc, setVideoSrc] = useState<string | null>('/eden.mp4');
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const monitorVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(true);

  // CCTV 시뮬레이터 제어 상태
  const [selectedCam, setSelectedCam] = useState<number>(0);
  const [viewOriginalVideo, setViewOriginalVideo] = useState<boolean>(true);

  // 프롤로그 타이프라이터 진행
  const PROLOGUE_TEXTS = [
    "에덴 기숙학원... 상위 0.1% 최고 귀빈 우성 인류 육성이라는 명분 뒤에 숨겨진,",
    "깊고 거대한 생체 개조 및 복제 신체 실험실.",
    "그곳에서 내 가장 소중한 실종 친구 규리가 흔적도 없이 사라졌다.",
    "학원의 공식 조사 기록은 단 한 줄의 '자진 무단 탈색'으로 규정되어 종결됐다.",
    "나 서연은 규리를 찾기 위해 신상과 성명서, 그리고 안전 검열을 위조한 채",
    "이 차갑고 적막이 스민 에덴의 입소 문턱을 넘기로 작정한다.",
    "친구의 자취를 담은 빗장을 돌려 탈출하지 못한다면,",
    "나 역시 이 차가운 학원 가스실 아래에서 흔적도 없이 소각될 것이다..."
  ];

  useEffect(() => {
    if (showPrologue) {
      const interval = setInterval(() => {
        setPrologueProgress(prev => {
          if (prev >= PROLOGUE_TEXTS.length - 1) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [showPrologue]);

  // 실시간 디지털 시간 갱신 (오차 없이 매초 갱신)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = String(hours).padStart(2, '0');
      const strMinutes = String(now.getMinutes()).padStart(2, '0');
      const strSeconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${ampm} ${strHours}:${strMinutes}:${strSeconds}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 비디오 음소거 처리 싱크 및 브라우저 오토플레이 복구 부스팅 훅
  useEffect(() => {
    const triggerAudioVisualPlayback = () => {
      if (bgVideoRef.current) {
        bgVideoRef.current.muted = !soundOn;
        bgVideoRef.current.play().catch(() => {});
      }
      if (monitorVideoRef.current) {
        monitorVideoRef.current.muted = !soundOn;
        monitorVideoRef.current.play().catch(() => {});
      }
    };

    triggerAudioVisualPlayback();
    
    // 브라우저 차단 우회를 위한 전역 마운트 제스처 감지 리스너 등록
    window.addEventListener('click', triggerAudioVisualPlayback, { once: true });
    window.addEventListener('touchstart', triggerAudioVisualPlayback, { once: true });
    return () => {
      window.removeEventListener('click', triggerAudioVisualPlayback);
      window.removeEventListener('touchstart', triggerAudioVisualPlayback);
    };
  }, [videoSrc, soundOn]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoPlaying(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setVideoSrc(url);
        setVideoPlaying(true);
      }
    }
  };

  const toggleVideoPlay = () => {
    const nextPlaying = !videoPlaying;
    setVideoPlaying(nextPlaying);
    
    if (bgVideoRef.current) {
      if (nextPlaying) {
        bgVideoRef.current.play().catch(() => {});
      } else {
        bgVideoRef.current.pause();
      }
    }
    if (monitorVideoRef.current) {
      if (nextPlaying) {
        monitorVideoRef.current.play().catch(() => {});
      } else {
        monitorVideoRef.current.pause();
      }
    }
  };

  // 피손 지문 스캔 시뮬레이션
  const handleFingerprintScan = () => {
    if (fingerprintClueUnlocked) return;
    setIsScanningFingerprint(true);
    setTimeout(() => {
      setIsScanningFingerprint(false);
      setFingerprintClueUnlocked(true);
    }, 2000);
  };

  const isFormValid = applicantName.trim() !== '' && 
                      agreedPledges.noDevice && 
                      agreedPledges.bioTracking && 
                      agreedPledges.analogConsent && 
                      agreedPledges.gasRoomConsent;

  const handleSubmitAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedSubmit(true);
    if (isFormValid) {
      onStartClick();
    }
  };

  return (
    <section 
      id="s-game-launcher"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex h-full w-full flex-col bg-[#07070a] text-[#E6E4F4] overflow-hidden select-none font-sans"
    >
      
      {/* ────────────────────────────────────────────────────────
           A. CINEMATIC PROLOGUE OVERLAY SCREEN (타이프라이터 프롤로그)
         ──────────────────────────────────────────────────────── */}
      {showPrologue && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050508] bg-radial-gradient px-8 py-12 text-center transition-all duration-1000">
          
          {/* 가벼운 안개 연출 */}
          <div className="absolute bottom-[-10%] w-[120%] h-[50%] bg-[radial-gradient(ellipse_at_center,rgba(212,184,106,0.03)_0%,transparent_70%)] animate-pulse pointer-events-none"></div>

          <div className="max-w-xl w-full space-y-6 z-10">
            <span className="font-mono text-[9px] text-[#d4b86a] tracking-[0.3em] uppercase block font-bold animate-pulse">
              🛡️ CLASSIFIED MEMOIR · PROLOGUE
            </span>

            {/* 프롤로그 타이머 스토리 라인 기술 */}
            <div className="min-h-[220px] flex flex-col justify-center space-y-3.5 select-text p-6 md:p-8 rounded border border-white/5 bg-[#09090f]/75 backdrop-blur-md shadow-2xl">
              {PROLOGUE_TEXTS.map((t, idx) => (
                <p 
                  key={idx} 
                  className={`text-xs md:text-sm font-serif text-[#a6a2c2] leading-relaxed transition-all duration-1000 ${
                    idx <= prologueProgress ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 pointer-events-none'
                  }`}
                >
                  {t}
                </p>
              ))}
            </div>

            {/* 개시 하부 장착바 */}
            <div className="pt-6 space-y-3">
              <button 
                onClick={() => setShowPrologue(false)}
                className="px-8 py-3.5 rounded font-serif text-xs font-black tracking-[0.2em] bg-gradient-to-r from-[#d4b86a] to-[#f3d995] text-[#07070a] shadow-[0_0_20px_rgba(212,184,106,0.3)] hover:shadow-[0_0_35px_rgba(212,184,106,0.5)] cursor-pointer transition-all active:translate-y-0.5"
              >
                잠입 인가증 확인 및 구청 게이트 진입
              </button>
              
              <div className="flex justify-center">
                <button 
                  onClick={() => setShowPrologue(false)}
                  className="font-mono text-[10px] text-gray-500 hover:text-gray-400 bg-transparent border-none cursor-pointer underline"
                >
                  기다리지 않고 즉시 건너뛰기 (Skip Prologue)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           B. IMMERSIVE VIDEO BACKGROUND (비디오 백그라운드)
         ──────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {videoSrc ? (
          <div className="w-full h-full relative">
            <video 
              ref={bgVideoRef}
              src={videoSrc}
              className="w-full h-full object-cover opacity-55 transition-opacity duration-1000 scale-[1.02]"
              autoPlay
              loop
              muted={!soundOn}
              playsInline
              onError={() => {
                console.warn('Default video not found or format error. Keeping visual layout.');
                setVideoSrc(null);
              }}
            />
            {/* 비디오 가장자리 Vignette 어둠 그라디언트 차폐막 */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-transparent to-[#07070a]/90"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#07070a] via-transparent to-[#07070a]"></div>
          </div>
        ) : (
          /* 비디오 미동작 폴백: 웅장한 아치형 기둥 대문 CSS */
          <div className="w-full h-full relative flex items-center justify-center bg-[#07070a]">
            <div className="absolute bottom-0 inset-x-0 h-[80%] opacity-20 pointer-events-none flex justify-center items-end">
              <div className="w-[1200px] h-full flex justify-between items-end px-12 relative">
                <div className="w-20 h-[80%] bg-gradient-to-t from-[#1d1911]/30 via-[#d1a851]/10 to-transparent border-x border-[#d1a851]/15 rounded-t-lg"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[420px] h-[90%] border-x-2 border-t-2 border-[#d4b86a]/15 rounded-t-[140px] bg-gradient-to-b from-black/60 via-[#0a0a0f]/95 to-[#07070a] flex flex-col justify-start pt-20 items-center">
                  <div className="w-24 h-24 rounded-full border border-[#d4b86a]/30 flex items-center justify-center bg-[#0c0c12] shadow-[0_0_20px_rgba(212,184,106,0.2)]">
                    <span className="font-serif text-3xl font-black text-[#d4b86a]">E</span>
                  </div>
                  <div className="w-32 h-64 border border-b-0 border-[#d4b86a]/10 rounded-t-full mt-10 bg-gradient-to-t from-transparent via-[#d4b86a]/5 to-transparent"></div>
                </div>
                <div className="w-20 h-[80%] bg-gradient-to-t from-[#1d1911]/30 via-[#d1a851]/10 to-transparent border-x border-[#d1a851]/15 rounded-t-lg"></div>
              </div>
            </div>
            <div className="absolute bottom-0 left-[-10%] w-[120%] h-[40%] bg-[radial-gradient(ellipse_at_center,rgba(212,184,106,0.05)_0%,transparent_70%)] animate-pulse opacity-85"></div>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────
           C. TOP NAVIGATION BAR (최고 기밀 제어 제어 띠)
         ──────────────────────────────────────────────────────── */}
      <div className="w-full h-12 border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-md flex items-center justify-between px-6 relative z-30 text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-gray-400 font-bold tracking-widest text-[9px] block sm:inline">
            SYSTEM VERSION: 1.0.0
          </span>
          <span className="text-gray-600 hidden sm:inline">|</span>
          <span className="text-gray-400 text-[10px] hidden md:inline">
            CLASSIFIED APPLET SCREEN
          </span>
        </div>

        <div className="flex items-center gap-5">
          {/* 음량 배경 사운드 온/오프 토글 */}
          <button 
            onClick={() => setSoundOn(!soundOn)}
            className="text-gray-400 hover:text-[#d4b86a] transition-all cursor-pointer bg-transparent border-none p-1 flex items-center gap-1.5 focus:outline-none"
            title="인게임 미스터리 사운드 제어"
          >
            {soundOn ? <Volume2 className="h-4 w-4 text-[#d4b86a] animate-pulse" /> : <VolumeX className="h-4 w-4" />}
            <span className="text-[10px] text-gray-500 font-bold tracking-tight hidden sm:inline">AMBIENT SOUNDS</span>
          </button>

          {/* 디지털 실시간 시계 */}
          <span className="text-gray-300 font-bold tracking-widest text-[11px] bg-black/60 px-3.5 py-1 rounded border border-white/5 shadow-inner">
            🕒 {currentTime || 'AM 05:17:32'}
          </span>

          {/* CCTV 감시 LED */}
          <span className="text-red-500 font-bold tracking-widest text-[9px] flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-600 animate-ping"></span>
            REC FEED
          </span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
           D. MAJESTIC MAIN BOARD SCREEN LAYOUT (사진 구도 완벽 이물 이관)
         ──────────────────────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-4 md:py-8 flex flex-col lg:flex-row items-stretch justify-between gap-6 relative z-10 overflow-hidden select-text">
        
        {/* [왼쪽 가닥]: 에덴 브랜드 로고 & 메인 메뉴 패러다임 */}
        <div className="w-full lg:w-[28%] flex flex-col justify-between p-5 rounded border border-[#d4b86a]/20 bg-[#0d0d12]/90 backdrop-blur-md shadow-2xl relative">
          
          <div className="space-y-6">
            
            {/* 에덴 기숙학원 아름다운 인장 상징장 (CSS 엠블럼) */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="h-20 w-20 rounded-full border-2 border-dashed border-[#d4b86a]/40 bg-[#07070a]/90 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(212,184,106,0.3)] animate-gold-shine relative group">
                <span className="font-serif text-3xl font-black text-[#d4b86a] tracking-wider">E</span>
                <div className="absolute inset-0 border border-white/5 rounded-full scale-[1.1]"></div>
              </div>
              <div className="space-y-1">
                <h1 className="font-serif text-2xl font-black tracking-tight text-white">
                  에덴 기숙학원
                </h1>
                <p className="font-mono text-[9px] tracking-[0.3em] text-[#d4b86a] uppercase font-bold">
                  EDEN BOARDING ACADEMY
                </p>
              </div>
              <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#d4b86a]/35 to-transparent"></div>
              <p className="text-[11px] text-[#9b96c0] font-serif leading-relaxed italic max-w-xs">
                "비밀이 잠든 곳, 진사만을 가리는 지옥에서 탈출하십시오."
              </p>
            </div>

            {/* 메인 메뉴 슬롯 (트래잭션 반응 박스) */}
            <div className="space-y-3">
              <button 
                onClick={() => setShowPledgeFolder(true)}
                className="w-full py-3.5 px-4 rounded border border-[#d4b86a]/20 hover:border-[#d4b86a] bg-black/40 hover:bg-[#d4b86a]/15 text-left transition-all duration-300 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">📖</span>
                  <div>
                    <span className="text-xs font-serif font-black text-white block">게임 시작</span>
                    <span className="text-[9px] font-mono text-gray-400 group-hover:text-[#d4b86a] transition-colors leading-none block mt-0.5">START GAME</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-[#d4b86a] transition-transform group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => {
                  setShowAutoSaveToast(true);
                  setTimeout(() => setShowAutoSaveToast(false), 4000);
                }}
                className="w-full py-3.5 px-4 rounded border border-white/5 bg-black/20 text-left transition-all duration-300 flex items-center justify-between group cursor-pointer hover:border-[#d4b86a]/40"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">🕒</span>
                  <div>
                    <span className="text-xs font-serif font-black text-gray-300 block">이어하기</span>
                    <span className="text-[9px] font-mono text-gray-500 leading-none block mt-0.5">CONTINUE (AUTO)</span>
                  </div>
                </div>
                <Lock className="h-3.5 w-3.5 text-gray-600" />
              </button>

              <button 
                onClick={onStartClick} // 카테고리 기동 (App.tsx 소속으로 즉시 시나리오 변환 진입)
                className="w-full py-3.5 px-4 rounded border border-[#d4b86a]/25 hover:border-[#d4b86a] bg-black/40 hover:bg-[#d4b86a]/15 text-left transition-all duration-300 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">🗺️</span>
                  <div>
                    <span className="text-xs font-serif font-black text-white block">챕터 선택</span>
                    <span className="text-[9px] font-mono text-gray-400 group-hover:text-[#d4b86a] transition-colors leading-none block mt-0.5">CHAPTER SELECT</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => {
                  setShowDossierModal(true);
                  setSelectedDossier('seoyeon');
                }}
                className="w-full py-3.5 px-4 rounded border border-[#d4b86a]/20 hover:border-[#d4b86a] bg-black/40 hover:bg-[#d4b86a]/15 text-left transition-all duration-300 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">🗄️</span>
                  <div>
                    <span className="text-xs font-serif font-black text-white block">비밀 기록실</span>
                    <span className="text-[9px] font-mono text-gray-400 group-hover:text-[#d4b86a] transition-colors leading-none block mt-0.5">ARCHIVES DOSSIERS</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => setShowSettingsModal(true)}
                className="w-full py-3.5 px-4 rounded border border-white/5 hover:border-[#d4b86a]/30 bg-black/20 hover:bg-black/50 text-left transition-all duration-300 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">⚙️</span>
                  <div>
                    <span className="text-xs font-serif font-black text-white block">환경 설정</span>
                    <span className="text-[9px] font-mono text-gray-400 leading-none block mt-0.5">SETTINGS</span>
                  </div>
                </div>
                <Settings className="h-3.5 w-3.5 text-gray-500" />
              </button>

              <button 
                onClick={() => setShowExitModal(true)}
                className="w-full py-3.2 px-4 rounded border border-red-950/15 hover:border-red-600 bg-[#160c0c]/10 hover:bg-red-950/20 text-left transition-all duration-300 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">🚪</span>
                  <div>
                    <span className="text-xs font-serif font-black text-white block">게임 종료</span>
                    <span className="text-[9px] font-mono text-gray-500 leading-none block mt-0.5">EXIT GAME</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-red-400" />
              </button>
            </div>

          </div>

          {/* 소셜 단서 아카이브 계측 핀 */}
          <div className="flex items-center justify-center gap-5 pt-6 border-t border-white/5 text-gray-500 text-sm select-text">
            <span className="hover:text-[#d4b86a] cursor-pointer" title="디스코드">💬</span>
            <span className="hover:text-[#d4b86a] cursor-pointer" title="카카오">💭</span>
            <span className="hover:text-[#d4b86a] cursor-pointer" title="인스타그램">📸</span>
            <span className="hover:text-[#d4b86a] cursor-pointer" title="트위터">🐦</span>
            <span className="hover:text-[#d4b86a] cursor-pointer" title="이메일">✉️</span>
          </div>

        </div>

        {/* [중앙 가닥]: 안개 자물쇠 대문 CCTV & 미디어 레이아웃 */}
        <div className="flex-1 flex flex-col justify-between gap-5">
          
          {/* 상단 시네마틱 모니터 HUD */}
          <div className="border border-[#d4b86a]/30 bg-[#08080f]/95 rounded p-4 shadow-xl relative overflow-hidden flex flex-col justify-between h-auto md:h-full">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3 text-[10px] font-mono select-none">
              <span className="text-[#d4b86a] font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
                {selectedCam === 0 ? 'CAM-01 [MAIN GATE SECURE]' : selectedCam === 1 ? 'CAM-02 [3F DORM CORRIDOR]' : selectedCam === 2 ? 'CAM-03 [B1 SPECIMEN DOCK]' : 'CAM-04 [INFIRMARY LIFE POD]'}
              </span>
              <div className="flex items-center gap-3">
                {videoSrc && (
                  <button 
                    onClick={() => setViewOriginalVideo(!viewOriginalVideo)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono transition-all border shrink-0 ${viewOriginalVideo ? 'bg-[#d4b86a] text-black border-[#d4b86a]' : 'bg-transparent text-gray-400 border-white/10 hover:border-[#d4b86a]/35'}`}
                  >
                    {viewOriginalVideo ? '📟 시뮬레이터 중계' : '📹 오리지널 비디오'}
                  </button>
                )}
                <span className="text-gray-500 font-bold">SECURE CHANNEL ACTIVE</span>
              </div>
            </div>

            {/* 비디오 모니터 트레일러 디스플레이 가닥 */}
            <div className="flex-1 flex flex-col bg-black rounded overflow-hidden min-h-[220px] md:min-h-[340px] relative border border-white/5 p-3">
              {videoSrc && viewOriginalVideo ? (
                <div className="w-full h-full relative">
                  <video 
                    ref={monitorVideoRef}
                    src={videoSrc}
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                    muted={!soundOn}
                    playsInline
                    onError={() => {
                      console.warn('Monitor frame error for /eden.mp4');
                      setViewOriginalVideo(false);
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-mono text-red-500 font-black tracking-widest uppercase border border-red-500/20">
                    🔴 USER FEED DECOY
                  </div>
                </div>
              ) : (
                /* CCTV 시뮬레이터 연출 프레임 */
                <div className="flex-1 flex flex-col justify-between relative overflow-hidden select-none">
                  
                  {/* 중앙 레이더/지도/풍경 연출 */}
                  <div className="flex-1 flex flex-col md:flex-row items-stretch gap-3 relative py-2">
                    
                    {/* 왼쪽 그래픽 패널 */}
                    <div className="flex-1 rounded border border-white/5 bg-[#050508] relative overflow-hidden flex flex-col items-center justify-center p-4 min-h-[160px]">
                      
                      {/* 카메라 전단 정렬선 */}
                      <div className="absolute top-2 left-2 border-t-2 border-l-2 border-[#d4b86a]/30 h-3 w-3"></div>
                      <div className="absolute top-2 right-2 border-t-2 border-r-2 border-[#d4b86a]/30 h-3 w-3"></div>
                      <div className="absolute bottom-2 left-2 border-b-2 border-l-2 border-[#d4b86a]/30 h-3 w-3"></div>
                      <div className="absolute bottom-2 right-2 border-b-2 border-r-2 border-[#d4b86a]/30 h-3 w-3"></div>

                      {/* 공통 스캔 라인 스윕 */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d4b86a]/5 to-transparent h-1/2 w-full animate-pulse pointer-events-none"></div>

                      {selectedCam === 0 && (
                        /* CAM-01 Main Gate View */
                        <div className="w-full h-full flex flex-col justify-center items-center relative text-center">
                          <div className="text-5xl opacity-45 transform hover:scale-110 duration-500 mb-2">🏫</div>
                          <span className="font-serif text-xs font-black text-[#d4b86a] block">에덴 기숙학원 정문 정동</span>
                          <span className="text-[10px] text-gray-500 font-mono block mt-1">철제 차단기 바리케이드 원격 안전 잠금 정상 기동</span>
                          
                          {/* 가상의 고무 서치라이트 빔 조형 */}
                          <div className="absolute top-1/2 left-1/4 w-[120px] h-[30px] bg-gradient-to-r from-yellow-300/10 to-transparent rotate-12 blur-sm origin-left animate-pulse"></div>
                        </div>
                      )}

                      {selectedCam === 1 && (
                        /* CAM-02 Library Corridor View */
                        <div className="w-full h-full flex flex-col justify-center items-center relative text-center">
                          <div className="text-5xl opacity-45 transform hover:scale-110 duration-500 mb-2">🚪</div>
                          <span className="font-serif text-xs font-black text-rose-300 block">3층 전용 숙사 도서통로</span>
                          <span className="text-[10px] text-[#ff6666] font-mono block mt-1 animate-pulse">※ 경고: 실종 생도 김규리 전용 사물함 락 타격 정합성 요망</span>
                          
                          {/* 사물함 스케치처럼 보이는 4개 박스 */}
                          <div className="flex gap-1.5 mt-3">
                            <div className="w-6 h-8 bg-black border border-white/10 rounded flex items-center justify-center text-[9px] font-mono text-gray-500">0313</div>
                            <div className="w-6 h-8 bg-[#120707] border-2 border-red-500/30 rounded flex flex-col items-center justify-center text-[9px] font-mono text-red-500 font-bold animate-pulse">0315<span className="text-[6px] text-red-500 block leading-none">🔓</span></div>
                            <div className="w-6 h-8 bg-black border border-white/10 rounded flex items-center justify-center text-[9px] font-mono text-gray-500">0317</div>
                            <div className="w-6 h-8 bg-black border border-white/10 rounded flex items-center justify-center text-[9px] font-mono text-gray-500">0319</div>
                          </div>
                        </div>
                      )}

                      {selectedCam === 2 && (
                        /* CAM-03 Lab Entrance View */
                        <div className="w-full h-full flex flex-col justify-center items-center relative text-center">
                          <div className="text-5xl opacity-45 transform hover:scale-110 duration-500 mb-2">🧪</div>
                          <span className="font-serif text-xs font-black text-amber-200 block">지하 수용 약품 정화 격실</span>
                          <span className="text-[10px] text-yellow-500 font-mono block mt-1">기화 독성 상태 계측: 하론 제어 밸브 밀폐율 85% 안전 대기</span>
                          
                          {/* 압력계 심볼 */}
                          <div className="h-9 w-9 rounded-full border-2 border-yellow-500/40 bg-black flex items-center justify-center mt-3 animate-spin duration-[10000ms]">
                            <div className="h-4 w-[2px] bg-red-500 origin-bottom -translate-y-1"></div>
                          </div>
                        </div>
                      )}

                      {selectedCam === 3 && (
                        /* CAM-04 Vital Container View */
                        <div className="w-full h-full flex flex-col justify-center items-center relative text-center">
                          <div className="text-5xl opacity-45 transform hover:scale-110 duration-500 mb-2">💧</div>
                          <span className="font-serif text-xs font-black text-cyan-300 block">임상 3호 생명 연장 포드 (김규리)</span>
                          <span className="text-[10px] text-cyan-400 font-mono block mt-1 animate-pulse">적합 수위 도크 안전 수렴 · 우성 임팩트 바이오 모드 추적</span>
                          
                          {/* ECG 흐르는 곡선 시뮬레이션 */}
                          <div className="w-32 h-6 mt-3 text-cyan-500 filter drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]">
                            <svg viewBox="0 0 100 20" className="w-full h-full">
                              <path 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="1.5" 
                                d="M0,10 L30,10 L35,3 L40,17 L45,10 L50,10 L53,10 L57,1 L62,19 L66,10 L100,10" 
                                strokeDasharray="100"
                                strokeDashoffset="0"
                                className="animate-vital-flow"
                              />
                            </svg>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* 오른쪽 감시망 로그 패널 (텍스트 가득 기숙학원 통제 분위기) */}
                    <div className="w-full md:w-[150px] rounded border border-white/5 bg-[#0a0a0f]/80 p-2.5 font-mono text-[9px] text-gray-500 flex flex-col justify-between space-y-1.5 shrink-0 max-h-[140px] md:max-h-none overflow-y-auto">
                      <div className="border-b border-white/5 pb-1 select-none font-bold text-gray-400 text-[10px]">
                        👁️ PERIMETER LOGS
                      </div>
                      <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                        <p className="text-emerald-500/80 leading-snug"><span className="text-[#d4b86a]">[05:12]</span> GATE: LOCKUP NORMAL</p>
                        <p className="text-rose-500/90 leading-snug animate-pulse"><span className="text-[#d4b86a]">[05:14]</span> DORM: D3 DEVIATION</p>
                        <p className="text-gray-400/85 leading-snug"><span className="text-[#d4b86a]">[05:15]</span> VITAL: REC ACTIVE</p>
                        <p className="text-yellow-500/80 leading-snug"><span className="text-[#d4b86a]">[05:16]</span> VENT: CYCLING PREP</p>
                      </div>
                      <div className="border-t border-white/5 pt-1 text-[8px] text-gray-600 leading-none">
                        SYSTEM GATEWAY: ONLINE
                      </div>
                    </div>

                  </div>

                  {/* 하단 카메라 버튼 선택 패널 */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/5 font-mono text-[9px]">
                    <button 
                      onClick={() => setSelectedCam(0)}
                      className={`py-1.5 px-1 rounded transition-all truncate border cursor-pointer focus:outline-none ${selectedCam === 0 ? 'bg-[#d4b86a]/10 border-[#d4b86a] text-[#d4b86a] font-bold shadow-[0_0_8px_rgba(212,184,106,0.15)]' : 'bg-[#0f0f15] border-white/5 hover:border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      📟 CAM-01 정문
                    </button>
                    <button 
                      onClick={() => setSelectedCam(1)}
                      className={`py-1.5 px-1 rounded transition-all truncate border cursor-pointer focus:outline-none ${selectedCam === 1 ? 'bg-[#d4b86a]/10 border-[#d4b86a] text-[#d4b86a] font-bold shadow-[0_0_8px_rgba(212,184,106,0.15)]' : 'bg-[#0f0f15] border-white/5 hover:border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      📟 CAM-02 숙사
                    </button>
                    <button 
                      onClick={() => setSelectedCam(2)}
                      className={`py-1.5 px-1 rounded transition-all truncate border cursor-pointer focus:outline-none ${selectedCam === 2 ? 'bg-[#d4b86a]/10 border-[#d4b86a] text-[#d4b86a] font-bold shadow-[0_0_8px_rgba(212,184,106,0.15)]' : 'bg-[#0f0f15] border-white/5 hover:border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      📟 CAM-03 보건
                    </button>
                    <button 
                      onClick={() => setSelectedCam(3)}
                      className={`py-1.5 px-1 rounded transition-all truncate border cursor-pointer focus:outline-none ${selectedCam === 3 ? 'bg-[#d4b86a]/10 border-[#d4b86a] text-[#d4b86a] font-bold shadow-[0_0_8px_rgba(212,184,106,0.15)]' : 'bg-[#0f0f15] border-white/5 hover:border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      📟 CAM-04 배양
                    </button>
                  </div>

                </div>
              )}

              {/* 공용 시네마 스캔 라인 스윕 */}
              <div className="absolute inset-0 pointer-events-none bg-radial-vignette opacity-20"></div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="video/*" 
              className="hidden" 
            />

            {/* 수동 미디어 업로드 및 제어기 통상 표시 바 */}
            <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-3 text-xs select-none font-mono">
              <div className="flex items-center gap-1.5">
                {videoSrc ? (
                  <>
                    <button 
                      onClick={toggleVideoPlay}
                      className="h-6 w-6 rounded-full bg-white/5 hover:bg-[#d4b86a]/15 border border-white/5 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
                      title="비디오 정지/재생"
                    >
                      {videoPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </button>
                    <span className="text-[9px] text-gray-500">VIDEO DECODER SYNCED</span>
                  </>
                ) : (
                  <span className="text-[9px] text-rose-500 animate-pulse">⚠️ VIDEO NEED RE-CONNECTION</span>
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-[9.5px] text-[#d4b86a]/80 hover:text-[#d4b86a] cursor-pointer bg-transparent border-none focus:outline-none hover:underline"
              >
                📁 오리지널 트레일러 파일 교체/업로드 (.mp4)
              </button>
            </div>

          </div>

          {/* 에덴 생체 가스실 탈출 수칙 기밀 안전 통보각 */}
          <div className="p-4 rounded border border-[#d4b86a]/15 bg-[#0a0a0f]/90 backdrop-blur-sm shadow-xl flex items-start gap-4">
            <div className="h-8 w-8 rounded-full border border-red-950/40 bg-red-950/20 text-red-500 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-4 w-4 animate-bounce" />
            </div>
            <div className="space-y-1 select-text">
              <h4 className="text-xs font-serif font-black text-rose-400 tracking-wide">
                ⚠️ [피험 생도 수용 소각실 긴급 경고문구]
              </h4>
              <p className="text-[11px] text-[#9b96c0] leading-relaxed">
                에덴 특별 가스실에 격리되었을 때 질식을 우회하기 위해선, 학원 내부를 정밀 색출한 뒤 <strong className="text-red-400">구리 동전(Coin)</strong>과 제어 전극 단선을 강제 교란할 수 있는 최고 간부의 <strong className="text-red-400">비녀(Hairpin)</strong>를 필히 소지해야 합니다.
              </p>
            </div>
          </div>

        </div>

        {/* [오른쪽 가닥]: 공지사항 & MISSING 실종찌 & 지문 단서기 */}
        <div className="w-full lg:w-[32%] flex flex-col gap-5">
          
          {/* 에덴 기숙학원 통제 및 일과 규정 */}
          <div className="p-4 rounded border border-[#d4b86a]/15 bg-[#09090d]/90 backdrop-blur-sm flex flex-col shadow-xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="font-serif text-sm font-black text-[#d4b86a] flex items-center gap-1.5 animate-pulse">
                🏫 학원 소집 통제 및 일과 규정
              </span>
              <span className="text-[10px] font-mono text-red-500 font-extrabold tracking-widest uppercase">strict control</span>
            </div>
            
            <p className="text-[11px] text-[#9b96c0] leading-normal font-serif italic">
              "상위 0.1% 우성 인류 선발을 위해 본관 기숙숙소 도크는 철저한 물리적 통제를 적용합니다."
            </p>

            <div className="space-y-1.5 font-mono text-[10.5px]">
              <div className="flex justify-between items-center bg-black/40 p-1.5 rounded border border-white/[0.03]">
                <span className="text-[#f3d995] font-bold">⏱️ 06:00 ~ 06:30</span>
                <span className="text-gray-300">기상 및 생체 신호 전역 측정</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-1.5 rounded border border-white/[0.03]">
                <span className="text-[#f3d995] font-bold">⏱️ 07:00 ~ 12:00</span>
                <span className="text-gray-300">우성 선별 기하학 임상 영양학</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-1.5 rounded border border-white/[0.03]">
                <span className="text-[#f3d995] font-bold">⏱️ 22:00 ~ 24:00</span>
                <span className="text-rose-400 font-black animate-pulse">🧪 지하 가스 수납 교체 주기</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-1.5 rounded border border-white/[0.03]">
                <span className="text-red-500 font-black">⏱️ 24:00 ~ 06:00</span>
                <span className="text-red-400 font-bold">🔒 전체 격실 강점등 폐쇄</span>
              </div>
            </div>
          </div>
          
          {/* 공지사항 Notice 보드 (스크린샷 싱크 완벽) */}
          <div className="p-4 rounded border border-[#d4b86a]/15 bg-[#0d0d12]/90 backdrop-blur-sm flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <span className="font-serif text-sm font-black text-white flex items-center gap-1.5">
                📢 학원 공지 사항
              </span>
              <span className="text-[10px] font-mono text-gray-500 hover:text-[#d4b86a] tracking-tight cursor-pointer">더보기 +</span>
            </div>

            <div className="space-y-2 text-xs select-text">
              <div className="flex justify-between items-center py-1 border-b border-white/[0.02] hover:bg-white/[0.01]">
                <span className="text-gray-300 truncate max-w-[190px]">· 2026학년도 재수정규반 소집 요건</span>
                <span className="text-[10px] font-mono text-gray-500">26.04.24</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/[0.02] hover:bg-white/[0.01]">
                <span className="text-gray-300 truncate max-w-[190px]">· 연간 학위 배정 및 생체 검진표</span>
                <span className="text-[10px] font-mono text-gray-500">26.04.20</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/[0.02] hover:bg-white/[0.01]">
                <span className="text-gray-300 truncate max-w-[190px]">· 학부모 전당 생체 교양 설명회</span>
                <span className="text-[10px] font-mono text-gray-500">26.04.18</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-300 truncate max-w-[190px]">· 5월 모의 수능 선별 시간표 명세</span>
                <span className="text-[10px] font-mono text-gray-500">26.04.15</span>
              </div>
            </div>
          </div>

          {/* MISSING 실종지 (김규리 상세 폴라로이드) */}
          <div className="p-5 rounded-lg border-2 border-dashed border-red-950 bg-[#160c0c]/30 backdrop-blur-md relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
            
            {/* 실종 태그 띠 */}
            <div className="absolute top-1.5 right-[-32px] bg-red-600 text-white font-mono font-bold text-[9px] px-8 py-1 rotate-45 tracking-widest shadow-md">
              MISSING
            </div>

            <span className="font-mono text-[10px] tracking-widest text-red-500 block mb-1">WARNING · MISSING STUDENT</span>
            <h3 className="font-serif text-lg font-black text-rose-100 mb-4 select-text">실종 1급 제보를 고대합니다</h3>

            {/* 그림자 인물 실루엣 묘사 */}
            <div className="w-28 h-36 bg-gradient-to-b from-[#2d1212] via-[#120707] to-[#040202] rounded border-4 border-white/10 shadow-lg relative flex flex-col items-center justify-center overflow-hidden mb-4 rounded-b-xl group">
              <span className="text-5xl opacity-45 select-none transition-transform group-hover:scale-110">👧</span>
              <div className="absolute bottom-1 w-full bg-black/80 py-1 text-[9px] font-mono text-[#d4b86a] text-center font-bold">
                김 규 리 (19세)
              </div>
              {/* 스캔 라인 */}
              <div className="absolute inset-0 pointer-events-none bg-radial-vignette opacity-20"></div>
            </div>

            {/* 실실종 내역 */}
            <div className="space-y-1 text-xs select-text text-left w-full border border-red-500/10 p-3 rounded bg-black/40">
              <p className="text-gray-400"><strong className="text-red-400">● 생년월일:</strong> 2007.03.15</p>
              <p className="text-gray-400"><strong className="text-red-400">● 최종 지점:</strong> 본관 지하 보건 약품실</p>
              <p className="text-gray-400"><strong className="text-red-400">● 비 고:</strong> 학원 수뇌부 비밀 수첩 비밀 발췌</p>
            </div>

            {/* 자세히 보기 누르면 비밀 문서 팝업 기동 */}
            <button 
              onClick={() => {
                setShowDossierModal(true);
                setSelectedDossier('gyuri');
              }}
              className="mt-4 w-full py-2 rounded font-serif text-xs font-black bg-red-950/40 hover:bg-red-900 border border-red-800/60 hover:border-red-500 text-rose-200 cursor-pointer transition-all focus:outline-none"
            >
              실종 수사 기밀 수록지 해금 (Dossier File)
            </button>

          </div>

          {/* 지능 피손 지문 대조기 (실제 방탈출 상호작용 강화) */}
          <div className="p-4 rounded border border-[#d4b86a]/15 bg-[#0a0a0f]/90 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-2">INTELLIGENCE ACCREDITATION</span>
            <h4 className="font-serif text-xs font-black text-gray-300 mb-2">에덴 바이오 지문 감청기</h4>

            <div className="flex gap-3 items-center">
              
              <button 
                onClick={handleFingerprintScan}
                disabled={isScanningFingerprint}
                className={`h-11 w-11 rounded-md flex items-center justify-center cursor-pointer relative border transition-all shrink-0
                  ${isScanningFingerprint 
                    ? 'border-[#5546CC] bg-[#5546CC]/20 animate-pulse' 
                    : fingerprintClueUnlocked 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                      : 'border-[#d4b86a]/30 bg-[#161622] hover:border-[#d4b86a]'
                  }`}
                title="클릭하여 지문 스캔 개시"
              >
                {isScanningFingerprint ? (
                  <span className="text-sm font-bold text-gray-300">SCAN</span>
                ) : fingerprintClueUnlocked ? (
                  <span>✓</span>
                ) : (
                  <span className="text-xl">☝️</span>
                )}
                {/* 적정 스캔 라인 자막 */}
                {isScanningFingerprint && (
                  <div className="absolute inset-x-0 h-[2px] bg-sky-400 animate-bounce top-2"></div>
                )}
              </button>

              <div className="flex-1 min-w-0">
                {isScanningFingerprint ? (
                  <p className="text-[10px] text-sky-400 animate-pulse font-mono leading-tight">
                    스캐닝 중... 바이오 매트릭스 복호화 개시...
                  </p>
                ) : fingerprintClueUnlocked ? (
                  <div className="text-[10.5px] text-emerald-400 font-serif leading-snug">
                    <strong className="text-[#d4b86a] block">🔓 [기밀 단서 규명]</strong>
                    도서관 복도 자물쇠 빗장 각인은 '0315'. 규리의 버릇대로 뒷머리부터 <strong className="text-white underline">반대로 거꾸로 타격하세요 [5130].</strong>
                  </div>
                ) : (
                  <div>
                    <h5 className="text-[11px] text-gray-300 font-serif font-black">새로운 단서가 추가되었습니다</h5>
                    <button 
                      onClick={handleFingerprintScan}
                      className="text-[10px] text-[#d4b86a] hover:underline bg-transparent border-none cursor-pointer focus:outline-none p-0 inline-block text-left"
                    >
                      지문 접촉 대조 확인하기(SCAN)
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ────────────────────────────────────────────────────────
           E. BOTTOM CONTROL PANEL & TIP DESCRIPTORS
         ──────────────────────────────────────────────────────── */}
      <div className="w-full bg-[#050508]/95 border-t border-white/5 py-3 px-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-500 font-mono relative z-20">
        <div className="flex items-center gap-2 mb-2 md:mb-0 select-text">
          <span className="text-[#d4b86a] font-bold">TIP:</span>
          <span>에덴기숙학원은 무단 이탈을 차단합니다. 촛불이 꺼진 수납장 및 가성 가스실 밸브를 면밀히 터치하십시오.</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-serif">
          <button 
            onClick={() => setShowPledgeFolder(true)}
            className="hover:text-white cursor-pointer bg-transparent border-none py-1 flex items-center gap-1 focus:outline-none"
          >
            📂 소지품 체크
          </button>
          <span>|</span>
          <button 
            onClick={() => {
              if (onOpenArgWeb) onOpenArgWeb();
            }}
            className="hover:text-white cursor-pointer bg-transparent border-none py-1 flex items-center gap-1 focus:outline-none text-[#d4b86a]"
          >
            📋 단서 복구망 연동
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
           F. FLOATING TRANSIT OVERLAY: 에덴 특별 장학 수사 소집 서약서 (Dossier Pledge Overlay)
         ──────────────────────────────────────────────────────── */}
      {showPledgeFolder && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111116] border-2 border-[#d4b86a] rounded-lg shadow-[0_20px_60px_rgba(212,184,106,0.3)] relative overflow-hidden animate-gold-shine">
            
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#d4b86a] via-[#f3d995] to-[#d4b86a]"></div>

            <div className="bg-[#171722] px-6 py-4 border-b border-[#d4b86a]/20 text-left flex items-center justify-between">
              <div>
                <span className="font-mono text-[9px] text-[#d4b86a] tracking-widest block uppercase font-bold">REGISTRATION & PLEDGE</span>
                <h2 className="font-serif text-base font-black text-white">에덴 특별 장학 소집 동의 서약</h2>
              </div>
              <button 
                onClick={() => setShowPledgeFolder(false)}
                className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer focus:outline-none border-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdmission} className="p-6 space-y-4 text-left select-text">
              <p className="text-[11px] text-[#9b96c0] leading-relaxed">
                ※ 위 전전당은 우성 등급 개조 및 완전 보안 통제를 목표로 격리되어 있습니다. 피험 지원 자격 수집 및 잠입 개시를 위해 모든 강제 통제 조항에 서명하십시오.
              </p>

              {/* 이름 입력 */}
              <div className="space-y-1 flex flex-col">
                <label className="text-[10px] font-serif text-[#d4b86a] tracking-wider uppercase font-semibold">참가 생도 지원 본명 (Applicant Seoyeon Name)</label>
                <input 
                  type="text" 
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full bg-[#181824] border border-white/10 hover:border-[#d4b86a]/40 focus:border-[#d4b86a] focus:bg-black text-white text-xs rounded px-4 py-2.5 transition-all outline-none font-serif font-black tracking-widest text-center"
                  placeholder="위장용 생도 본명을 입력하시오."
                  required
                />
              </div>

              {/* 챕터 트랙 */}
              <div className="space-y-1.5 flex flex-col">
                <label className="text-[10px] font-serif text-[#d4b86a] tracking-wider uppercase font-semibold">입소 관할 구획 트랙 (Scenario Selection)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTrack('A')}
                    className={`p-2 rounded border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${selectedTrack === 'A' ? 'bg-[#d4b86a]/20 border-[#d4b86a] text-white font-bold' : 'bg-[#181824]/50 border-white/5 text-gray-400 hover:border-white/10'}`}
                  >
                    <span className="font-mono text-xs block">TRACK A</span>
                    <span className="text-[8px] font-serif mt-1">에덴의 가면</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTrack('B')}
                    className={`p-2 rounded border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${selectedTrack === 'B' ? 'bg-[#d4b86a]/20 border-[#d4b86a] text-white font-bold' : 'bg-[#181824]/50 border-white/5 text-gray-400 hover:border-white/10'}`}
                  >
                    <span className="font-mono text-xs block">TRACK B</span>
                    <span className="text-[8px] font-serif mt-1">무균 기억</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTrack('C')}
                    className={`p-2 rounded border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${selectedTrack === 'C' ? 'bg-[#d4b86a]/20 border-[#d4b86a] text-white font-bold' : 'bg-[#181824]/50 border-white/5 text-gray-400 hover:border-white/10'}`}
                  >
                    <span className="font-mono text-xs block">TRACK C</span>
                    <span className="text-[8px] font-serif mt-1">선택된 자들</span>
                  </button>
                </div>
              </div>

              {/* 보안 동의 조항 */}
              <div className="space-y-2 pt-1">
                <p className="text-[10.5px] font-serif text-[#d4b86a] tracking-wider uppercase font-semibold">보안 권리 귀속 조약 서명</p>
                <div className="space-y-2.5 bg-black/50 p-4 rounded border border-white/5 text-[10px]">
                  
                  <label className="flex items-start gap-2.5 cursor-pointer text-[#a6a2c2] hover:text-white transition-all select-none">
                    <input 
                      type="checkbox"
                      checked={agreedPledges.noDevice}
                      onChange={(e) => setAgreedPledges({...agreedPledges, noDevice: e.target.checked})}
                      className="mt-0.5 accent-[#d4b86a]"
                    />
                    <span>[필수] 지참하는 무전 통신기 및 사설 테이프, 전자기기 압수 동의</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-[#a6a2c2] hover:text-white transition-all select-none">
                    <input 
                      type="checkbox"
                      checked={agreedPledges.bioTracking}
                      onChange={(e) => setAgreedPledges({...agreedPledges, bioTracking: e.target.checked})}
                      className="mt-0.5 accent-[#d4b86a]"
                    />
                    <span>[필수] 고화질 안구 트래킹 및 복제 신경망 기록 수집 분석 동의</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-[#a6a2c2] hover:text-white transition-all select-none">
                    <input 
                      type="checkbox"
                      checked={agreedPledges.analogConsent}
                      onChange={(e) => setAgreedPledges({...agreedPledges, analogConsent: e.target.checked})}
                      className="mt-0.5 accent-[#d4b86a]"
                    />
                    <span>[필수] 전당 내부 고도 모스 암호 명령 불복종 시 지체 처벌 동의</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-[#ff7575] hover:text-red-400 transition-all select-none font-bold">
                    <input 
                      type="checkbox"
                      checked={agreedPledges.gasRoomConsent}
                      onChange={(e) => setAgreedPledges({...agreedPledges, gasRoomConsent: e.target.checked})}
                      className="mt-0.5 accent-red-600"
                    />
                    <span>[필수_경고] 규칙 위장 및 불순 가담 시 독성 가스실 즉각 수용 동의 (⚠️)</span>
                  </label>

                </div>
              </div>

              {touchedSubmit && !isFormValid && (
                <div className="p-2.5 rounded border border-red-900/40 bg-red-950/20 text-red-400 text-[10.5px] font-bold text-center animate-pulse">
                  ⚠️ 가스 포기 서명을 포함한 소집 약관에 모두 서면 동의 하셔야 게이트가 가동됩니다.
                </div>
              )}

              <button 
                type="submit"
                className={`w-full py-3.5 rounded font-serif text-xs font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer
                  ${isFormValid 
                    ? 'bg-gradient-to-r from-[#d4b86a] to-[#f3d995] text-[#07070a] shadow-[0_0_20px_rgba(212,184,106,0.3)] hover:-translate-y-0.5' 
                    : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                  }`}
              >
                📥 소집 서약서 갱신 완료 및 에덴 잠공 잠입 개시
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           G. DEEP DOSSIERS & ARG SECRETS DIALOGUE MODAL (기밀 아카이브 기록실)
         ──────────────────────────────────────────────────────── */}
      {showDossierModal && (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0e0e14] border-2 border-[#d4b86a]/30 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col h-[85vh]">
            
            {/* 탭 헤더 */}
            <div className="bg-[#14141d] px-6 py-4 border-b border-[#d4b86a]/20 flex items-center justify-between">
              <div>
                <span className="font-mono text-[9px] text-[#d4b86a] tracking-widest block font-bold">SECRET INTELLIGENCE REPORTS</span>
                <h3 className="font-serif text-base font-black text-white">에덴 임상 잠입대 기밀 기록실</h3>
              </div>
              <button 
                onClick={() => setShowDossierModal(false)}
                className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer border-none focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 내부 인물 선택기 */}
            <div className="flex border-b border-white/5 bg-[#0b0b0f] p-2 gap-1 overflow-x-auto select-none shrink-0">
              <button 
                onClick={() => setSelectedDossier('seoyeon')}
                className={`px-4 py-2 rounded text-xs font-serif font-semibold cursor-pointer transition-colors ${selectedDossier === 'seoyeon' ? 'bg-[#d4b86a]/20 text-[#d4b86a] font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                권서연 (잠입조사원)
              </button>
              <button 
                onClick={() => setSelectedDossier('gyuri')}
                className={`px-4 py-2 rounded text-xs font-serif font-semibold cursor-pointer transition-colors ${selectedDossier === 'gyuri' ? 'bg-[#d4b86a]/20 text-[#d4b86a] font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                김규리 (핵심실종생도)
              </button>
              <button 
                onClick={() => setSelectedDossier('suin')}
                className={`px-4 py-2 rounded text-xs font-serif font-semibold cursor-pointer transition-colors ${selectedDossier === 'suin' ? 'bg-[#d4b86a]/20 text-[#d4b86a] font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                황수인 (학생학생회 대표)
              </button>
              <button 
                onClick={() => setSelectedDossier('aran')}
                className={`px-4 py-2 rounded text-xs font-serif font-semibold cursor-pointer transition-colors ${selectedDossier === 'aran' ? 'bg-[#d4b86a]/20 text-[#d4b86a] font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                김아란 (저항단발생도)
              </button>
            </div>

            {/* 기록 본문 지문 */}
            <div className="flex-1 overflow-y-auto p-6 text-left select-text space-y-4 text-xs md:text-sm bg-stone-900/10">
              {selectedDossier === 'seoyeon' && (
                <div className="space-y-3.5">
                  <h4 className="font-serif text-base font-black text-white">피술구획 침투조사원: 권서연 (19세)</h4>
                  <div className="w-12 h-1 bg-[#d4b86a]/30"></div>
                  <p className="text-[#a6a2c2] leading-relaxed">
                    규리의 최고 친우. 규리의 비밀 낙서와 수사 핀 코드를 독자 판독하고 스스로의 우성 학업 스펙을 조작해 에덴 기숙학원의 특수 특별 생도로 잠입했다. 겉보기엔 성실하고 조용한 여학생이나 비밀 결사 및 문헌 탐색에 특출난 집념을 보유했다.
                  </p>
                  <div className="bg-[#121217] p-3 rounded border border-white/5 space-y-2">
                    <p className="text-[11px] font-mono text-gray-500 font-bold">기밀 기록 일기문구 복원:</p>
                    <p className="text-[11px] text-[#d4b86a] italic leading-relaxed">
                      "규리가 사라진 지 정확히 62일째. 아무도 진상을 말해주지 않는다. 수인이라는 친절한 부대표의 눈빛 뒤편에 기괴한 약품 보관 도안이 얽혀있다. 비밀을 밝히고 둘이서 반드시 살아나가겠다."
                    </p>
                  </div>
                </div>
              )}

              {selectedDossier === 'gyuri' && (
                <div className="space-y-3.5">
                  <h4 className="font-serif text-base font-black text-[#ff6666]">피해대상 격리 개체: 김규리 (19세)</h4>
                  <div className="w-12 h-1 bg-red-600/30"></div>
                  <p className="text-[#a6a2c2] leading-relaxed">
                    실종 사건의 중심이자 에덴 특별 임상 3호 적합 개체. 천재적인 무전 및 카이사르 쉬프트 복호 능력을 이용해 에덴 내부의 기하학적 수치 코드를 비밀 장부 노트에 정리한 뒤 복도 사물함에 감금했다.
                  </p>
                  <div className="bg-[#1c0c0c]/40 p-4 rounded border border-red-500/15 space-y-2">
                    <p className="text-[11px] font-mono text-red-400 font-bold">🚨 획득된 기밀 단서 원안:</p>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-serif">
                      - 규리의 탄생 연월일(03월 15일) 자물쇠 비밀번호는 규리가 역배열 강박이 있어 <strong>[5130]</strong>으로 완전히 거꾸로 작동함.<br/>
                      - 규리가 인체 모형 배 밑에 숨겨둔 최종 쪽지에는 약품 코드 <strong>[B-3-47]</strong>와 연합하여 무균실 유압 해치를 개방할 마지막 수열 순서(7823)가 등재되어 있음.
                    </p>
                  </div>
                </div>
              )}

              {selectedDossier === 'suin' && (
                <div className="space-y-3.5">
                  <h4 className="font-serif text-base font-black text-yellow-300">임상선별위원회 기여 간부: 황수인 (19세)</h4>
                  <div className="w-12 h-1 bg-[#d4b86a]/30"></div>
                  <p className="text-[#a6a2c2] leading-relaxed">
                    에덴의 최고 명문 기조 1대장 생도이자 가상의 부대표. 부드럽고 가련한 언변과 철저한 안전 지원책을 흘리지만, 사실은 에덴의 등급제 우성 학급 개조 제안을 2019년에 승계한 집행 계층이다. 낙오된 기밀 개체를 지하실 소각 소실 수단에 조용히 밀어 넣는 데 공헌했다.
                  </p>
                </div>
              )}

              {selectedDossier === 'aran' && (
                <div className="space-y-3.5">
                  <h4 className="font-serif text-base font-black text-cyan-300">저항 기세 복제개체 요원: 김아란 (19세)</h4>
                  <div className="w-12 h-1 bg-cyan-500/30"></div>
                  <p className="text-[#a6a2c2] leading-relaxed">
                    복제 연구소 충돌 저향 요원. 뇌 세포 기억 일부가 날아간 채 보건실 구석 복도에서 쇠몽둥이를 들고 배회했으나, 실제론 서연을 보충 수련동 소각용 가스 트랩으로부터 우회시키며 마스터 안전 비녀(Hairpin)를 건네줄 목숨의 수호 신앙 요원이다.
                  </p>
                </div>
              )}
            </div>

            {/* 하부 조절 */}
            <div className="p-4 border-t border-white/5 bg-[#0b0b0f] flex justify-end shrink-0">
              <button 
                onClick={() => setShowDossierModal(false)}
                className="px-5 py-2 rounded bg-white/5 hover:bg-white/10 text-white font-mono text-xs cursor-pointer focus:outline-none border-none"
              >
                닫기 (CLOSE)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           H. SIMPLE SETTINGS & EXIT PROCEDURES MODAL LAYERS
         ──────────────────────────────────────────────────────── */}
      {showSettingsModal && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#111116] border border-[#d4b86a]/30 rounded-lg p-6 text-left space-y-4">
            <h3 className="font-serif text-base font-black text-white">에덴 시스템 제어</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>환경 음향 활성화</span>
                <button 
                  onClick={() => setSoundOn(!soundOn)}
                  className={`px-3 py-1.5 rounded font-mono font-bold cursor-pointer ${soundOn ? 'bg-gradient-to-r from-[#d4b86a] to-[#f3d995] text-black' : 'bg-white/5 text-gray-500'}`}
                >
                  {soundOn ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 rounded bg-white/5 text-white font-mono text-xs hover:bg-white/10 cursor-pointer border-none"
            >
              종료 (CLOSE)
            </button>
          </div>
        </div>
      )}

      {showExitModal && (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#1a0c0c] border border-red-500/30 rounded p-6 text-center space-y-4">
            <span className="text-3xl">☠️</span>
            <h3 className="font-serif text-sm font-black text-red-400">시스템 허인가가 조영 거부</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-serif">
              "에덴 기숙학원의 최고 등급 피험 인재가 지정되기 전엔, 그 철문 빗장은 결코 외부 도피를 인가하지 않습니다."
            </p>
            <button 
              onClick={() => setShowExitModal(false)}
              className="w-full py-2 bg-red-950 hover:bg-[#ff5555] text-white hover:text-[#07070a] rounded font-serif text-xs font-black cursor-pointer transition-colors"
            >
              침입 기밀 영역으로 복귀하기
            </button>
          </div>
        </div>
      )}

      {/* AUTOSAVE TOAST NOTIFICATION */}
      {showAutoSaveToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#0b0b12] border-2 border-[#d4b86a] rounded-lg shadow-[0_15px_40px_rgba(212,184,106,0.35)] font-serif text-xs min-w-[320px]">
          <span className="text-xl">🔒</span>
          <div className="text-left">
            <p className="text-white font-black">에덴 임상 자동 세이브 가동</p>
            <p className="text-[#a6a2c2] text-[10px] font-mono mt-0.5">"START GAME"을 개시하면 최종 진도 시점에서 자동 구동됩니다.</p>
          </div>
        </div>
      )}

    </section>
  );
}
