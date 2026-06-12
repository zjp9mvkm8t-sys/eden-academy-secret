import { useState, useEffect, useRef } from 'react';
import { Scenario, Quest, LogEntry, GameState } from '../types';
import { SCENARIO_DB, ITEMS } from '../data/gameData';
import Room3DExplorer from './Room3DExplorer';
import { 
  Compass, 
  HelpCircle, 
  Clock, 
  ShieldAlert, 
  ChevronRight, 
  Sparkles, 
  Zap, 
  Search, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown, 
  Bookmark,
  CheckCircle,
  TrendingUp,
  X
} from 'lucide-react';

interface GameScreenProps {
  scenario: Scenario;
  onEndReached: (endingType: string, suinTrust: number, aranTrust: number) => void;
  onOpenArgWeb?: () => void;
}

export default function GameScreen({ scenario, onEndReached, onOpenArgWeb }: GameScreenProps) {
  // 극 중 퀘스트 데이터베이터 획득
  const quests = SCENARIO_DB[scenario] || [];
  const questOrder = quests.map(q => q.qid);

  // 1. 게임 전반 상태 state
  const [currentQuestId, setCurrentQuestId] = useState<string>(questOrder[0]);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [suinTrust, setSuinTrust] = useState<number>(30); // 기명 소통을 위해 30 기본 세팅
  const [aranTrust, setAranTrust] = useState<number>(30); // 기명 소통을 위해 30 기본 세팅
  const [hqCompleted, setHqCompleted] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState<Record<string, number>>({});
  
  // 2. 타이머 & 인게임 편의 지수 state
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [isShakeInput, setIsShakeInput] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err' | 'info' | ''; text: string }>({ type: '', text: '' });
  const [currentLogs, setCurrentLogs] = useState<LogEntry[]>([]);
  const [isOpenHintBody, setIsOpenHintBody] = useState<boolean>(false);
  
  // 가스실 등 observe 미니 전용 탐색 상태
  const [gasSearchStep, setGasSearchStep] = useState<number>(0); // 0: 미탐색, 1: 책상수색(동전획득), 2: 소화기치우기, 3: 볼트분거 완료
  const [gasConcentration, setGasConcentration] = useState<number>(20); // 가스실 전용 독소 축정 농도
  
  const logEndRef = useRef<HTMLDivElement>(null);

  const quest = quests.find(q => q.qid === currentQuestId) as Quest;

  // 3. 실제 방탈출 느낌 강화를 위한 인터랙티브 금속 다이얼 락 전용 상태 (4자리 로크인)
  const [dialDigits, setDialDigits] = useState<number[]>([0, 0, 0, 0]);

  // 교구 수색 타정 상태 정보 (해당 스테이지의 핫스팟 클릭 기록 추적)
  const [searchedHotspots, setSearchedHotspots] = useState<Record<string, boolean>>({});

  // 🔍 실시간 리얼 3D 단서 점검 모달 인스펙션 상태
  const [inspectedClue, setInspectedClue] = useState<{ id: string; name: string; dialog: string } | null>(null);

  // 4. 컴포넌트 마운트 시 초기화 및 타임스탬프 기록
  useEffect(() => {
    addLog('🕵️ 에덴 기숙학원 침입로 진입 완료. 기밀 잠입 센서 작동 개시.', 'info');
    if (quest?.timeLimit > 0) {
      triggerTimer(quest.timeLimit);
    }
    // 각 시나리오별 첫 장비 지급 
    if (scenario === 'A') {
      addLog('권서연: "규리를 이 지옥 같은 생체실험동에서 꺼내기 전엔 절대 멈추지 않아."', 'normal');
    } else if (scenario === 'B') {
      addLog('권서연: "이곳의 암호 시스템은 전부 규리가 숨겨둔 모스 조각과 통하고 있어."', 'normal');
      grantItem('notebook'); // 시나리오 B인 경우 암호 수첩 자동 지급 시작
    } else {
      addLog('권서연: "우성 선별 체제라니... 이 탐욕스런 기만의 제국을 박살 내주겠어."', 'normal');
    }
  }, [scenario]);

  // 퀘스트 전이 시 타이머 대처 및 다이얼락 자릿수 초기화
  useEffect(() => {
    if (!quest) return;
    setInputValue('');
    setFeedback({ type: '', text: '' });
    setIsOpenHintBody(false);
    setDialDigits([0, 0, 0, 0]);
    setSearchedHotspots({}); // 수색 핫스팟 기록 초기화
    
    if (quest.timeLimit > 0) {
      triggerTimer(quest.timeLimit);
    } else {
      setTimerActive(false);
    }

    addLog(`[위치 도달] ${quest.location} — "${quest.title}" 진입`, 'info');

    // 특수구역 가스방 수색 수집 초기화
    if (quest.qid === 'A-10-gas') {
      setGasSearchStep(0);
      setGasConcentration(25);
    }
  }, [currentQuestId]);

  // 타이머 실행 루프 및 가스실 독가스 농도 상승 긴장 연출
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            onTimeout();
            return 0;
          }
          
          // 가스방인 경우 실시간 독소 농도 상승 동반 상승 (3초당 1%씩)
          if (quest?.qid === 'A-10-gas' && prev % 3 === 0) {
            setGasConcentration(c => Math.min(100, c + 1));
          }

          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerRemaining, currentQuestId]);

  // 로그 보드로 자동 스크롤
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentLogs]);

  // 5. 전용 기능: 로그 기록
  const addLog = (text: string, type: 'normal' | 'good' | 'bad' | 'key' | 'info' = 'normal') => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog: LogEntry = { time: timeStr, text, type };
    setCurrentLogs(prev => [...prev, newLog]);
  };

  // 6. 타이머 발동
  const triggerTimer = (seconds: number) => {
    setTimerRemaining(seconds);
    setTimerActive(true);
  };

  // 7. 제한 시간 만료 시 대처
  const onTimeout = () => {
    addLog(`🚨 제한 시간이 초과되었습니다! [${quest.title}] 최후 소실 경보`, 'bad');
    if (quest.qid === 'A-10-gas') {
      // 가스실은 치명적 트랩이므로 최후 게임오버
      onEndReached('gameover', suinTrust, aranTrust);
    } else {
      setFeedback({ type: 'err', text: '시간 초과! 단서들을 더 기하학적으로 신속히 정리하세요.' });
    }
  };

  // 8. 장외 아이템 획득 통로
  const grantItem = (itemId: string) => {
    if (!ITEMS[itemId]) return;
    setInventory(prev => {
      if (prev.includes(itemId)) return prev;
      
      // Schedule the logging side effect safely in the next tick to avoid nested React state modifications
      setTimeout(() => {
        addLog(`🎒 기밀 아이템 회수: ${ITEMS[itemId].emoji} [${ITEMS[itemId].name}]가 획득되었습니다.`, 'key');
      }, 0);
      
      return [...prev, itemId];
    });
  };

  const hasItem = (itemId: string) => inventory.includes(itemId);

  // 9. 신뢰도 보정
  const adjustTrust = (target: 'suin' | 'aran', val: number) => {
    if (target === 'suin') {
      setSuinTrust(prev => Math.max(0, Math.min(100, prev + val)));
    } else {
      setAranTrust(prev => Math.max(0, Math.min(100, prev + val)));
    }
  };

  // 10. 힌트 발굴 처리
  const fetchHint = () => {
    const qid = quest.qid;
    const currentHintsUsed = hintsUsed[qid] || 0;
    if (currentHintsUsed >= quest.hintsMax) {
      setFeedback({ type: 'info', text: '이 구획의 모든 힌지 정보가 이미 개방되었습니다.' });
      setIsOpenHintBody(true);
      return;
    }

    const nextCount = currentHintsUsed + 1;
    setHintsUsed(prev => ({ ...prev, [qid]: nextCount }));
    setIsOpenHintBody(true);
    addLog(`🔑 기밀 도화선 단서 획득 [${quest.title}] (${nextCount}/${quest.hintsMax})`, 'info');
  };

  // 11. 다이얼 락 회전 증감기
  const rotateDial = (index: number, direction: 'up' | 'down') => {
    const nextDigits = [...dialDigits];
    if (direction === 'up') {
      nextDigits[index] = (nextDigits[index] + 1) % 10;
    } else {
      nextDigits[index] = (nextDigits[index] - 1 + 10) % 10;
    }
    setDialDigits(nextDigits);
    
    // 신비로운 톱니바퀴 조작 소리를 흉내낸 실시간 로그 출력
    const combined = nextDigits.join('');
    setInputValue(combined);
  };

  // 다이얼 락 격결기 격발
  const handleDialSubmit = () => {
    const dialCode = dialDigits.join('');
    
    // A-10 가스실 퀘스트 소유 상태 체크인
    if (quest.qid === 'A-10-gas' && !hasItem('coin')) {
      setFeedback({ type: 'err', text: '볼트 나사를 풀어낼 평평한 가라앉은 동전(Coin)이 필요해 보여.' });
      setIsShakeInput(true);
      setTimeout(() => setIsShakeInput(false), 450);
      return;
    }

    if (dialCode === quest.answer) {
      onQuestSolveSuccess();
    } else {
      setFeedback({ type: 'err', text: '지정 다이얼 코드가 주 전극과 조응하지 않아! 다른 배치를 시도해봐.' });
      setIsShakeInput(true);
      setTimeout(() => setIsShakeInput(false), 450);
      addLog(`❌ [조정 불일치] 황동 다이얼 락 타격 정합 오류: [${dialCode}]`, 'bad');
    }
  };

  // 12. 수수키 전송 수락
  const handleCodeSubmit = () => {
    const trimmedInput = inputValue.trim().toUpperCase();
    if (!trimmedInput) {
      setFeedback({ type: 'err', text: '입력란에 코드를 입력하세요.' });
      return;
    }

    // A-10 가스실 체크
    if (quest.qid === 'A-10-gas' && !hasItem('coin')) {
      setFeedback({ type: 'err', text: '볼트 나사를 제거할 납작한 도구가 필요해 보입니다. 방 안을 먼저 정밀히 수색하세요.' });
      setIsShakeInput(true);
      setTimeout(() => setIsShakeInput(false), 450);
      return;
    }

    if (trimmedInput === quest.answer) {
      onQuestSolveSuccess();
    } else {
      setFeedback({ type: 'err', text: '지정 전위와 일치하지 않습니다. 다시 복호하세요.' });
      setIsShakeInput(true);
      setTimeout(() => setIsShakeInput(false), 450);
      addLog(`❌ [암호 주입 오류] 시스템 잠금 거부: ${trimmedInput}`, 'bad');
    }
  };

  // 키패드 입력기 누름
  const handleKeypadPress = (val: string) => {
    if (val === 'CLR') {
      setInputValue('');
    } else if (val === 'ENT') {
      handleCodeSubmit();
    } else {
      if (inputValue.length < 8) {
        setInputValue(prev => prev + val);
      }
    }
  };

  // 13. 선택지 분기 결정 수락
  const handleChoiceSubmit = (index: number) => {
    const choice = quest.choices?.[index];
    if (!choice) return;

    addLog(`☑️ 서연의 전격 결정: "${choice.text}"`, 'normal');

    // 기획 상의 신뢰도 및 전용 아이템 즉시 증여 적용
    if (quest.choiceTrust?.[index]) {
      const ct = quest.choiceTrust[index];
      if (ct.suin) adjustTrust('suin', ct.suin);
      if (ct.aran) adjustTrust('aran', ct.aran);
    }

    if (quest.choiceGrant?.[index]) {
      quest.choiceGrant[index].forEach(id => grantItem(id));
    }

    // 신뢰도 기본 효과 적용
    if (quest.trustEffect) {
      if (quest.trustEffect.suin) adjustTrust('suin', quest.trustEffect.suin);
      if (quest.trustEffect.aran) adjustTrust('aran', quest.trustEffect.aran);
    }

    // 다음 전환 퀘스트 확보
    const nextQ = quest.choiceNext?.[index] || quest.nextQuest;
    onQuestAdvance(nextQ);
  };

  // 14. 씬 정밀 조사 핫스팟 클릭 처리
  const handleHotspotClick = (id: string, spotKey: string, dialog: string, grantsItemId?: string) => {
    setSearchedHotspots(prev => ({ ...prev, [spotKey]: true }));
    addLog(`🔍 [수색 발견] ${spotKey}를 색출함`, 'good');
    
    // 즉시 단서 검사 모달 팝업 출동
    setInspectedClue({ id, name: spotKey, dialog });

    if (grantsItemId) {
      grantItem(grantsItemId);
    }
  };

  // 관찰형 구역 탐색 성공 핸들링
  const handleObserveSubmit = () => {
    // 특정 구획에서 얻는 고유 아이템 부여
    if (quest.itemsGranted) {
      quest.itemsGranted.forEach(id => grantItem(id));
    }

    if (quest.trustEffect) {
      if (quest.trustEffect.suin) adjustTrust('suin', quest.trustEffect.suin);
      if (quest.trustEffect.aran) adjustTrust('aran', quest.trustEffect.aran);
    }

    setFeedback({ type: 'ok', text: '✓ 정밀 수색 완료! 귀중한 단서 원류를 쟁취했습니다.' });
    addLog(`🔍 ${quest.location}의 조사를 성공리에 격발완료했습니다.`, 'good');
    
    // 지연 전이
    setTimeout(() => {
      onQuestAdvance(quest.nextQuest);
    }, 1200);
  };

  // 14-B. 특수 가스실 전용 조사 시퀀스
  const handleGasSearch = (action: 'desk' | 'extinguisher' | 'ventilator') => {
    if (action === 'desk' && gasSearchStep === 0) {
      grantItem('coin');
      setGasSearchStep(1);
      addLog('책상 위의 황동 서류철 틈새를 찢어 얇고 가라앉은 구리 "동전" 한 개를 회수해 주머니에 넣었습니다!', 'key');
      setFeedback({ type: 'ok', text: '볼트 나사를 풀어낼 Cylinder Coin을 확보했습니다.' });
    } else if (action === 'extinguisher' && gasSearchStep === 1) {
      setGasSearchStep(2);
      addLog('무거운 하론 소화기를 발로 차 밀어내고, 후방 벽면 격실 자락에서 가스 "환기 빗장 철망"을 찾아냈습니다!', 'good');
      setFeedback({ type: 'ok', text: '환풍 격자가 발굴되었습니다. 주머니 속 동전으로 사각형 고정 볼트 4개를 푸십시오.' });
    } else if (action === 'ventilator' && gasSearchStep === 2) {
      setGasSearchStep(3);
      addLog('주머니 속 동전을 칼날처럼 대리어 힘껏 물린 볼트 나사 4개를 차례로 회전 유림 유탈시켰습니다! 철망이 떨어집니다.', 'good');
      setFeedback({ type: 'ok', text: '쾌거! 알루미늄 배선판 이면지에 붉은 펜으로 적힌 4자리 비상해치 해제번호 [2749]를 확인했습니다!' });
    }
  };

  // 15. 성공 시 호출
  const onQuestSolveSuccess = () => {
    setFeedback({ type: 'ok', text: '✓ 암호 주입 정합 통과! 경계 세그먼트 전위가 무너집니다.' });
    addLog(`🔓 [식별 대조 완전 성공] 다이얼 격발 성공 — [${quest.title}]`, 'good');

    if (quest.itemsGranted) {
      quest.itemsGranted.forEach(id => grantItem(id));
    }

    if (quest.trustEffect) {
      if (quest.trustEffect.suin) adjustTrust('suin', quest.trustEffect.suin);
      if (quest.trustEffect.aran) adjustTrust('aran', quest.trustEffect.aran);
    }

    setTimeout(() => {
      onQuestAdvance(quest.nextQuest);
    }, 1100);
  };

  // 16. 씬 전환 공통 루트
  const onQuestAdvance = (nextQId: string) => {
    if (!quest) return;
    if (!completedQuests.includes(quest.qid)) {
      setCompletedQuests(prev => [...prev, quest.qid]);
    }

    if (nextQId === 'ENDING') {
      determineAndTriggerEnding();
    } else if (nextQId === 'ENDING-DEFEAT') {
      onEndReached('defeat', suinTrust, aranTrust);
    } else {
      setCurrentQuestId(nextQId);
    }
  };

  // 17. 엔딩 수렴 검출기
  const determineAndTriggerEnding = () => {
    setTimerActive(false);
    addLog('🏆 축하합니다! 에덴의 모든 물리/심리 장벽 암호를 해독하며 생체 격실 도크에 전격 안착하셨습니다.', 'key');
    
    // 신뢰도 세부 지수에 근거한 멀티 엔딩 산출 (한층 정교화)
    let ending = 'truth';
    if (aranTrust >= 55) {
      ending = 'liberation'; // 완전 해방법
    } else if (suinTrust >= 55) {
      ending = 'defeat'; // 수인 회장에 세뇌 세컨 카드로 전란
    } else if (aranTrust >= 30) {
      ending = 'truth'; // 진실 고지형 탈출
    } else {
      ending = 'escape'; // 단순 도망
    }

    onEndReached(ending, suinTrust, aranTrust);
  };

  if (!quest) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#07070a] text-white">
        <div className="text-center font-mono space-y-4">
          <p className="text-[#d4b86a] animate-pulse">※ SYNAPTIC INTERACTION LOADING...</p>
          <p className="text-xs text-zinc-500">지정된 가상 구획 정보를 가져오는 중입니다...</p>
        </div>
      </div>
    );
  }

  const currentHintsUsed = hintsUsed[quest.qid] || 0;

  const ITEM_ORGANIC_TIPS: Record<string, string> = {
    notebook: "규리가 버릇처럼 암호를 역배열하거나, 영문 자모를 밀어 쓰는 암기 방식을 기록해 둔 유서 깊은 암호 가이드북입니다.\n[연동 시점]: 보건실 약품 냉장고(카이사르 DONE), -3층 최종 임상실 암호 해독 교차 대입에 절대적으로 연동됩니다.",
    flashlight: "어둡고 습한 구강 공간의 3D 지형을 실시간으로 빛내주어, 수색 가능한 핵심 오브젝트 핫스팟(🔍)들을 조준 및 활성할 수 있도록 보조합니다.",
    schedule: "기숙 복도 벽면 게시판에 기재된 일과 규칙표.\n수요일 밤에 진행되는 에덴 보안 대원의 순찰 간격(분) 수치 암호를 명시하여 안전 돌파를 촉진시킵니다.",
    map_piece: "에덴 기숙학원 중앙 지층 및 지하 3층 생체 구역의 지형학 설계 파편.\n전원 통제 및 탈출 동선을 계획하는 과정에서 위치 판단의 기저가 됩니다.",
    note_aran: "김아란과의 격렬한 대립 조우 사건 때 인수한 피 묻은 가죽 쪽지.\n'수인을 조심해'라는 진짜 수용 기억 인물의 격정 낙서가 새겨져 있어 엘리베이터 갈림길에서 수인의 가스 트랩을 우회할 결정적 힌지를 제공합니다.",
    drug_code: "보건실 냉장고 해제 후 획득한 약물 라벨 기록: [B-3-47]\n지하 -3층 최종 캡슐 도관을 파탈하기 위해 규리의 신경 패턴 순서(7-8-2-3)에 맞춰 배열하는 기하 정보와 직접 교차 융합됩니다.",
    bracelet: "규리의 소유였던 수공 실마리 갈색 매듭 팔찌.\n그녀가 손수 땋은 매듭 마디 수(7) 등을 통해 원장실 금고 서랍 등의 해독 암호인 [747]을 수립하는 근거가 됩니다.",
    note_guri: "원장실 기괴한 해골 실습 인형 복부 지퍼 가죽 속에서 구출해 낸 피맺힌 편지.\n'수인의 비녀 배지'가 에덴 지하 승인 마스터 칩셋이라는 진실을 폭로하여 아란을 도울 개연성을 일깨웁니다.",
    hairpin: "수인에게서 쟁취해 낸 모범 배지 비녀 마스터키.\n지하 격리실의 육중한 승강 시 콘솔 및 최종 유압 패키지 관문에 직접 삽입되는 최고 등급 마스터 제어 배지입니다.",
    coin: "원장실 및 각 지상 집무 책상 구석에서 가느다란 궤적을 뚫고 획득한 황동 동전.\n[연동 시점]: 가스 살포 트랩 기습 시, 비상 송풍구 환기 철망에 달린 사각 고정 나사 4개를 동전 가장자리를 힘껏 물려 드라이버처럼 돌려 기계적으로 탈거하는 유일한 물리 기구입니다.",
    vial: "보건소 특수 냉각고에서 취득한 백신 혈청 앰플.\n규리를 보존하는 4.0°C 포드의 과열 반응을 통제하고 무독 치료하는 과정에서 절대적 촉매로 활성화됩니다.",
    criteria: "인간 선별 적격 보고 명세서.\n피험 연령 분배와 서연 및 규리의 고유 가 수치 자릿수를 매칭시켜 -3층 캡슐 해제 코드를 정렬하는 보정 지침서 역할을 수행합니다."
  };

  return (
    <div className="flex h-full w-full bg-[#07070a] text-[#E6E4F4] overflow-hidden select-none font-sans gothic-stone">
      
      {/* ────────────────────────────────────────────────────────
           1. LEFT SECTION (🎒 GEARS & ORGANIC CONNECTION ANALYZER)
         ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[265px] bg-[#0d0d12]/95 border-r border-[#d4b86a]/15 flex-col justify-between flex-shrink-0 z-20">
        
        {/* 상단 스캐너 무늬 헤더 */}
        <div className="p-4 border-b border-[#d4b86a]/15 select-none bg-black/20 shrink-0 text-left">
          <div className="flex items-center gap-1.5 mb-1">
            <Compass className="h-4 w-4 text-[#d4b86a] animate-spin" style={{ animationDuration: '6s' }} />
            <p className="font-mono text-[9px] text-[#d4b86a] tracking-[0.18em] uppercase font-bold">
              🎒 GEARS & CONNECTS
            </p>
          </div>
          <span className="block text-[8px] text-[#b2adcf]">소지품의 유기적 매핑 및 수수께끼 연동 지침</span>
        </div>

        {/* 아이템 목록 스크롤 챔버 */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3.5 select-text font-sans scrollbar-thin">
          
          {/* 현재 획득한 아이템 현황 통계 간편 인디케이터 */}
          <div className="p-2.5 rounded bg-black/40 border border-white/5 space-y-1.5 select-none">
            <div className="flex justify-between items-center text-[8.5px] font-mono leading-none">
              <span className="text-zinc-500">CONNECTED GEARS:</span>
              <span className="text-[#f3d995] font-black">{Array.from(new Set(inventory)).length} / {Object.keys(ITEMS).length}</span>
            </div>
            <div className="h-1.5 w-full bg-black rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-[#92762a] to-[#e4c97b] rounded-full transition-all duration-500"
                style={{ width: `${(Array.from(new Set(inventory)).length / Object.keys(ITEMS).length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            {Object.keys(ITEMS).map((itemId) => {
              const item = ITEMS[itemId];
              const isAcquired = inventory.includes(itemId);
              const organicTip = ITEM_ORGANIC_TIPS[itemId] || "보안 제어를 위한 주요 단서 조각입니다.";
              const isRequiredForCurrentQuest = quest.itemsRequired?.includes(itemId);

              if (isAcquired) {
                return (
                  <div 
                    key={itemId}
                    className={`p-3 rounded-lg border bg-[#111116]/90 transition-all duration-300 relative overflow-hidden group hover:bg-[#161622]
                      ${isRequiredForCurrentQuest 
                        ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)]' 
                        : 'border-[#d4b86a]/20 hover:border-[#d4b86a]/60'
                      }`}
                  >
                    {/* 상부 광학 레이저 장정 */}
                    {isRequiredForCurrentQuest && (
                      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse"></div>
                    )}

                    <div className="flex items-center gap-2 mb-1.5 text-left">
                      <div className="h-8 w-8 rounded bg-black/60 border border-[#d4b86a]/30 flex items-center justify-center text-lg select-none shrink-0 border-opacity-70">
                        {item.emoji}
                      </div>
                      <div className="text-left">
                        <h4 className="font-serif text-xs font-black text-[#f3d995] leading-none mb-1">{item.name}</h4>
                        <span className="font-mono text-[6.5px] text-emerald-400 font-bold tracking-wider uppercase block">● ACTIVE COUPLING</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-400 font-serif leading-snug mb-2 text-left select-text">{item.desc}</p>
                    
                    {/* 🔬 유기적 매핑 분석 팁 */}
                    <div className="rounded bg-black/60 border border-white/5 p-2 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[8px]">🔬</span>
                        <span className="font-mono text-[7px] text-amber-400 font-bold uppercase tracking-wider block">ORGANIC COUPLING REPORT</span>
                      </div>
                      <p className="text-[9.5px] font-serif text-zinc-350 leading-relaxed text-left whitespace-pre-line">
                        {organicTip}
                      </p>
                    </div>

                    {isRequiredForCurrentQuest && (
                      <div className="mt-2 text-[8px] font-serif text-emerald-400 font-bold bg-[#10b981]/5 border border-[#10b981]/15 p-1 rounded text-center animate-pulse">
                        ⚠️ 현재 구희 전위 개방에 직접 연계 대입하십시오!
                      </div>
                    )}
                  </div>
                );
              } else {
                // 미획득 아이템은 대외비 보안 신호 상태로 표시
                // 이를 통해 기물들이 어디쯤서 낚여 활용되는지 힌트 감각을 적극 도우라!
                return (
                  <div key={itemId} className="p-2.5 rounded-lg border border-dashed border-white/5 bg-black/20 opacity-55 hover:opacity-85 transition-opacity duration-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-7 w-7 rounded bg-black/80 border border-white/5 flex items-center justify-center text-sm filter grayscale select-none shrink-0">
                        🔒
                      </div>
                      <div className="text-left">
                        <h4 className="font-serif text-[10.5px] font-bold text-gray-400 leading-none mb-0.5">대외비 장치 데이터</h4>
                        <span className="font-mono text-[6.5px] text-zinc-650 block">UNRESOLVED COUPLING SIGNAL</span>
                      </div>
                    </div>
                    <p className="text-[8.5px] font-serif text-zinc-500 leading-snug italic text-left">
                      {itemId === 'notebook' && "· 복도 사물함의 과거 비밀 기록 수첩"}
                      {itemId === 'vial' && "· 보건소 약품 잠금장치를 DONE 해두어 획득"}
                      {itemId === 'drug_code' && "· 보건관 냉각고 복호 성공 시 규명"}
                      {itemId === 'bracelet' && "· 원장실 책상 뒤 동양 액자 내장 은닉 매체"}
                      {itemId === 'note_guri' && "· 원장실 기인 해부학 인형 복단 지퍼 개방"}
                      {itemId === 'note_aran' && "· 보건실 어두운 조우 시 아란의 쪽지 가치인수"}
                      {itemId === 'map_piece' && "· 학생회실 황수인 회장 연도 금고 개봉"}
                      {itemId === 'hairpin' && "· 지하 통제 전실 갈림길에서 수인을 피탈하고 수급"}
                      {itemId === 'coin' && "· 원장실 및 각 지상 탐사 구획 벽면 동전 획득"}
                      {itemId === 'criteria' && "· 선별 PDF 유출 컴퓨터 로그 시 수집"}
                      {itemId === 'schedule' && "· STAGE 1 야간 복도 도정 수색 점호표"}
                      {itemId === 'flashlight' && "· 구역 탐색 라이트기"}
                    </p>
                  </div>
                );
              }
            })}
          </div>

        </div>

        {/* 하부 영동 분석기 현판 */}
        <div className="p-3 bg-black/40 border-t border-[#d4b86a]/15 text-center shrink-0">
          <p className="font-mono text-[7px] text-zinc-500 uppercase tracking-widest leading-none">
            STATIC DIRECT COUPLING MONITOR
          </p>
          <span className="text-[7.5px] font-serif text-[#d4b86a] mt-0.5 block">진실 번호와 규리의 쪽지 연동 활성</span>
        </div>

      </div>

      {/* ────────────────────────────────────────────────────────
           2. CENTER INTERACTIVE FIELD (주 동작 및 방탈출 퍼즐 지면)
         ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#07070a] relative">
        
        {/* 상단 통합 제어 & 진척도 수치 헤더 바 */}
        <div className="h-16 border-b border-white/5 bg-[#0a0a0f]/95 px-4 md:px-6 flex items-center justify-between shrink-0 select-none z-10 gap-4">
          <div className="flex items-center gap-3 shrink-0">
            {/* 로고 & 시나리오 식각 */}
            <div className="flex items-center gap-2.5 border-r border-white/5 pr-3">
              <div className="h-7 w-7 rounded-full border border-[#d4b86a] bg-black flex items-center justify-center font-serif text-xs font-black text-[#d4b86a] shadow-[0_0_8px_rgba(212,184,106,0.2)]">
                E
              </div>
              <div className="hidden sm:block">
                <div className="font-serif text-[10.5px] font-black text-[#d4b86a] leading-none mb-0.5">
                  {scenario === 'A' ? '시나리오 A — 에덴의 가면' : scenario === 'B' ? '시나리오 B — 무균실의 기억' : '시나리오 C — 선택받은 자들'}
                </div>
                <span className="font-mono text-[7px] text-gray-500 tracking-widest block uppercase text-left">
                  EDEN DEEP SECTOR
                </span>
              </div>
            </div>

            {/* 현재 스테이지의 위치 */}
            <div className="flex items-center gap-2">
              <span className="text-lg">{quest?.emoji}</span>
              <div className="text-left">
                <span className="font-mono text-[7px] text-gray-500 tracking-wider block">STAGE {quest?.stage} LOCATION</span>
                <span className="font-serif text-xs font-black text-white">{quest?.location}</span>
              </div>
            </div>
          </div>

          {/* 화면 상단 진척도(스포일러 방지를 고려한 게임 진행도 게이지) */}
          {(() => {
            const totalQuests = quests.length;
            const currentQuestIdx = quests.findIndex(curr => curr.qid === currentQuestId);
            const progressPercent = totalQuests > 0 ? Math.round(((currentQuestIdx + 1) / totalQuests) * 100) : 0;

            return (
              <div className="hidden md:flex flex-col gap-1 w-64 lg:w-80 select-none shrink-0">
                <div className="flex justify-between items-center text-[9px] font-mono leading-none">
                  <span className="text-[#d4b86a]/80 font-bold tracking-widest uppercase">DEEP SECTOR PROGRESS</span>
                  <span className="text-[#f3d995] font-black tracking-wider">
                    STAGE {quest?.stage} / {totalQuests} ({progressPercent}%)
                  </span>
                </div>
                
                {/* 실감나는 분극 세그먼트형 게이지 레일 */}
                <div className="h-2.5 w-full bg-black/90 rounded border border-[#d4b86a]/15 overflow-hidden relative flex items-center">
                  {/* 동적 충전도 게이지 바 */}
                  <div 
                    className="h-full bg-gradient-to-r from-[#92762a] via-[#b69a47] to-[#e4c97b] transition-all duration-700 ease-out shadow-[0_0_8px_rgba(212,184,106,0.5)]"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                  
                  {/* 각 퀘스트 구분 분할선 오버레이 (틱 마크) */}
                  <div className="absolute inset-0 flex justify-between pointer-events-none px-[1px]">
                    {Array.from({ length: totalQuests + 1 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-[1px] h-full ${
                          i <= currentQuestIdx + 1 
                            ? 'bg-black/30' 
                            : 'bg-white/5'
                        }`}
                      ></div>
                    ))}
                  </div>

                  {/* 호버 시 혹은 시인성을 돕기 위한 은은학 펄스 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none"></div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-serif text-gray-500">
                  <span className="truncate max-w-[180px] text-left">
                    🗺️ {quest?.title.split(' — ')[0]}
                  </span>
                  <span className="font-mono text-[8.5px] text-zinc-500">
                    {quests[currentQuestIdx + 1] ? `NEXT: ${quests[currentQuestIdx + 1].title.split(' — ')[0]}` : 'FINAL STAGE'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* 신뢰도 및 시간 초과 경보 */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
              {/* 수인 신뢰도 */}
              <div className="flex flex-col select-none">
                <div className="flex justify-between items-center text-[8px] font-mono leading-none mb-0.5 gap-2">
                  <span className="text-yellow-400 font-bold">SUIN</span>
                  <span className="text-gray-400 font-bold">{suinTrust}%</span>
                </div>
                <div className="h-1 w-12 bg-black rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${suinTrust}%` }}
                  ></div>
                </div>
              </div>

              <div className="h-5 w-[1px] bg-white/5"></div>

              {/* 아란 신뢰도 */}
              <div className="flex flex-col select-none">
                <div className="flex justify-between items-center text-[8px] font-mono leading-none mb-0.5 gap-2">
                  <span className="text-cyan-400 font-bold">ARAN</span>
                  <span className="text-gray-400 font-bold">{aranTrust}%</span>
                </div>
                <div className="h-1 w-12 bg-black rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${aranTrust}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 타이머 */}
            {timerActive && (
              <div className={`font-mono text-[10px] px-2.5 py-1.5 rounded border flex items-center gap-1.5 shrink-0
                ${timerRemaining <= 45 
                  ? 'border-red-600 bg-red-950/40 text-red-400 animate-pulse font-black' 
                  : 'border-yellow-600 bg-yellow-950/20 text-yellow-400'
                }`}
              >
                <Clock className="h-3 w-3 animate-spin" />
                <span>{Math.floor(timerRemaining / 60)}:{String(timerRemaining % 60).padStart(2, '0')}</span>
              </div>
            )}
          </div>
        </div>

        {/* 중앙 연출 일러스트 및 조작 카드 존 (텍스트 밀도가 대폭 축조되고 visual hotspot 및 dial lock 탑재) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          
          {/* 가상 시네마 환경 이미지 캔버스 (핫스팟 점검 및 고풍 대리) */}
          <div className="relative w-full rounded-lg border border-[#d4b86a]/15 bg-gradient-to-br from-[#121218] via-[#09090c] to-[#07070a] p-4 shadow-inner flex flex-col justify-between overflow-hidden relative select-none gap-4">
            
            {/* 연기 혹은 어두운 안개 오버레이 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.08)_0%,transparent_90%)] pointer-events-none"></div>

            <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 border-b border-white/5 pb-2 shrink-0">
              <span className="flex items-center gap-1 text-[#d4b86a]">
                <Sparkles className="h-3 w-3 animate-pulse" />
                EDEN VIRTUAL 3D TACTICAL CHAMBER
              </span>
              <span>SECURED SCANNER LOG ACTIVE</span>
            </div>

            {/* A-10-gas 전용 실시간 기밀 독극 농도 인터페이스 상부 조명 가스경보 */}
            {quest?.qid === 'A-10-gas' && (
              <div className="p-3.5 w-full border border-red-500/25 rounded bg-[#1c0c0c]/90 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl animate-bounce">🚨</span>
                  <div>
                    <span className="text-[10px] font-mono text-red-400 block leading-none">HIGH-RISK ATOMIC RADIATION DETECTOR</span>
                    <h4 className="font-serif text-sm font-black text-rose-200">기화 독성 가스 침수 경보</h4>
                  </div>
                </div>
                
                <div className="w-full md:w-48 text-right space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-red-400">
                    <span>가스 농도 축적:</span>
                    <span className="font-bold text-xs">{gasConcentration}%</span>
                  </div>
                  <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-red-950">
                    <div 
                      className="h-full bg-gradient-to-r from-red-600 to-yellow-500 rounded-full transition-all duration-300"
                      style={{ width: `${gasConcentration}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* 메인 3D 공간 탐색 챔버 장착 */}
            <Room3DExplorer 
              quest={quest}
              inventory={inventory}
              searchedHotspots={searchedHotspots}
              onHotspotClick={handleHotspotClick}
            />

            {/* 수평 인벤토리 소지품창 */}
            <div className="bg-black/70 border border-[#d4b86a]/15 rounded-md p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between shadow-xl gap-3 shrink-0 text-left">
              <div className="flex items-center gap-1.5 shrink-0 select-none pb-2 sm:pb-0 sm:border-r sm:border-white/5 sm:pr-3">
                <span className="text-sm">🎒</span> 
                <span className="font-serif text-[10.5px] font-black text-[#d4b86a] tracking-wider">INVENTORY DETECTED ({Array.from(new Set(inventory)).length})</span>
              </div>

              {inventory.length === 0 ? (
                <div className="flex-1 text-center font-serif text-[10.5px] text-gray-500 italic">
                  — 아직 획득한 기밀 장비나 힌트 도구가 없습니다. 3D 스캐너 내 공간의 핫스팟(🔍)을 터치하여 기어를 수색하십시오 —
                </div>
              ) : (
                <div className="flex-1 flex flex-wrap gap-2.5 items-center justify-start sm:pl-3">
                  {(Array.from(new Set(inventory)) as string[]).map(itemId => {
                    const item = ITEMS[itemId];
                    const isRequiredHere = quest.itemsRequired?.includes(itemId);
                    
                    return (
                      <div 
                        key={itemId}
                        className={`group relative h-9 w-9 rounded-md border bg-[#050508]/90 flex items-center justify-center text-lg cursor-pointer duration-200 hover:scale-105 active:scale-95
                          ${isRequiredHere 
                            ? 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.35)] animate-pulse' 
                            : 'border-[#d4b86a]/30 hover:border-[#d4b86a]'
                          }`}
                      >
                        {item?.emoji}
                        
                        {/* 상단 핀 툴팁 안내 패널 */}
                        <div className="pointer-events-none absolute bottom-11 left-1/2 -translate-x-1/2 rounded border border-gray-700 bg-[#0d0d12] p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 w-44 shadow-2xl leading-relaxed text-left">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span>{item?.emoji}</span>
                            <strong className="text-xs text-[#d4b86a] font-serif">{item?.name}</strong>
                          </div>
                          <p className="text-gray-400 text-[10px] whitespace-pre-line leading-snug">{item?.desc}</p>
                          {isRequiredHere && (
                            <p className="text-emerald-400 text-[9px] font-bold mt-1.5 animate-pulse">
                              ⚠️ 이 구획 암호 대조를 위해 필요한 연동 기어입니다!
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* A-10-gas 가스실 전용 분기 수색 순차 조작기 */}
            {quest?.qid === 'A-10-gas' && (
              <div className="w-full space-y-2 mt-1 bg-[#120505]/40 p-3 rounded border border-red-900/10">
                <p className="text-[10.5px] text-red-400 font-serif text-center font-bold">
                  ⚠️ 가스실 격실 탈출을 위해 아래 3단계 물리적 상호작용 제어 자키를 수행하십시오!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <button 
                    disabled={gasSearchStep !== 0}
                    onClick={() => handleGasSearch('desk')}
                    className={`p-3 rounded font-serif font-bold transition-all text-left flex items-center justify-between cursor-pointer
                      ${gasSearchStep === 0 
                        ? 'bg-red-900/40 border border-red-500 text-white hover:bg-red-800/60 animate-pulse' 
                        : 'bg-black/60 text-gray-500 border border-white/5 cursor-not-allowed'
                      }`}
                  >
                    <span>1. 집무 책상 수색하기</span>
                    {gasSearchStep > 0 ? <span className="text-emerald-400">✓ 완료</span> : <span className="text-red-400">🔍 탐사</span>}
                  </button>

                  <button 
                    disabled={gasSearchStep !== 1}
                    onClick={() => handleGasSearch('extinguisher')}
                    className={`p-3 rounded font-serif font-bold transition-all text-left flex items-center justify-between cursor-pointer
                      ${gasSearchStep === 1 
                        ? 'bg-red-900/40 border border-red-500 text-white hover:bg-red-800/60 animate-pulse' 
                        : 'bg-black/60 text-gray-500 border border-white/5 cursor-not-allowed'
                      }`}
                  >
                    <span>2. 하론 소화기 밀어치우기</span>
                    {gasSearchStep > 1 ? <span className="text-emerald-400">✓ 완료</span> : <span className="text-red-400">🔍 탐사</span>}
                  </button>

                  <button 
                    disabled={gasSearchStep !== 2}
                    onClick={() => handleGasSearch('ventilator')}
                    className={`p-3 rounded font-serif font-bold transition-all text-left flex items-center justify-between cursor-pointer
                      ${gasSearchStep === 2 
                        ? 'bg-red-900/40 border border-[#d4b86a] text-white hover:bg-red-800/60 animate-pulse' 
                        : 'bg-black/60 text-gray-500 border border-white/5 cursor-not-allowed'
                      }`}
                  >
                    <span>3. 환송구 볼트 분기 고동</span>
                    {gasSearchStep > 2 ? <span className="text-emerald-400">✓ 완료</span> : <span className="text-red-400">⚙️ 분해 (동전)</span>}
                  </button>
                </div>
                {gasSearchStep === 3 && (
                  <div className="bg-black/80 p-3.5 rounded border border-emerald-500/30 text-emerald-400 text-xs font-serif leading-relaxed text-center mt-2 animate-pulse">
                    🎉 알림: 동전 나사 분해 성공! 철망이 떨어지며 비상 탈출 암호 <strong className="text-white underline text-sm tracking-widest">[ 2749 ]</strong> 가 규명되었습니다. 아래 다이얼 락에 수치를 대조하거나 붉은 개방 단추를 클릭하십시오!
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-[9px] font-mono text-gray-600 border-t border-white/5 pt-2 shrink-0 select-none">
              <span>SCAN DEPTH: STAGE {quest?.stage}</span>
              <span>EDEN SECURE LAB PLATFORM</span>
            </div>

          </div>

          {/* 퀘스트 텍스트 설명 구조화 (글자수 대폭 단조화 및 헤더 릴레이 증폭) */}
          <div className="space-y-4">
            
            <div className="flex items-center gap-2 select-none">
              <span className="font-mono text-[10px] text-[#d4b86a] tracking-widest uppercase border border-[#d4b86a]/20 bg-[#141210] px-2.5 py-0.5 rounded font-black">
                {quest?.qid}
              </span>
              <span className="h-[1px] bg-gradient-to-r from-white/10 to-transparent flex-1"></span>
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-lg md:text-xl font-black text-white tracking-tight">
                {quest?.title}
              </h3>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none">
                LOCATION: {quest?.location}
              </p>
            </div>

            {/* 메인 의뢰 지문 박스 - 가독성 향상 */}
            <div className="rounded-lg border border-[#d4b86a]/15 bg-[#111116]/80 p-5 font-serif text-[12.5px] text-[#b2adcf] leading-relaxed whitespace-pre-line border-l-4 border-l-[#d4b86a] select-text shadow-xl">
              {quest?.problem}
            </div>

            {/* 특정 퀘스트 선결 요건 표시 */}
            {quest.itemsRequired && quest.itemsRequired.length > 0 && (
              <div className="p-4 rounded border border-white/5 bg-black/40 space-y-2 select-none">
                <p className="font-mono text-[8px] text-gray-500 tracking-widest uppercase">
                  ⚠️ REQUIRED SYSTEM ACCESS CRITERIALS
                </p>
                <div className="flex flex-wrap gap-2">
                  {quest.itemsRequired.map(id => {
                    const have = hasItem(id);
                    const item = ITEMS[id];
                    return (
                      <div 
                        key={id}
                        className={`flex items-center gap-2 text-xs border rounded px-3 py-1.5 font-serif font-black transition-all
                          ${have 
                            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
                            : 'border-red-500/20 bg-red-950/5 text-red-400'
                          }`}
                      >
                        <span>{item?.emoji}</span>
                        <span>{item?.name}</span>
                        <strong className="text-[9px] uppercase tracking-wide">
                          {have ? '[연동 완료]' : '[장비 미확인]'}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 극 동행 실시간 귓속말 속삭임 대화창 */}
            {quest.npcLine && (
              <div className="rounded border border-white/5 bg-black/20 p-4 font-serif text-[12px] italic text-[#a39eba] leading-relaxed border-l-2 border-l-[#d4b86a]/40 shadow-inner select-text">
                <strong className="text-[#d4b86a] not-italic mr-1.5 font-bold font-serif">●</strong> {quest.npcLine}
              </div>
            )}

          </div>

        </div>

        {/* ────────────────────────────────────────────────────────
             3. BOTTOM CONTROL DRAWER (다이얼 자물쇠, 키패드, 버튼들)
           ──────────────────────────────────────────────────────── */}
        <div className="border-t border-white/5 bg-[#0a0a0f]/95 p-5 shrink-0 z-10 relative">
          
          {/* 가스방 전용인 경우 특별한 수색 버튼 및 암호 주입 동시 제공 */}
          {quest.qid === 'A-10-gas' ? (
            <div className="space-y-4">
              {gasSearchStep === 3 && (
                <div className="flex flex-col items-center">
                  <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-2">INPUT ESCAPE CODES</p>
                  
                  {/* 동전/조수 회수 전용 다이얼 로크 */}
                  <div className="flex gap-4 items-center justify-center p-4 rounded bg-black/60 border border-emerald-900/30">
                    <div className="flex border border-emerald-500/30 rounded bg-[#09090f] p-1 w-44">
                      <input 
                        type="text" 
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        maxLength={4}
                        placeholder="4자리 코드"
                        onKeyDown={e => { if (e.key === 'Enter') handleCodeSubmit(); }}
                        className={`w-full bg-transparent p-2 font-mono text-center text-white text-lg tracking-[0.25em] outline-none placeholder:text-gray-700 ${isShakeInput ? 'border-red-500 animate-shake' : ''}`}
                      />
                    </div>
                    
                    <button 
                      onClick={handleCodeSubmit}
                      className="px-6 py-3.5 rounded bg-emerald-600 hover:bg-emerald-500 font-serif text-xs font-black text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer transition-all"
                    >
                      🚪 탈출용 해치 폐기 개방
                    </button>
                  </div>
                </div>
              )}
            </div>

          ) : (
            /* 일반 퀘스트 입력 유형 분기 렌더링 */
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              
              {/* [자물쇠형 코드]: 4자리 황동 다이얼 로크 인터랙터 가동 */}
              {quest.type === 'code' && (
                <div className="w-full lg:w-[60%] space-y-3.5 bg-black/40 p-4 rounded-lg border border-white/5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                    <p className="font-mono text-[9px] text-gray-500 tracking-widest uppercase">
                      🔐 BRASS COMBINATION DIAL PADLOCK (황동 번호 회전자)
                    </p>
                    <span className="text-[10px] font-serif text-[#d4b86a]">숫자를 돌려 빗장을 타치하세요</span>
                  </div>

                  <div className="flex items-center justify-center gap-5 py-2">
                    {dialDigits.map((digit, i) => (
                      <div key={i} className="flex flex-col items-center select-none">
                        {/* 업 버튼 */}
                        <button 
                          onClick={() => rotateDial(i, 'up')}
                          className="h-8 w-8 rounded-full bg-white/5 hover:bg-[#d4b86a]/20 border border-white/10 hover:border-[#d4b86a]/50 text-gray-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors focus:outline-none"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>

                        {/* 숫자통 */}
                        <div className="my-2 h-12 w-12 rounded border-2 border-[#d4b86a]/60 bg-gradient-to-b from-[#1c1a14] to-black flex items-center justify-center font-mono text-xl font-bold text-[#f3d995] shadow-lg">
                          {digit}
                        </div>

                        {/* 다운 버튼 */}
                        <button 
                          onClick={() => rotateDial(i, 'down')}
                          className="h-8 w-8 rounded-full bg-white/5 hover:bg-[#d4b86a]/20 border border-white/10 hover:border-[#d4b86a]/50 text-gray-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors focus:outline-none"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    <div className="h-20 w-[1px] bg-white/5 mx-2"></div>

                    {/* 잠금장치 최종 타격 레버 */}
                    <button 
                      onClick={handleDialSubmit}
                      className="px-6 py-5 rounded border-2 border-[#d4b86a]/40 hover:border-[#d4b86a] bg-[#1d1607] hover:bg-[#d4b86a]/25 text-[#f3d995] font-serif font-black text-xs tracking-widest cursor-pointer transition-all active:translate-y-0.5 flex flex-col items-center justify-center gap-1 shrink-0 h-24 w-28 text-center"
                    >
                      <span>🔓 LOCK</span>
                      <span>DIAL</span>
                      <strong className="text-[9px] font-mono opacity-80 uppercase font-black tracking-tight block">STRIKE</strong>
                    </button>
                  </div>
                </div>
              )}

              {/* [자물쇠형 코드]: 4자리가 아닌 다용도 카이사르 영문 기입 키패드 마운트 */}
              {quest.type === 'caesar' && (
                <div className="w-full lg:w-[60%] space-y-3.5 bg-[#09090f] p-4 rounded border border-[#d4b86a]/20">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                    <p className="font-mono text-[9px] text-[#d4b86a] tracking-widest uppercase">
                      🧪 STERILE MEDICINE CRYPTOGRAPHY ROTOR (카이사르 복호)
                    </p>
                    <span className="text-[9.5px] font-mono text-cyan-400">INPUT REQUIRED: ALPHABETS OR CODES</span>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex border border-gray-700 rounded bg-black p-1 flex-1">
                      <input 
                        type="text" 
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        placeholder="영문 복합 해칭명 대입"
                        className={`w-full bg-transparent p-2 font-mono text-sm text-center text-white outline-none uppercase tracking-widest placeholder:text-gray-700 ${isShakeInput ? 'font-black animate-shake' : ''}`}
                      />
                    </div>
                    <button 
                      onClick={handleCodeSubmit}
                      className="px-6 rounded bg-[#d4b86a] text-black hover:bg-[#f3d995] font-serif text-xs font-black cursor-pointer transition-colors active:translate-y-0.5 shrink-0"
                    >
                      실행 승인
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 items-center justify-center pt-2">
                    {['D','O','N','E','R','S','P','H'].map(char => (
                      <button 
                        key={char}
                        onClick={() => { if (inputValue.length < 8) setInputValue(prev => prev + char); }}
                        className="h-8 w-8 text-xs font-mono font-bold rounded bg-white/5 border border-white/5 hover:border-gray-500 text-gray-300 flex items-center justify-center cursor-pointer focus:outline-none"
                      >
                        {char}
                      </button>
                    ))}
                    <button 
                      onClick={() => setInputValue('')}
                      className="px-2 h-8 text-[10px] font-mono font-bold rounded bg-red-950/20 text-red-400 border border-red-900/30 flex items-center justify-center cursor-pointer focus:outline-none"
                    >
                      C
                    </button>
                  </div>
                </div>
              )}

              {/* [선택형 분기 및 의리 판단]: 양수 양합 선택 기틀 버튼 */}
              {(quest.type === 'choice' || quest.type === 'logic') && (
                <div className="w-full space-y-2.5">
                  <p className="font-mono text-[9px] text-gray-500 tracking-[0.2em] uppercase select-none leading-none">
                    🧭 DECIDE YOUR CRITICAL RESOLUTION PATHWAY
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    {quest.choices?.map((choice, i) => (
                      <button 
                        key={i}
                        onClick={() => handleChoiceSubmit(i)}
                        className={`text-left rounded-lg border-2 p-3 font-serif text-xs font-semibold cursor-pointer transition-all hover:bg-white/[0.02] flex items-center justify-between w-full focus:outline-none
                          ${choice.danger 
                            ? 'border-red-900/40 text-red-300 hover:border-red-600 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-950/10' 
                            : choice.safe 
                              ? 'border-emerald-900/40 text-emerald-400 hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-950/10' 
                              : 'border-[#d4b86a]/20 text-[#d4b86a] hover:border-[#f3d995] hover:shadow-[0_0_15px_rgba(212,184,106,0.15)]'
                          }`}
                      >
                        <span>{choice.text}</span>
                        <ChevronRight className="h-4 w-4 opacity-50 block shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* [수색/관찰 형상 통과 버튼] */}
              {quest.type === 'observe' && (
                <div className="w-full flex justify-center py-2 shrink-0">
                  <button 
                    onClick={handleObserveSubmit}
                    disabled={quest.qid === 'A-01' && !searchedHotspots['📋 벽보 청소 일정표']}
                    className={`w-full max-w-md py-4 rounded-lg font-serif text-xs font-black tracking-widest flex items-center justify-center gap-2 duration-200
                      ${(quest.qid === 'A-01' && !searchedHotspots['📋 벽보 청소 일정표'])
                        ? 'bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed select-none'
                        : 'bg-[#1b1510] border-2 border-[#d4b86a] text-[#f3d995] hover:bg-[#d4b86a] hover:text-black hover:shadow-[0_0_20px_rgba(212,184,106,0.3)] cursor-pointer'
                      }`}
                  >
                    🔍 {quest.qid === 'A-01' && !searchedHotspots['📋 벽보 청소 일정표'] 
                      ? '수색 완료 전에는 안전 복도를 통과할 수 없습니다' 
                      : '환경정립 및 탐문구역 수색 무사 완료 갱신 →'
                    }
                  </button>
                </div>
              )}

            </div>
          )}

          {/* 에러 피드백 상태 인공알림 */}
          {feedback.text && (
            <div className={`mt-3.5 font-mono text-[11px] font-bold tracking-wide text-center transition-all animate-pulse
              ${feedback.type === 'ok' ? 'text-emerald-400' : feedback.type === 'err' ? 'text-red-400' : 'text-[#d4b86a]'}`}
            >
              {feedback.type === 'ok' ? '✓' : '⚠️'} {feedback.text}
            </div>
          )}

        </div>

      </div>

      {/* ────────────────────────────────────────────────────────
           3. RIGHT SECTION (Dialogue real-time Chronicles & Secrets helper)
         ──────────────────────────────────────────────────────── */}
      <div className="w-[260px] bg-[#0d0d12]/95 border-l border-[#d4b86a]/15 flex flex-col justify-between flex-shrink-0 z-20">
        
        {/* 크로니클 저널 타이틀 */}
        <div className="p-4 border-b border-[#d4b86a]/15 select-none bg-black/10 shrink-0">
          <p className="font-mono text-[9px] text-[#d4b86a] tracking-[0.2em] uppercase font-bold text-center block">
            📜 CHRONICLE JOURNAL
          </p>
          <span className="block text-[8px] text-gray-500 text-center mt-0.5">실시간 행적 및 무전 통신 이력</span>
        </div>

        {/* 저널 로그 */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 select-text font-sans scroll-smooth">
          {currentLogs.map((log, i) => (
            <div key={i} className="text-[11.5px] leading-relaxed relative pl-2.5 border-l border-white/5 pb-1">
              <span className="font-mono text-[7.5px] text-gray-600 block leading-none mb-1">{log.time}</span>
              <p className={`font-serif leading-relaxed
                ${log.type === 'good' 
                  ? 'text-emerald-400' 
                  : log.type === 'bad' 
                    ? 'text-red-400 font-bold' 
                    : log.type === 'key' 
                      ? 'text-[#d4b86a] font-black' 
                      : log.type === 'info' 
                        ? 'text-cyan-300' 
                        : 'text-gray-300'
                }`}
              >
                {log.text}
              </p>
            </div>
          ))}
          <div ref={logEndRef}></div>
        </div>

        {/* 대전 웹브라우저 (ARG 포탈) 호출 단축 */}
        {onOpenArgWeb && (
          <div className="p-3 border-t border-[#d4b86a]/10 bg-black/40 shrink-0 select-none">
            <button 
              onClick={onOpenArgWeb}
              className="w-full text-center rounded border border-[#d4b86a]/30 hover:border-[#d4b86a] font-mono text-[9px] text-[#d4b86a] py-2 transition-all bg-[#d4b86a]/5 hover:bg-[#d4b86a]/15 cursor-pointer block focus:outline-none"
            >
              🖥️ 복선 개발자 도구 패널 (ARG) 기동
            </button>
          </div>
        )}

        {/* 순차적 힌지 유출 돔 */}
        <div className="border-t border-[#d4b86a]/15 bg-[#0a0a0f] p-4 flex-shrink-0 z-10 shrink-0">
          <button 
            onClick={fetchHint}
            className="w-full text-left font-mono text-[9.5px] text-gray-500 hover:text-white transition-colors flex justify-between focus:outline-none cursor-pointer"
          >
            <span className="font-serif">🔑 기밀 영역 실마리 (HINTS)</span>
            <span>({quest?.hintsMax - currentHintsUsed}/{quest?.hintsMax})</span>
          </button>

          {isOpenHintBody && currentHintsUsed > 0 && (
            <div className="mt-3 rounded border border-[#d4b86a]/15 bg-black/90 p-3 font-sans text-[10.5px] text-gray-400 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line select-text border-l-2 border-l-[#d4b86a] scrollbar-thin">
              {quest.hintLines.slice(0, currentHintsUsed).map((line, idx) => (
                <div key={idx} className="mb-2.5 last:mb-0">
                  <strong className="text-[#d4b86a] font-serif block text-[9px] mb-0.5">실마리 도화선 {idx + 1}</strong>
                  <p className="font-serif">{line}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 📂 실시간 3D 발견 대외비 단서 정밀 조사 분석 뷰어 모달 */}
      {inspectedClue && (
        <div 
          className="fixed inset-0 bg-black/92 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in"
          onClick={() => setInspectedClue(null)}
        >
          <div 
            className="w-full max-w-5xl lg:max-w-6xl bg-[#0a0a0f] border-2 border-[#d4b86a] rounded-xl overflow-hidden shadow-[0_0_60px_rgba(212,184,106,0.35)] flex flex-col md:flex-row h-auto md:h-[580px] lg:h-[640px] max-h-[92vh] animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Left side: Immersive physical rendering of the item */}
            <div className="w-full md:w-1/2 bg-[#020205] border-r border-white/5 flex flex-col items-center justify-center p-8 relative overflow-hidden min-h-[350px] md:min-h-0 select-none">
              {/* Background ambient circular light */}
              <div className="absolute h-64 w-64 rounded-full bg-[#d4b86a]/5 blur-3xl pointer-events-none"></div>
              
              {/* Physical Render based on clue ID - scaled up for high immersion! */}
              <div className="transform scale-[1.18] sm:scale-[1.28] md:scale-[1.38] lg:scale-[1.48] transition-transform duration-300 origin-center pointer-events-auto">
                <CluePhysicalRenderer id={inspectedClue.id} />
              </div>
              
              <div className="absolute bottom-3 left-4 flex items-center gap-1.5 font-mono text-[8px] text-[#d4b86a]/60">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d4b86a] animate-pulse"></span>
                <span>REAL-TIME INTERACTIVE OBJECT OBSERVER</span>
              </div>
            </div>

            {/* Right side: Detailed Analysis, dialogue logs & clue details */}
            <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-between overflow-y-auto select-text">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[9px] text-[#d4b86a]/80 uppercase tracking-[0.2em] block mb-1.5">FOUND PHYSICAL EVIDENCE</span>
                    <h4 className="font-serif text-lg md:text-xl font-black text-white leading-tight">{inspectedClue.name}</h4>
                  </div>
                  <button 
                    onClick={() => setInspectedClue(null)}
                    className="p-1 px-3 rounded bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-[#d4b86a] text-xs font-mono transition-all cursor-pointer focus:outline-none"
                  >
                    X
                  </button>
                </div>
 
                <div className="h-[1px] bg-gradient-to-r from-white/15 to-transparent"></div>
 
                {/* Substantive Clue Explanations and description */}
                <div className="space-y-5">
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-950/20 p-4.5 font-serif text-[13.5px] md:text-[14.5px] text-yellow-100/90 leading-relaxed max-h-56 overflow-y-auto italic shadow-inner">
                    "{inspectedClue.dialog}"
                  </div>
                  
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] text-[#d4b86a] tracking-[0.2em] uppercase block">🕵️ 서연의 단서 분석 보고</span>
                    <p className="font-serif text-[13px] md:text-[14px] text-gray-300 leading-relaxed bg-white/[0.01] border border-white/5 rounded-lg p-4">
                      {getClueAnalysisText(inspectedClue.id)}
                    </p>
                  </div>
                </div>
              </div>
 
              {/* Action buttons */}
              <div className="border-t border-white/5 pt-6 mt-6 flex gap-2">
                <button 
                  onClick={() => setInspectedClue(null)}
                  className="w-full py-3 rounded-lg bg-[#16120c] border border-[#d4b86a]/60 text-[#f3d995] font-serif font-black text-xs md:text-sm tracking-wide hover:bg-[#d4b86a] hover:text-black hover:shadow-[0_0_20px_rgba(212,184,106,0.4)] transition-all cursor-pointer focus:outline-none"
                >
                  기록 보관함에 연동 복사 및 밀폐 닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ────────────────────────────────────────────────────────
// 🔍 3D 단서 물리 시각화 렌더러 서사 정보
// ────────────────────────────────────────────────────────
function getClueAnalysisText(id: string): string {
  switch (id) {
    case 'locker_gyuri':
      return '사물함 도어에 스크래치와 함께 거꾸로 회전하도록 유도하는 서술이 낙서되어 있어요. 규리의 평소 비밀번호 습관인 거꾸로 뒤집기에 연동된 것으로 보입니다. 사물함의 힌트를 얻기 위해 정합적인 다이얼 조작을 대입해야 합니다.';
    case 'notice_rule':
      return '비상 규칙 보드에 특정 날짜와 하론 환기 밸브 시간 주기가 붉은 형광펜으로 강조되어 있어요. 수요일 점호 훈련 기간 동안 관장실 아래 세척 환기 주기인 "매 시간 8분" 단위 교환을 가리키는 것 같습니다.';
    case 'corridor_box':
      return '복도시 수납함 깊숙이 처박힌 가위와 도구 세트 주변에 구겨진 메모지가 드러납니다. 붉은 글씨로 "03-15"와 조합형 락의 자물이 연동되어 있어 사건 당일 시간과의 개연성이 높습니다.';
    case 'clean_cart':
      return '버려진 청소 트롤리 서랍 한구석에 고성능 방수 손전등이 올려져 있습니다. 이를 작동시키면, 어두운 방 내부의 빛을 반사시켜 육안으로 발견할 수 없었던 녹색 발광 잉크 낙서(Glow Hints)들을 영사할 수 있습니다.';
    case 'clean_schedule':
      return '전반적인 청소 관리 일과표가 클립보드에 바인딩되어 있습니다. 수요일 본관 지층의 검문 및 정화 주기가 8분 간격으로 서전 표기되어 있어, 독가스 강제 유체의 갱신 주기 8분과 직접 맞물립니다.';
    case 'med_temp':
      return '생체 인큐베이터 원격 패널의 온도가 정확히 [4.0°C]에 계측 결합되어 있는 것을 보여줍니다. 오차 없이 고유 항온 기체가 주입되는 상황인지 세심히 조절할 필요가 있습니다.';
    case 'med_reagent':
      return '기밀 성분이 함유된 실험 보존용 시약병입니다. 라벨에는 고유 식별 코드 "B-3-47"이 에칭 각인되어 있으며 형광 발색층을 형성하는 연한 액체가 가공되어 있어 귀중한 정체 규명 보조 재료가 됩니다.';
    case 'med_report':
      return '김규리의 정밀 생체 프로필을 기록한 대외비 임상 차트철입니다. 극비 적합성 판단 및 지상 3층에서 지하 3층 전실 격리 병동으로의 강제 이송 일자가 원장의 인장과 함께 수갑 결속되어 기록되어 있습니다.';
    case 'anatomical_doll':
      return '훈련용 해부학 교구 인형입니다. 몸체를 가로지르는 지퍼 패브릭을 내리고 내부 장기를 검토하자, 수인이가 머리에 꽂고 다니는 "장식 비녀 배지"가 지하 3층 연구동 전역을 열 수 있는 승인 마스터 칩이라는 메모가 숨겨져 있습니다.';
    case 'office_safe':
      return '원장 집무실의 대형 중합 다이얼 금고 장치입니다. 프레임 테두리에 가상 회고적인 현판 설명이 새겨져 있는 것으로 보아 학생회 취임 전성기 임명판의 가속적 연도인 2019와 밀접히 마찰됩니다.';
    case 'office_frame':
      return '수묵화 액자 뒤에 날카로운 못으로 조각된 기하학적 정밀 코드 [2749]를 해독해 냈습니다. 에덴 통제 제어 가스 경보 비상 전송 게이트의 분원 해치 비밀번호로 보입니다.';
    case 'office_chip':
      return '부대표 격인 아란의 일상 소지 복제 칩 세트입니다. 마이크로 레이아웃 위에 무서운 디지털 에이전트 해킹 디코딩 마크인 [7823] 번호가 앰버색 발광부 저항 아래 실장되어 기록되어 있습니다.';
    case 'office_clock':
      return '시간이 고장 나 정지된 태엽 탁상시계입니다. 톱니바퀴 결속각이 3시 15분에 부식 고정되어 굳어 있으며, 에덴 기숙사의 소집 점호 및 규리의 마지막 도주 사건의 시작점을 기리듯 암시하고 있습니다.';
    case 'office_plant':
      return '사무실 한편의 흙화분 바닥 속을 파헤치자 비밀 전선관과 압력식 개방 실린더 하우징이 손바닥만큼 솟구쳐 나옵니다. 원장의 수조 정화 밸브 조절 인터페이스와 원격 동기화 상태에 연결되어 있습니다.';
    default:
      return '에덴 학원 기밀 구획에서 습득한 수집품입니다. 정밀 해독을 위해 소지품 도구함과 연동하여 실시간 조사가 필요합니다.';
  }
}

// ────────────────────────────────────────────────────────
// 🎨 물리 오브젝트 그래픽스 컴포넌트
// ────────────────────────────────────────────────────────
interface CluePhysicalRendererProps {
  id: string;
}

function CluePhysicalRenderer({ id }: CluePhysicalRendererProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // 컴포넌트 마운트/ID 변경 시 플립 리셋
  useEffect(() => {
    setIsFlipped(false);
  }, [id]);

  switch (id) {
    case 'locker_gyuri':
      return (
        <div className="w-56 h-72 bg-[#1b1c22] rounded flex flex-col items-center justify-between p-4 border border-[#d4b86a]/30 shadow-[0_0_20px_rgba(0,0,0,0.8)] relative">
          <div className="w-2 bg-[#101114] h-full absolute left-3 top-0"></div>
          {/* 환기창 벤트 */}
          <div className="w-24 flex flex-col gap-1.5 mt-2">
            {[1, 2, 3].map((v) => (
              <div key={v} className="h-1 bg-black/85 rounded"></div>
            ))}
          </div>
          
          {/* 낙서 수치 */}
          <div className="text-red-600 font-serif text-lg font-black tracking-widest my-4 blur-[0.4px] rotate-[-8deg] select-none shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]">
            "0315"
          </div>

          {/* 리얼 황동 자물쇠 다이얼 */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#d4b86a] via-[#a38031] to-[#604a1b] flex items-center justify-center border-4 border-black shadow-[0_4px_10px_rgba(0,0,0,0.6)] relative group">
            <div className="absolute inset-2 rounded-full border border-black/30 bg-black/10"></div>
            {/* 눈금선들 */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <div 
                key={deg} 
                className="absolute w-1 h-[3px] bg-black/85 origin-center" 
                style={{ transform: `rotate(${deg}deg) translateY(-28px)` }}
              ></div>
            ))}
            {/* 자물쇠 바늘 */}
            <div className="h-6 w-1 bg-red-600 font-black origin-bottom -translate-y-3 shadow-md rounded"></div>
            <div className="absolute bottom-2 font-mono text-[6.5px] text-black font-extrabold select-none">DIAL</div>
          </div>

          <div className="w-1.5 h-10 bg-black/80 absolute right-4 top-1/2 -translate-y-1/2 rounded"></div>
          
          <div className="text-[8.5px] text-gray-500 font-mono tracking-wider mt-2 select-none">
            🔒 GYURI'S MAIN LOCKER DOOR
          </div>
        </div>
      );

    case 'notice_rule':
      return (
        <div className="w-56 h-72 bg-[#faf7eb] text-gray-800 rounded p-4.5 border-4 border-amber-950/25 shadow-[0_10px_25px_rgba(0,0,0,0.7)] font-serif relative">
          {/* 빈티지 압정 */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-red-800 border border-red-950 flex items-center justify-center">
            <div className="h-1 w-1 rounded-full bg-white/60"></div>
          </div>

          <span className="text-[7.5px] font-mono text-red-600 font-extrabold border border-red-500/30 px-1 rounded block w-max select-none mb-1">EDEN-CLASS-IV</span>
          <h5 className="text-[12px] font-bold text-center border-b border-gray-300 pb-1.5 text-gray-900 font-black">비상 대책 긴급 단속 규칙</h5>
          
          <div className="space-y-2 mt-4 text-[9.5px] text-gray-700 leading-normal">
            <p className="border-b border-dashed border-gray-200 pb-1 selection:bg-yellow-105">
              · 특별 소집 훈련 기간 중 본실 격실의 배관 환기 밸브 분배 정합은 아래 기준 수렴.
            </p>
            <p className="border-b border-dashed border-gray-200 pb-1 font-bold bg-yellow-200/50 p-1 rounded">
              👉 <span className="text-red-700">금주 수요일 점호 안전 청소 주기 (매 시간 8분 단위 분기)</span>
            </p>
            <p className="selection:bg-yellow-105">
              · 가스 검문 노드 이탈 발각 시 피 수용 생도 일괄 격리 소각 적용.
            </p>
          </div>

          {/* 낙인 장식 도장 */}
          <div className="absolute bottom-4 right-4 border-2 border-red-500/40 rounded-full h-11 w-11 flex items-center justify-center text-[7px] text-red-600/70 font-mono font-bold rotate-[15deg] select-none">
            APPROVED
          </div>
        </div>
      );

    case 'corridor_box':
      return (
        <div className="w-56 h-72 bg-[#5a1a1a] rounded flex flex-col items-center justify-between p-4 border border-[#d4b86a]/30 shadow-[0_5px_15px_rgba(0,0,0,0.7)] relative">
          <div className="w-full bg-[#3d1212] h-6 border-b border-black/50 rounded-t flex items-center px-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
          </div>
          
          {/* 수납함 내부 전선 */}
          <div className="flex-1 w-full flex flex-col items-center justify-center relative">
            <div className="w-20 h-1 bg-red-600 rounded absolute top-8 rotate-[5deg] blur-[0.2px]"></div>
            <div className="w-24 h-1 bg-blue-600 rounded absolute top-10 rotate-[-8deg] blur-[0.2px]"></div>
            
            {/* 꼬깃꼬깃한 쪽지 */}
            <div className="w-40 h-28 bg-[#faf0c8] rounded border border-amber-900/40 p-3 shadow-md transform rotate-[-4deg] flex flex-col justify-between font-serif text-gray-800">
              <span className="text-[7px] font-mono text-gray-400 block border-b border-gray-200 pb-0.5">TORN NOTE</span>
              <p className="text-[12px] font-black text-center text-gray-900 border-b border-dashed border-amber-900/15 py-1">
                "03 - 15"
              </p>
              <div className="text-[7.5px] text-gray-600 leading-tight">
                * 자물쇠의 방향을 원형으로 대칭 거꾸로 대입할 것.
              </div>
            </div>
          </div>

          <span className="font-mono text-[8px] text-[#fbbf24] uppercase tracking-wider">🛠️ HEAVY DUTY AMMO BOX</span>
        </div>
      );

    case 'clean_cart':
      return (
        <div className="w-56 h-72 bg-[#2c2d30] rounded flex flex-col items-center justify-between p-4 border border-zinc-700 shadow-2xl relative overflow-hidden">
          {/* 카트 선반 */}
          <div className="w-full h-1/2 border-2 border-dashed border-zinc-600 rounded bg-[#1e1f21] p-3 flex flex-col justify-between relative">
            <div className="flex gap-2">
              <div className="w-6 h-12 bg-blue-500/20 border border-blue-400/40 rounded flex flex-col items-center justify-center text-[10px]">🧪</div>
              <div className="w-8 h-10 bg-gray-500/20 border border-gray-400/30 rounded flex flex-col items-center justify-center text-[10px]">🧻</div>
            </div>
            
            {/* 고성능 밀리터리 손전등 실시간 영사 빔 */}
            <div className="w-36 h-8 bg-black border border-[#d4b86a] rounded-full flex items-center justify-between px-3 transform rotate-[-12deg] shadow-lg relative cursor-default">
              <div className="h-4 w-4 rounded-full bg-gradient-to-br from-[#d4b86a] to-yellow-300 border border-black animate-pulse flex items-center justify-center">
                <span className="text-[5.5px] text-black font-black">ON</span>
              </div>
              <div className="h-1 w-20 bg-zinc-600 rounded"></div>
              {/* 광선 퍼짐 효과 */}
              <div className="absolute right-[-70px] top-[-30px] w-[100px] h-[70px] bg-[radial-gradient(ellipse_at_left,rgba(253,224,71,0.25)_0%,transparent_70%)] rounded-full blur-[2px] pointer-events-none"></div>
            </div>
          </div>

          <div className="text-center space-y-1 z-10 animate-fade-in">
            <p className="text-[11px] font-serif font-black text-rose-300">비상 훈련용 플래시라이트</p>
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">MILITARY TAC-LIGHT</span>
          </div>
        </div>
      );

    case 'clean_schedule':
      return (
        <div className="w-56 h-72 bg-[#513c2c] rounded-lg p-3 pt-6 border border-amber-950 shadow-2xl relative flex flex-col justify-between items-center text-gray-800">
          {/* 상단 스틸 클립 */}
          <div className="absolute top-1.5 h-4 w-20 bg-[#a1a1aa] rounded-sm border-b border-black/30 flex justify-center items-center">
            <div className="h-1.5 w-6 bg-zinc-650 rounded-full"></div>
          </div>

          {/* 속지 종이 */}
          <div className="flex-1 w-full bg-[#fcf8f0] border border-[#d4b86a]/15 rounded p-3 font-mono text-[8px] leading-relaxed flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-serif font-black text-center block text-gray-900 border-b border-gray-300 pb-1.5 mb-2">📅 5월 기숙 본관 시설 순찰 점호표</span>
              
              <div className="space-y-1">
                <div className="flex justify-between border-b border-gray-100 pb-0.5 text-gray-400">
                  <span>요일</span><span>대상구획</span><span>순찰단위</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-0.5">
                  <span>월요일</span><span>본관 로비</span><span>15분 간격</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-0.5">
                  <span>화요일</span><span>세탁 도크</span><span>10분 간격</span>
                </div>
                <div className="flex justify-between border-2 border-red-500/40 bg-red-105 p-0.5 rounded text-red-700 font-bold">
                  <span>Wed</span><span>본관 기숙</span><span>[ 08分 ] ※</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-0.5 text-gray-400">
                  <span>목요일</span><span>야간 보건실</span><span>12분 간격</span>
                </div>
              </div>
            </div>

            <p className="text-[7.5px] font-serif text-gray-500 italic mt-2 border-t border-dashed border-gray-200 pt-1 leading-normal">
              ※ 가스실 안전 배출 검사 필함이 정합되어야 함 - 보안 요원 오수환 서명
            </p>
          </div>
        </div>
      );

    case 'med_temp':
      return (
        <div className="w-56 h-72 bg-[#020204] rounded flex flex-col items-center justify-between p-4.5 border border-cyan-800 shadow-[0_0_30px_rgba(34,211,238,0.25)] relative">
          <div className="h-2 w-2 rounded-full bg-cyan-500 absolute top-3 left-4 animate-ping"></div>
          
          {/* 생명 배양액 실린더 */}
          <div className="w-16 h-40 bg-gradient-to-b from-cyan-950/20 via-cyan-900/40 to-cyan-950/20 rounded-full border-2 border-cyan-500/30 flex items-center justify-center relative overflow-hidden my-2">
            {/* 기포 버블 애니메이션 */}
            <div className="absolute h-4 w-4 bg-cyan-400/50 rounded-full top-12 left-3 animate-bounce"></div>
            <div className="absolute h-2 w-2 bg-cyan-400/30 rounded-full top-24 right-5 animate-bounce delay-150"></div>
            <div className="absolute h-3 w-3 bg-cyan-400/40 rounded-full top-32 left-8 animate-bounce delay-300"></div>

            <div className="h-32 w-1.5 bg-cyan-300/60 rounded"></div>
          </div>

          {/* LED 임상 패널 */}
          <div className="w-full bg-[#111827] border border-cyan-500/45 p-2.5 rounded text-center">
            <span className="text-[7px] text-zinc-500 font-mono tracking-widest block uppercase">CRYO_SENSITIVE SECTOR</span>
            <span className="font-mono text-base font-black text-cyan-400 select-all shadow-[0_0_8px_rgba(34,211,238,0.3)] block">
              4.0 °C
            </span>
            <span className="text-[6.5px] text-emerald-400 font-bold block mt-0.5 animate-pulse">● CRYOGENIC SYSTEM NORMAL</span>
          </div>
        </div>
      );

    case 'med_reagent':
      return (
        <div className="w-56 h-72 bg-[#1b120c] rounded flex flex-col items-center justify-between p-4.5 border border-amber-700/40 shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative">
          <div className="w-10 h-6 bg-amber-950 rounded-t border-b border-black flex justify-center items-center relative">
            <div className="h-2 w-6 bg-zinc-800 rounded-sm"></div>
          </div>

          {/* 시약 용액 */}
          <div className="flex-1 w-24 bg-gradient-to-b from-amber-900/30 via-amber-800/50 to-amber-950/70 rounded-b-xl border border-amber-600/30 my-2 shadow-inner relative flex items-center justify-center">
            {/* 용제 라벨 스티커 */}
            <div className="w-18 bg-white text-zinc-900 p-2.5 rounded border border-amber-950 shadow-md transform rotate-[2deg] flex flex-col items-center justify-between font-mono text-[7px]">
              <span className="text-[12px] block">☠️</span>
              <p className="font-bold text-[9px] text-[#22c55e] border-y border-gray-200 py-1.5 tracking-wider font-sans my-1 font-black">
                "B-3-47"
              </p>
              <span className="text-[6px] text-gray-500 tracking-tight leading-none text-center">GENETIC MUTATOR</span>
            </div>
          </div>

          <span className="text-[8px] font-mono text-amber-500/80 uppercase">🧪 BIOSAFETY REAGENT BOTTLE</span>
        </div>
      );

    case 'med_report':
      return (
        <div className="w-56 h-72 bg-[#efdbba] text-zinc-800 rounded-tr-3xl rounded-l p-4.5 border border-zinc-400 shadow-2xl flex flex-col justify-between font-serif relative">
          <div className="absolute top-0 right-4 bg-red-700 text-white text-[7px] font-mono p-1 font-bold rounded-b select-none">
            TOP SECRET
          </div>
          
          <div className="space-y-4">
            <div className="border-b border-zinc-400 pb-1.5">
              <span className="font-mono text-[7px] text-gray-500 block">PATIENT FILE No_017</span>
              <h5 className="text-[11.5px] font-bold text-zinc-950 block font-black">실종 생도 임상 처방 대외비</h5>
            </div>

            <div className="flex gap-2 items-center">
              <div className="w-14 h-16 bg-zinc-300 rounded border border-zinc-400 flex items-center justify-center text-xl text-zinc-650 font-serif font-black">
                김
              </div>
              <div className="space-y-1 font-sans text-[8.5px] leading-tight">
                <p>· <strong>성명:</strong> 김규리 (Gyu-ri Kim)</p>
                <p>· <strong>나이:</strong> 19세 (우성 인자)</p>
                <p>· <strong>병실:</strong> 지하 3층 인공실</p>
              </div>
            </div>

            <p className="text-[9px] text-zinc-600 leading-normal border-t border-dashed border-zinc-300 pt-2 selection:bg-yellow-105">
              특이 사항: 생체 결합도 94.7% 달성. 피험 대상자는 수요일 가스 세척 주기를 활용해 탈도 위도한 것으로 보이나, 원장실 오프라인 승인 인장 칩셋에 의해 폐쇄 가스실 내 격리 영구 보존 조치 완료함.
            </p>
          </div>

          <span className="text-[7.5px] font-mono text-zinc-500 tracking-wider">🔒 CONFIDENTIAL MEDICAL TRANSCRIPT</span>
        </div>
      );

    case 'anatomical_doll':
      return (
        <div className="w-56 h-72 bg-[#efe9dd] rounded flex flex-col items-center justify-between p-4 border border-zinc-400 shadow-2xl relative">
          <div className="text-[8px] font-sans text-zinc-500 border border-zinc-300 px-1.5 py-0.5 rounded select-none uppercase">BIOLOGICAL ANATOMY TEACHING MODEL</div>
          
          {/* 가상 지퍼 인형 형상 */}
          <div className="flex-1 w-24 bg-gradient-to-b from-[#dfd7c3] to-[#cfc4ac] rounded-full border-r border-[#beaf9a] my-2 relative flex flex-col items-center justify-start pt-5">
            {/* 세로 금속 지퍼 */}
            <div className="w-1 bg-[#4b5563] h-[75%] absolute left-1/2 -translate-x-1/2 flex flex-col justify-between pt-5">
              {[1, 2, 3, 4, 5].map((z) => (
                <div key={z} className="h-[2px] w-4 bg-zinc-700 -translate-x-1.5 shadow-sm"></div>
              ))}
            </div>

            {/* 유기 내부와 숨겨온 고서 힌트 */}
            <div className="w-16 h-28 bg-[#8f1d1d]/90 rounded-full border border-black/50 overflow-hidden flex flex-col p-2 relative shadow-[inset_0_3px_10px_rgba(0,0,0,0.8)]">
              {/* 심장 */}
              <div className="h-6 w-5 rounded-full bg-red-650 animate-pulse self-center"></div>
              {/* 김규리의 두루마리 탈출 징표 편지 */}
              <div className="w-12 h-14 bg-[#fefce8] border border-[#d4b86a] rounded-sm transform rotate-6 p-1 text-[6px] font-serif text-gray-800 leading-tight shadow-md self-center mt-3 scale-105">
                <span className="text-[5.5px] font-black block text-red-600 tracking-tighter">🔒 규리의 비밀 기서</span>
                "서연아, 수인이의 <span className="text-red-700">비녀(Hairpin)</span> 배지가 에덴 지층 승인 마스터칩이야!"
              </div>
            </div>
          </div>

          <span className="text-[8.5px] font-serif text-amber-950 font-bold block tracking-wider font-black">🪆 내부 실습용 인체 인형</span>
        </div>
      );

    case 'office_safe':
      return (
        <div className="w-56 h-72 bg-[#2d2d30] rounded-xl flex flex-col items-center justify-between p-4.5 border-4 border-[#d4b86a]/40 shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative font-sans">
          <div className="w-full text-center border-b border-black/40 pb-2">
            <h5 className="font-serif text-[11px] font-black text-[#d4b86a]">원장 이중 다이얼 안전 금고</h5>
          </div>

          {/* 거대 스틸 핸들 */}
          <div className="h-28 w-28 rounded-full bg-gradient-to-br from-[#101114] to-[#27272a] border-4 border-zinc-700 shadow-2xl flex items-center justify-center relative my-4">
            <div className="absolute h-2 w-20 bg-zinc-500 rounded"></div>
            <div className="absolute h-20 w-2 bg-zinc-500 rounded"></div>
            
            {/* 정교한 금색 연선 세부 서판 */}
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#d4b86a] via-[#a38031] to-[#604a1b] border-2 border-black flex items-center justify-center shadow-lg relative z-15">
              <span className="text-[5.5px] text-black font-black">SECURITY</span>
            </div>
          </div>

          <div className="text-center w-full">
            <p className="text-[7.5px] font-mono text-zinc-500 border border-zinc-600 px-2 py-0.5 rounded select-all block italic">
              "연성 취임 최후의 영광 (2019)"
            </p>
          </div>
        </div>
      );

    case 'office_frame':
      return (
        <div className="w-64 h-[240px] flex flex-col items-center justify-between p-3 relative">
          {/* 3D 모션 회전 플립 액자 */}
          <div 
            className="w-56 h-48 rounded border-[6px] border-amber-900 bg-[#faf0c8] shadow-[0_10px_20px_rgba(0,0,0,0.8)] flex items-center justify-center p-3 relative transition-all duration-700 cursor-pointer select-none"
            style={{ 
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transformStyle: 'preserve-3d'
            }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* FRONT FACE (캘리그라피 서예 붓글씨) */}
            <div 
              className="absolute inset-0 flex flex-col items-center justify-between p-3.5 backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-full flex justify-between text-[7px] text-gray-400 font-mono select-none">
                <span>ORIENTAL ART</span><span>No_03</span>
              </div>
              <div className="text-center font-serif py-4">
                <span className="text-4xl block text-zinc-900 font-black tracking-widest leading-none">
                  真 善 美
                </span>
                <span className="text-[8.5px] text-gray-500 block mt-3">
                  에덴 기숙학원 원훈 (참되고 착하며 아름답게)
                </span>
              </div>
              <span className="text-[8px] text-yellow-800 font-serif block italic font-bold">
                👉 터치하여 액자 뒷판 들춰보기 (Flip)
              </span>
            </div>

            {/* BACK FACE (비밀 번호 낙서 은닉판) */}
            <div 
              className="absolute inset-0 flex flex-col items-center justify-between p-4 bg-[#412e1f] text-gray-300 rounded backface-hidden"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className="w-full border-b border-white/5 pb-1 flex justify-between text-[7.5px] font-mono text-gray-400">
                <span>REAR WOOD PANEL</span><span>EMERGENCY_CODE</span>
              </div>
              
              {/* 비밀 조각 번호 */}
              <div className="text-center font-serif text-3xl font-black text-rose-400 tracking-widest border-2 border-dashed border-red-500/25 p-2 bg-black/50 rounded shadow-inner my-2">
                " 2749 "
              </div>

              <span className="text-[8px] text-emerald-400 font-sans tracking-tight text-center leading-normal">
                ✔ 비상 해격 가스 경보 해치 분배 매뉴얼
              </span>
            </div>
          </div>

          <button 
            onClick={() => setIsFlipped(!isFlipped)}
            className="mt-3.5 px-4.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#d4b86a] text-[10px] text-gray-300 font-semibold cursor-pointer transition-all focus:outline-none"
          >
            {isFlipped ? '🔄 액자 정면으로 돌리기' : '🔄 액자 뒷면 뒤집어보기'}
          </button>
        </div>
      );

    case 'office_chip':
      return (
        <div className="w-56 h-72 bg-[#1c0d02] rounded-2xl flex flex-col items-center justify-between p-4.5 border-2 border-orange-500/40 shadow-[0_0_25px_rgba(239,68,68,0.2)] relative">
          <div className="h-1.5 w-8 bg-zinc-800 absolute top-3.5 rounded-full"></div>
          
          {/* 생체 마이크로 칩 본체 */}
          <div className="w-32 h-36 bg-[#0f172a] rounded border-4 border-zinc-700 p-2.5 relative flex items-center justify-center my-3 shadow-inner">
            <div className="absolute inset-1.5 border border-orange-500/10 rounded"></div>
            
            <div className="flex flex-col items-center text-center space-y-2 relative z-10 font-mono text-[8.5px]">
              <span className="text-2xl">💾</span>
              <p className="font-extrabold text-[#f97316] text-[11.5px] tracking-wider block bg-black/60 p-1 px-2.5 rounded border border-orange-500/20 shadow-md">
                "7823"
              </p>
              <p className="text-[6.5px] text-zinc-500 leading-none">ARAN SECURE CORE PRO</p>
            </div>

            {/* 기하학적 골드 실장 서킷 */}
            <div className="absolute inset-x-2 bottom-3 flex justify-between px-1">
              {[1, 2, 3, 4, 5].map((p) => (
                <div key={p} className="h-6 w-1.5 bg-gradient-to-t from-yellow-500 to-amber-700 rounded-sm"></div>
              ))}
            </div>
          </div>

          <span className="text-[7.5px] font-mono text-orange-400">⚡ BIOPRINT MICROCONDUCTOR</span>
        </div>
      );

    case 'office_clock':
      return (
        <div className="w-56 h-72 bg-[#2b241c] rounded flex flex-col items-center justify-between p-4 border border-[#d4b86a]/30 shadow-[0_15px_25px_rgba(0,0,0,0.8)] relative">
          <div className="w-2.5 h-16 bg-[#17130d] h-4 absolute top-0 rounded-b"></div>

          {/* 태엽 시계 문자판 */}
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-[#fcf6e8] to-[#dfd5be] border-[5px] border-[#a38031] flex items-center justify-center relative shadow-[0_6px_15px_rgba(0,0,0,0.6)] my-4">
            <div className="absolute h-2 w-2 bg-[#5c451a] rounded-full z-15"></div>
            
            {/* 기어 태엽 노출 */}
            <div className="absolute h-10 w-10 rounded-full border border-[#a38031]/30 opacity-20 flex items-center justify-center animate-spin duration-[15000ms]">
              <div className="h-10 w-1.5 bg-[#a38031] rounded"></div>
            </div>

            {/* 시계 바늘 (3시 15분 고정) */}
            {/* 시침 (3시 방향) */}
            <div className="absolute w-8 h-[3px] bg-zinc-900 rounded origin-left translate-x-4 shadow-[0_2px_4px_rgba(0,0,0,0.4)]"></div>
            {/* 분침 (15분 방향 = 동시 3시) */}
            <div className="absolute w-12 h-0.5 bg-zinc-900 rounded origin-left translate-x-6 rotate-[-5deg] shadow-[0_2px_4px_rgba(0,0,0,0.4)]"></div>

            {/* 로마숫자 표시 */}
            <span className="absolute top-1 text-[7.5px] font-bold text-gray-800">XII</span>
            <span className="absolute right-2 text-[7.5px] font-bold text-gray-800">III</span>
            <span className="absolute bottom-1 text-[7.5px] font-bold text-gray-800">VI</span>
            <span className="absolute left-2 text-[7.5px] font-bold text-gray-800">IX</span>
          </div>

          <span className="text-[8.5px] text-amber-900 font-serif font-black underline tracking-wide">⏰ 영구히 부식 정지된 기수 시계</span>
        </div>
      );

    case 'office_plant':
      return (
        <div className="w-56 h-72 bg-[#1b2a22] rounded flex flex-col items-center justify-between p-4 border border-emerald-850 shadow-2xl relative">
          <div className="text-[7px] text-zinc-400 font-mono select-none uppercase tracking-widest border border-zinc-700 px-1 rounded animate-fade-in">DECORATIVE WITHERED BONSAI POT</div>
          
          {/* 하층 흙 화분 */}
          <div className="flex-1 w-28 bg-[#c2b2a6]/25 rounded-t-sm rounded-b-lg border-x-4 border-b-4 border-[#855845] my-2 relative flex flex-col items-center justify-end p-2.5 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.4)]">
            {/* 말라버린 나무기지 */}
            <div className="w-1.5 h-16 bg-zinc-750 rounded absolute bottom-12 rotate-[12deg] flex justify-between">
              <div className="w-4 h-[1px] bg-zinc-700 rotate-[45deg] translate-y-3"></div>
              <div className="w-5 h-[1px] bg-zinc-700 rotate-[-30deg] translate-y-5"></div>
            </div>

            {/* 반쯤 파헤쳐 돌출된 회색 밸브 마스터 수전 */}
            <div className="w-18 h-10 bg-[#475569] border border-black rounded shadow-md transform rotate-[-4deg] flex flex-col p-1.5 font-mono text-[6.5px] text-emerald-400 tracking-tight leading-none z-10">
              <span className="text-zinc-450 font-bold block mb-1">VALVE_CONTROL</span>
              <div className="flex justify-between items-center mt-1">
                <span className="animate-pulse">● SYNCED</span>
                <span className="font-bold border border-emerald-500/20 px-0.5 rounded">4°C POD</span>
              </div>
            </div>
          </div>

          <span className="text-[8.5px] font-serif text-emerald-300 font-black tracking-wider font-extrabold">🌿 말라비틀어진 비단 분재 화분</span>
        </div>
      );

    default:
      return (
        <div className="w-56 h-72 bg-[#0d0f14] rounded-lg p-5 border border-yellow-500/20 shadow-2xl flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
          {/* 가상 핀 수집품 홀로그램 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,184,106,0.04)_0%,transparent_70%)] pointer-events-none"></div>
          
          <div className="h-28 w-28 rounded-full border-2 border-dashed border-[#d4b86a]/40 bg-black/60 flex items-center justify-center relative shadow-[0_0_20px_rgba(212,184,106,0.15)] group">
            <span className="text-5xl group-hover:scale-110 duration-500 transform">🔎</span>
            <div className="absolute inset-2 border border-white/5 rounded-full animate-ping"></div>
          </div>

          <div className="space-y-1">
            <h6 className="font-serif text-[11.5px] font-black text-amber-300">정밀 조사 획득 대외비</h6>
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">CLASSIFIED ARTIFACT</span>
          </div>
        </div>
      );
  }
}
