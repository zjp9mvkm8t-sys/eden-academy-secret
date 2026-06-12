import { useState } from 'react';

interface EndingScreenProps {
  endingType: 'liberation' | 'truth' | 'escape' | 'defeat' | 'gameover' | string;
  suinTrust: number;
  aranTrust: number;
  onRestartTitle: () => void;
  onRestartScenario: () => void;
  onOpenArgWeb?: () => void;
}

export default function EndingScreen({ 
  endingType, 
  suinTrust, 
  aranTrust, 
  onRestartTitle, 
  onRestartScenario,
  onOpenArgWeb
}: EndingScreenProps) {
  const [isCopied, setIsCopied] = useState(false);

  // 엔딩별 세부 데이터 정의
  const ENDING_DATA: Record<string, { badge: string; title: string; desc: string; emoji: string; color: string; ytLink: string }> = {
    liberation: {
      badge: '🌟 완전 해방 엔딩 (TRUE ENDING)',
      title: '에덴의 장막을 영구히 파탈하다',
      desc: '당신은 마침내 규리를 품 안으로 품고, 아란과 연합해 에덴 기숙학원 생체 실험실의 충격적인 인류 선별 기준표 전문을 인터넷 커뮤니티(에브리타임, SNS) 전체에 유포하는 데 완전 성공했습니다.\n황수인의 추악한 가면은 만천하에 드러났고, 세뇌된 아이들은 현실로 돌아왔습니다. 이것이 당신이 그토록 원했던 "참된 해동"입니다.',
      emoji: '🕊️',
      color: '#18A87A',
      ytLink: 'https://youtu.be/EDEN-ENDING-LIBERATION'
    },
    truth: {
      badge: '✨ 진실 엔딩 (TRUTH ENDING)',
      title: '가면 뒤에 자리 잡은 기형의 진실',
      desc: '규리를 격리실 유기 해치에서 성공적으로 구출해 기스실 가스 트랩을 파괴하고 구출했습니다.\n학원 공식 홈페이지 소스 지 뒤에 숨겨진 실체를 확보하고 황수인의 위선적인 지배 이념을 소규모로 폭로했지만, 에덴의 배후 수뇌부 "김원장 박사" 등 그림자 카르텔은 흔적도 없이 증발했습니다.\n진실은 밝혀졌으나, 추적은 아직 끝나지 않았습니다.',
      emoji: '🔍',
      color: '#C8A840',
      ytLink: 'https://youtu.be/EDEN-ENDING-TRUTH'
    },
    escape: {
      badge: '🚪 일반 탈출 엔딩 (NORMAL ESCAPE)',
      title: '어스름한 새벽 속의 불안한 귀향',
      desc: '당신과 규리는 에덴 기숙학원의 지하 통로 미궁을 통해 물리적 탈출을 완미하게 쟁취했습니다.\n하지만 기밀 선별 기준 명부를 세상에 공론화하지 못했기에, 아카데미의 괴기 공학 실험은 또 다른 도심 골짜기에 비방식으로 이관 설치될 것입니다.\n에덴의 견고한 문은 이번에 단단히 봉인됐으나, 제2의 에덴은 여전히 다른 하늘 아래에서 사냥감을 물색하고 있습니다.',
      emoji: '🏃',
      color: '#5546CC',
      ytLink: 'https://youtu.be/EDEN-ENDING-ESCAPE'
    },
    defeat: {
      badge: '💀 도덕적 패배 엔딩 (BAD ROAD)',
      title: '위선적 우등 기하의 하수인이 되다',
      desc: '당신은 황수인이 내민 우생학적 혜택 최고위원 합격을 달콤하게 수용하고 수락했습니다.\n약자 규리를 소각 파괴의 거름으로 방치해 둔 채, 화려한 실크 양복과 이념적 특권을 제공받은 우성 인재의 상징이 되었습니다.\n양심을 기화질소 너머로 영원히 유유히 고립시킨 채, 유리구두의 감옥 밑바닥에서 피비린내 나는 에덴의 주인이 될 것입니다.',
      emoji: '🥀',
      color: '#B83820',
      ytLink: 'https://youtu.be/EDEN-ENDING-DEFEAT'
    },
    gameover: {
      badge: '☠️ 소멸 종료 (GAME OVER)',
      title: '가스실 기화 속 미궁의 이슬',
      desc: '당신은 기화 독소 가스 살포실 환풍기 장벽 해지 코드를 타임어택 제한 시간 타이머 내에 규격대로 풀지 못했습니다.\n서연과 아란의 영혼은 에덴 지하 깊고 습한 폐쇄 소각 구덩이에 버려진 이슬 조각처럼 쓸쓸히 해부 실험의 시약 원료로 소진되고 말았습니다.\n심기일전하여 다른 인수를 기합하고 재도전해 주십시오.',
      emoji: '⚡',
      color: '#B83820',
      ytLink: 'https://youtu.be/EDEN-RETRY'
    }
  };

  const finalEnding = ENDING_DATA[endingType] || ENDING_DATA.escape;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`EDEN_ACADEMY_REVOLUTION_CODE: ${endingType.toUpperCase()}-0047`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <section 
      id="s-ending" 
      className="relative flex h-full w-full flex-col items-center justify-center bg-[#07070a] text-[#E6E4F4] px-6 py-12 text-center overflow-y-auto gothic-stone"
    >
      {/* 백그라운드 수렴 글로우 */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          background: `radial-gradient(circle at center, ${finalEnding.color} 0%, transparent 70%)`
        }}
      ></div>

      <div className="relative z-10 max-w-xl flex flex-col items-center">
        
        {/* 엔딩 배지 */}
        <div 
          className="end-badge font-mono text-xs font-bold uppercase tracking-[0.22em] border px-4 py-1.5 rounded mb-6"
          style={{ borderColor: `${finalEnding.color}50`, color: finalEnding.color, backgroundColor: `${finalEnding.color}10` }}
        >
          {finalEnding.badge}
        </div>

        {/* 대형 서스펜스 에모지 트랙 */}
        <div className="text-6xl mb-6 animate-pulse select-none" style={{ textShadow: `0 0 30px ${finalEnding.color}` }}>
          {finalEnding.emoji}
        </div>

        {/* 엔딩 주 타이틀 */}
        <h1 className="end-title font-serif font-black text-2xl md:text-3xl text-white tracking-tight leading-snug mb-5 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          {finalEnding.title}
        </h1>

        {/* 상세 서술 지문 */}
        <p className="end-sub text-sm text-[#9894B8] leading-relaxed max-w-lg mb-8 whitespace-pre-line">
          {finalEnding.desc}
        </p>

        {/* 신뢰도 축적 지표 최종 요약 */}
        <div className="end-trust flex gap-6 border-y border-white/5 py-4 w-full max-w-sm justify-center mb-8 font-mono text-xs text-[#50506A]">
          <div>황수인 신뢰 점수: <strong className="text-white text-sm">{suinTrust}</strong></div>
          <div>김아란 신뢰 점수: <strong className="text-white text-sm">{aranTrust}</strong></div>
        </div>

        {/* 비기로서의 공유 파트 - AISAS 2차 래빗홀 유동 기획 연출 */}
        <div className="w-full max-w-md bg-[#0d0d12]/75 border border-[#d4b86a]/20 rounded p-5 mb-10 text-left">
          <h4 className="font-serif text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
            🎬 에덴 진실 래빗홀 비디오 데이터 공개
          </h4>
          <p className="text-[11px] text-[#9894B8] leading-relaxed mb-4">
            이 결과를 복사하여 학원 공식 위장 웹사이트의 URL 주소창 끝에 <strong className="text-[#E0C870]">?code=EDEN-0047</strong>을 투입하고 인증하면 피실험 규리가 직송으로 기획한 내부 진실 영상 비공개 링크가 해제됩니다!
          </p>
          <div className="flex gap-2 font-mono text-xs">
            <button 
              onClick={handleCopyLink}
              className="flex-1 rounded bg-[#d4b86a] hover:bg-[#f3d995] py-2 text-[#07070a] font-semibold transition-all text-center text-[11px] cursor-pointer"
            >
              {isCopied ? '✓ 인증 복사완료!' : '🔑 비밀 해독코드 복사'}
            </button>
            {onOpenArgWeb && (
              <button 
                onClick={onOpenArgWeb}
                className="rounded border border-[#d4b86a]/30 hover:border-[#d4b86a] text-[#d4b86a] px-4 py-2 text-[11px] font-semibold transition-all hover:bg-[#d4b86a]/10 cursor-pointer"
              >
                🖥️ 공식 홈 인증하러 가기
              </button>
            )}
          </div>
        </div>

        {/* 재실행 단추 제어 */}
        <div className="end-btns flex gap-3 flex-wrap">
          <button 
            onClick={onRestartScenario}
            className="end-btn primary rounded bg-[#d4b86a] hover:bg-[#f3d995] text-[#07070a] font-serif text-xs px-8 py-3 transition-all cursor-pointer font-bold"
          >
            시나리오 다시 선택하기
          </button>
          <button 
            onClick={onRestartTitle}
            className="end-btn outline rounded border border-[#d4b86a]/15 hover:border-[#d4b86a]/30 text-[#9894B8] hover:text-white font-serif text-xs px-8 py-3 transition-all cursor-pointer"
          >
            타이틀 초기 화면으로
          </button>
        </div>

      </div>
    </section>
  );
}
