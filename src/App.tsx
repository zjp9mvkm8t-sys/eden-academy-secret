import { useState } from 'react';
import TitleScreen from './components/TitleScreen';
import ScenarioSelect from './components/ScenarioSelect';
import GameScreen from './components/GameScreen';
import EndingScreen from './components/EndingScreen';
import ArgWebsiteModal from './components/ArgWebsiteModal';
import { Scenario } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'title' | 'scenario' | 'game' | 'ending'>('title');
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('A');
  const [isArgWebOpen, setIsArgWebOpen] = useState(false);
  
  // 로딩 트랜지션 연출용 상태값
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [transitionLog, setTransitionLog] = useState('');
  
  // 엔딩 통계
  const [endingType, setEndingType] = useState<string>('escape');
  const [suinTrust, setSuinTrust] = useState<number>(0);
  const [aranTrust, setAranTrust] = useState<number>(0);

  // 로딩 로그용 가상 프로파일 연출 세트
  const TRANSITION_LOGS: Record<Scenario, string[]> = {
    A: [
      '잠입 동선 지리 분석 중...',
      '기숙본관 보안 매트릭스 도면 복호 중...',
      '수인과의 원초적 인적 접촉 동기 시뮬레이션...',
      '보안 센서 사각 구획 맵 로딩...',
      '본관 수뇌 경비 순찰 데이터 수집...',
      '게임 환경 구성 완료.'
    ],
    B: [
      '가상 QR 임상 데이터베이스 복원...',
      '규리가 유출해 은닉한 암호 노트 조각 대조...',
      '가청 주파수 대항 모스부호 번역장 활성...',
      '실시간 에덴 생체 기준 일지 복구 중...',
      '김아란 복제 세인 기억 복원 중...',
      '게임 환경 구성 완료.'
    ],
    C: [
      '우성학적 선별 통계 기준표 접속...',
      '중앙 대강당 CCTV 광학 피드 연계...',
      '황수인의 신앙적 이념 장벽 프로필 해체...',
      'UV 전위 반응 조명 묘사 시뮬레이션...',
      '윤리 지수 분기 연계 시스템 활성...',
      '게임 환경 구성 완료.'
    ]
  };

  const handleStartGame = () => {
    setCurrentScreen('scenario');
  };

  const handleSelectScenario = (sc: Scenario) => {
    setSelectedScenario(sc);
    setIsTransitioning(true);
    setTransitionProgress(0);
    
    const logs = TRANSITION_LOGS[sc];
    setTransitionLog(logs[0]);

    // 다이내믹 가상 복호화 바 모사 연출
    const duration = 2000;
    const intervalTime = 20;
    const steps = duration / intervalTime;
    const logInterval = Math.floor(steps / logs.length);
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const percent = Math.min((currentStep / steps) * 100, 100);
      setTransitionProgress(percent);

      const logIndex = Math.min(Math.floor(currentStep / logInterval), logs.length - 1);
      setTransitionLog(logs[logIndex]);

      if (currentStep >= steps) {
        clearInterval(timer);
        setIsTransitioning(false);
        setCurrentScreen('game');
      }
    }, intervalTime);
  };

  const handleEndReached = (ending: string, suin: number, aran: number) => {
    setEndingType(ending);
    setSuinTrust(suin);
    setAranTrust(aran);
    setCurrentScreen('ending');
  };

  const handleRestartTitle = () => {
    setCurrentScreen('title');
  };

  const handleRestartScenario = () => {
    setCurrentScreen('scenario');
  };

  return (
    <main className="relative w-screen h-screen bg-[#07070a] text-[#E6E4F4] overflow-hidden font-sans">
      
      {/* 1. 타이틀 이머시브 씬 */}
      {currentScreen === 'title' && (
        <TitleScreen 
          onStartClick={handleStartGame} 
          onOpenArgWeb={() => setIsArgWebOpen(true)}
        />
      )}

      {/* 2. 시나리오 카드 수집 씬 */}
      {currentScreen === 'scenario' && (
        <ScenarioSelect 
          onBackClick={handleRestartTitle} 
          onSelectScenario={handleSelectScenario}
        />
      )}

      {/* 3. 액티브 퍼즐 월드 플레이 씬 */}
      {currentScreen === 'game' && (
        <GameScreen 
          scenario={selectedScenario}
          onEndReached={handleEndReached}
          onOpenArgWeb={() => setIsArgWebOpen(true)}
        />
      )}

      {/* 4. 최종 누적 결과 및 AISAS 래빗홀 유동 씬 */}
      {currentScreen === 'ending' && (
        <EndingScreen 
          endingType={endingType}
          suinTrust={suinTrust}
          aranTrust={aranTrust}
          onRestartTitle={handleRestartTitle}
          onRestartScenario={handleRestartScenario}
          onOpenArgWeb={() => setIsArgWebOpen(true)}
        />
      )}

      {/* 5. 다이내믹 고밀도 로딩 파탈 레이어 */}
      {isTransitioning && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#07070a] select-none text-center gothic-stone">
          <p className="font-mono text-xs text-[#d4b86a] tracking-[0.25em] uppercase mb-1">
            SCENARIO SYSTEM ACCESS PROTOCOL
          </p>
          <h3 className="font-serif text-xl font-bold text-white mb-6">
            {selectedScenario === 'A' ? '시나리오 A — 에덴의 가면' : selectedScenario === 'B' ? '시나리오 B — 무균실의 기억' : '시나리오 C — 선택받은 자들'}
          </h3>
          
          {/* 복호 바 바디 */}
          <div className="w-64 h-[2px] bg-white/10 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-[#d4b86a] to-[#f3d995] rounded-full transition-all duration-75"
              style={{ width: `${transitionProgress}%` }}
            ></div>
          </div>
          
          <p className="font-mono text-[9px] text-[#50506A] tracking-[0.12em] min-h-[1.5em]">
            {transitionLog}
          </p>
        </div>
      )}

      {/* 6. 인게임 통합 가상 브라우저 브라우징 위장 홈 모달 */}
      <ArgWebsiteModal 
        isOpen={isArgWebOpen}
        onClose={() => setIsArgWebOpen(false)}
        onFindSecretclue={(clueId) => {
          // 가상 F12 브라우징에서 규리의 편지 등을 해독했을 때, 
          // 인게임 알림이나 고유 소리/로그를 남겨줄 수 있습니다.
          console.log('⚡ [SECRET DECODED FROM ARG WEBSITE WEBSITE]:', clueId);
        }}
      />

    </main>
  );
}
