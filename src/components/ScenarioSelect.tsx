import { useState, useEffect } from 'react';
import { Scenario } from '../types';

interface ScenarioSelectProps {
  onBackClick: () => void;
  onSelectScenario: (sc: Scenario) => void;
}

export default function ScenarioSelect({ onBackClick, onSelectScenario }: ScenarioSelectProps) {
  const [animateFill, setAnimateFill] = useState(false);

  useEffect(() => {
    // 마운트 후 난이도 채우기 바 애니메이션 트리거
    const timer = setTimeout(() => setAnimateFill(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section 
      id="s-scenario" 
      className="relative flex h-full w-full flex-col items-center justify-start gothic-stone text-[#E6E4F4] overflow-y-auto px-6 py-16 font-sans"
    >
      {/* 고정 소형 헤더 구획 */}
      <div className="sc-hd relative w-full max-w-5xl mb-12 text-center select-none">
        <button 
          onClick={onBackClick}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-transparent border border-[#d4b86a]/30 rounded px-3 py-1 font-serif text-xs text-[#d4b86a] hover:bg-[#d4b86a]/10 hover:text-white cursor-pointer transition-all focus:outline-none"
        >
          ← 뒤로가기
        </button>
        <p className="sc-tag font-mono text-[10px] tracking-[0.25em] text-[#d4b86a] uppercase mb-1 font-bold">
          SELECT SCENARIO PROTOCOL
        </p>
        <h2 className="sc-title font-serif font-black text-2xl md:text-3xl text-white tracking-tight">
          추적할 에덴의 기밀 구획 장막을 여십시오
        </h2>
        <p className="sc-desc text-xs text-[#9894B8] max-w-md mx-auto mt-2 leading-relaxed">
          어떤 세뇌 장막을 선택하느냐에 따라 규리가 묻어둔 쪽지의 암호화 코드, 인벤토리의 쓰임새, 그리고 소멸 가스 가동 장치의 정밀 작동 성격이 변이됩니다.
        </p>
      </div>

      {/* 시나리오 카드 리스트 그리드 */}
      <div className="sc-grid grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl z-10">
        
        {/* 시나리오 A */}
        <div 
          onClick={() => onSelectScenario('A')}
          className="sc-card ca group relative bg-[#0d0d12]/60 border border-[#d4b86a]/20 hover:border-[#d4b86a]/60 rounded overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(212,184,106,0.12)] flex flex-col h-full"
        >
          <div className="sc-glow absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,184,106,0.12),transparent_70%)] pointer-events-none"></div>
          <div className="sc-bar h-[3px] w-full bg-gradient-to-r from-[#d4b86a] to-[#f3d995]"></div>
          
          <div className="sc-body p-6 flex flex-col flex-1">
            <div className="sc-code font-mono text-[10px] tracking-widest text-[#d4b86a] flex items-center gap-2 mb-4">
              <span className="sc-cdot h-2 w-2 rounded-full bg-[#d4b86a]"></span>
              SCENARIO · A
            </div>
            
            <h3 className="sc-name font-serif text-xl font-bold text-white mb-1">에덴의 가면</h3>
            <p className="sc-genre text-xs text-[#50506A] font-medium tracking-[0.05em] mb-4">
              심리 서스펜스 × 바이오 실험실
            </p>
            
            <div className="sc-div h-[1px] bg-[#d4b86a]/10 mb-4"></div>
            
            {/* 난이도 표사 */}
            <div className="sc-diff mb-4">
              <div className="sc-diff-lbl font-mono text-[9px] text-[#50506A] tracking-wider mb-1.5 flex justify-between">
                <span>DIFFICULTY</span>
                <span className="text-[#d4b86a]">★★★★☆ 72%</span>
              </div>
              <div className="sc-diff-bar h-[3px] bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="sc-diff-fill h-full bg-gradient-to-r from-[#d4b86a] to-[#f3d995] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: animateFill ? '72%' : '0%' }}
                ></div>
              </div>
            </div>

            <p className="sc-syn text-xs text-[#9894B8] leading-relaxed mb-6 flex-1">
              에덴 기숙학원에 특별 장학생 자격으로 위장 전입한 서연. 상냥하고 친절한 부대표 황수인의 빈틈없는 지도와 조력을 통해 규리의 행방을 추적하지만, 점차 완벽히 통제된 무균 시스템의 독성 가면이 드러납니다.
            </p>

            {/* 인물 태그 */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              <span className="font-mono text-[9px] text-[#50506A] border border-[#d4b86a]/15 px-2 py-0.5 rounded bg-[#07070f]">권서연 (잠입조사)</span>
              <span className="font-mono text-[9px] text-[#50506A] border border-[#d4b86a]/15 px-2 py-0.5 rounded bg-[#07070f]">황수인 (임상회유)</span>
              <span className="font-mono text-[9px] text-[#50506A] border border-[#d4b86a]/15 px-2 py-0.5 rounded bg-[#07070f]">김아란 (경비통제)</span>
            </div>

            <div className="sc-foot flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
              <span className="sc-qc font-mono text-[10px] text-[#50506A]">QUESTS <strong className="text-white">11</strong></span>
              <span className="sc-enter font-mono text-xs text-[#d4b86a] flex items-center gap-1 group-hover:gap-2.5 transition-all">
                잠입 시험 시작 →
              </span>
            </div>
          </div>
        </div>

        {/* 시나리오 B */}
        <div 
          onClick={() => onSelectScenario('B')}
          className="sc-card cb group relative bg-[#0d0d12]/60 border border-[#d4b86a]/20 hover:border-[#d4b86a]/60 rounded overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(212,184,106,0.12)] flex flex-col h-full"
        >
          <div className="sc-glow absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,184,106,0.12),transparent_70%)] pointer-events-none"></div>
          <div className="sc-bar h-[3px] w-full bg-gradient-to-r from-[#d4b86a] to-[#f3d995]"></div>
          
          <div className="sc-body p-6 flex flex-col flex-1">
            <div className="sc-code font-mono text-[10px] tracking-widest text-[#d4b86a] flex items-center gap-2 mb-4">
              <span className="sc-cdot h-2 w-2 rounded-full bg-[#d4b86a]"></span>
              SCENARIO · B
            </div>
            
            <h3 className="sc-name font-serif text-xl font-bold text-white mb-1">무균실의 기억</h3>
            <p className="sc-genre text-xs text-[#50506A] font-medium tracking-[0.05em] mb-4">
              도피 미스터리 × 아날로그 암호해독
            </p>
            
            <div className="sc-div h-[1px] bg-[#d4b86a]/10 mb-4"></div>
            
            {/* 난이도 표사 */}
            <div className="sc-diff mb-4">
              <div className="sc-diff-lbl font-mono text-[9px] text-[#50506A] tracking-wider mb-1.5 flex justify-between">
                <span>DIFFICULTY</span>
                <span className="text-[#d4b86a]">★★★☆☆ 58%</span>
              </div>
              <div className="sc-diff-bar h-[3px] bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="sc-diff-fill h-full bg-gradient-to-r from-[#d4b86a] to-[#f3d995] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: animateFill ? '58%' : '0%' }}
                ></div>
              </div>
            </div>

            <p className="sc-syn text-xs text-[#9894B8] leading-relaxed mb-6 flex-1">
              실종된 김규리는 성실한 수재이자 반순종적 탈출 코드 설계자였습니다. 공식 정보 아카이브와 가청 사막 주파수 아래에 규리가 파편화해 은닉해 둔 오디오 모스 비밀 정보 조각들을 조합해 세뇌 기억 장치를 무력화하십시오.
            </p>

            {/* 인물 태그 */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              <span className="font-mono text-[9px] text-[#50506A] border border-[#d4b86a]/15 px-2 py-0.5 rounded bg-[#07070f]">김규리 (탈출설계)</span>
              <span className="font-mono text-[9px] text-[#50506A] border border-[#d4b86a]/15 px-2 py-0.5 rounded bg-[#07070f]">김아란 (세뇌관찰)</span>
              <span className="font-mono text-[9px] text-[#50506A] border border-[#d4b86a]/15 px-2 py-0.5 rounded bg-[#07070f]">권서연 (암호해독)</span>
            </div>

            <div className="sc-foot flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
              <span className="sc-qc font-mono text-[10px] text-[#50506A]">QUESTS <strong className="text-white">7</strong></span>
              <span className="sc-enter font-mono text-xs text-[#d4b86a] flex items-center gap-1 group-hover:gap-2.5 transition-all">
                잠입 시험 시작 →
              </span>
            </div>
          </div>
        </div>

        {/* 시나리오 C */}
        <div 
          onClick={() => onSelectScenario('C')}
          className="sc-card cc group relative bg-[#0d0d12]/60 border border-[#d4b86a]/20 hover:border-[#d4b86a]/60 rounded overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(212,184,106,0.12)] flex flex-col h-full"
        >
          <div className="sc-glow absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,184,106,0.12),transparent_70%)] pointer-events-none"></div>
          <div className="sc-bar h-[3px] w-full bg-gradient-to-r from-[#d4b86a] to-[#f3d995]"></div>
          
          <div className="sc-body p-6 flex flex-col flex-1">
            <div className="sc-code font-mono text-[10px] tracking-widest text-[#d4b86a] flex items-center gap-2 mb-4">
              <span className="sc-cdot h-2 w-2 rounded-full bg-[#d4b86a]"></span>
              SCENARIO · C
            </div>
            
            <h3 className="sc-name font-serif text-xl font-bold text-white mb-1">선택받은 자들</h3>
            <p className="sc-genre text-xs text-[#50506A] font-medium tracking-[0.05em] mb-4">
              도덕 공포 × 계급 구제 잔혹극
            </p>
            
            <div className="sc-div h-[1px] bg-[#d4b86a]/10 mb-4"></div>
            
            {/* 난이도 표사 */}
            <div className="sc-diff mb-4">
              <div className="sc-diff-lbl font-mono text-[9px] text-[#50506A] tracking-wider mb-1.5 flex justify-between">
                <span>DIFFICULTY</span>
                <span className="text-[#d4b86a]">★★★★★ 88%</span>
              </div>
              <div className="sc-diff-bar h-[3px] bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="sc-diff-fill h-full bg-gradient-to-r from-[#d4b86a] to-[#f3d995] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: animateFill ? '88%' : '0%' }}
                ></div>
              </div>
            </div>

            <p className="sc-syn text-xs text-[#9894B8] leading-relaxed mb-6 flex-1">
              "사회의 낙오보다 에덴의 가양 통제가 백배 안전하다." 수인은 진화적 사회 계단 도태자 선별이야말로 진짜 구원이라 고백합니다. 황수인이 제시한 대가성 엘리트 구제 특별 제안과 아란의 반역, 당신의 윤리는 어디로 수렴합니까?
            </p>

            {/* 인물 태그 */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              <span className="font-mono text-[9px] text-[#50506A] border border-[#d4b86a]/15 px-2 py-0.5 rounded bg-[#07070f]">황수인 (계급교화)</span>
              <span className="font-mono text-[9px] text-[#50506A] border border-[#d4b86a]/15 px-2 py-0.5 rounded bg-[#07070f]">김아란 (기생반란)</span>
              <span className="font-mono text-[9px] text-[#50506A] border border-[#d4b86a]/15 px-2 py-0.5 rounded bg-[#07070f]">권서연 (윤리심판)</span>
            </div>

            <div className="sc-foot flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
              <span className="sc-qc font-mono text-[10px] text-[#50506A]">QUESTS <strong className="text-white">6</strong></span>
              <span className="sc-enter font-mono text-xs text-[#d4b86a] flex items-center gap-1 group-hover:gap-2.5 transition-all">
                잠입 시험 시작 →
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
