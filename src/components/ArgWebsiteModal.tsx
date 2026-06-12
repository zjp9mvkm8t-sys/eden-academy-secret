import React, { useState, useEffect } from 'react';

interface ArgWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFindSecretclue?: (clueId: string) => void;
}

export default function ArgWebsiteModal({ isOpen, onClose, onFindSecretclue }: ArgWebsiteModalProps) {
  const [currentUrl, setCurrentUrl] = useState('https://eden-academy.kr');
  const [inputUrl, setInputUrl] = useState('https://eden-academy.kr');
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'console'>('preview');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'Initializing Eden Academy Official Network...',
    'Secure Core Status: ACTIVE',
    'No unauthorized connections detected.'
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 새로운 브라우저 로딩 로그 느낌 시뮬레이션
      setConsoleLogs(prev => [
        ...prev,
        '[%cWARN%c] Unauthorized F12 console access. System metrics are tracked.',
        '[%cSECRET%c] Guri_PID_0047: STATUS=QUARANTINE / LOCATION=LAB_B3',
        '[%cSECRET%c] BADGE_KEY=MASTER / 비녀 배지가 열쇠다.',
        '[%cSECRET%c] 참고: 주소창 끝에 ?ref=find_me 를 덧붙이거나, 가상콘솔에 "find_me"를 쳐 보세요.'
      ]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = inputUrl.trim();
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      url = 'https://' + url;
    }
    setCurrentUrl(url);
    setInputUrl(url);

    if (url.includes('ref=find_me') || url.includes('find_me')) {
      setConsoleLogs(prev => [...prev, '⚡ [ACCESS CODE DETECTED] Redirecting to Classified Memo...']);
      if (onFindSecretclue) {
        onFindSecretclue('find_me');
      }
    }
  };

  const executeConsoleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    setConsoleLogs(prev => [...prev, `> ${trimmed}`]);
    setSearchQuery('');

    if (trimmed === 'clear') {
      setConsoleLogs([]);
    } else if (trimmed === 'find_me' || trimmed === 'help') {
      setConsoleLogs(prev => [
        ...prev,
        '⚡ [DECODED MEMO GRANTED]',
        '규리: "서연아, 여기까지 왔다면 네가 맞아.',
        '수인의 비녀배지가 마스터키야. 인형 배 속에도 편지 넣어뒀어.',
        '약품 코드는 B-3-47이야. 꼭 기억해."'
      ]);
      if (onFindSecretclue) onFindSecretclue('find_me');
    } else {
      setConsoleLogs(prev => [...prev, `Command not found: "${trimmed}". Type "find_me" or "clear"`]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col rounded-lg border border-[#5546CC]/40 bg-[#07070f] text-[#E6E4F4] shadow-2xl overflow-hidden">
        
        {/* 브라우저 상단 윈도우 컨트롤 */}
        <div className="flex items-center justify-between border-b border-[#5546CC]/20 bg-[#0c0c1e] px-4 py-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#B83820]"></span>
            <span className="h-3 w-3 rounded-full bg-[#C8A840]"></span>
            <span className="h-3 w-3 rounded-full bg-[#18A87A]"></span>
            <span className="ml-3 font-mono text-xs text-[#50506A]">EDEN ACADEMY PORTAL (TINAG INTERNET ENGINE)</span>
          </div>
          <button 
            onClick={onClose}
            className="rounded border border-[#5546CC]/20 px-2 py-0.5 font-mono text-xs text-[#9894B8] hover:bg-[#5546CC]/20 hover:text-white"
          >
            닫기 [ESC]
          </button>
        </div>

        {/* 브라우저 주소창 및 제어부 */}
        <div className="flex items-center gap-2 bg-[#0d0d1a] px-3 py-2 border-b border-[#5546CC]/15 flex-shrink-0">
          <button 
            onClick={() => { setInputUrl('https://eden-academy.kr'); setCurrentUrl('https://eden-academy.kr'); }}
            className="p-1 text-xs text-[#9894B8] hover:text-[#A89FF5]"
            title="홈"
          >
            🏠
          </button>
          
          <form onSubmit={handleUrlSubmit} className="flex flex-1 items-center gap-1">
            <div className="flex flex-1 items-center rounded-sm border border-[#5546CC]/30 bg-[#06060e] px-2 py-1 text-xs font-mono">
              <span className="mr-1 text-green-500">🔒 SECURE</span>
              <input 
                type="text" 
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                className="w-full bg-transparent text-[#E6E4F4] outline-none"
              />
            </div>
            <button 
              type="submit" 
              className="rounded bg-[#5546CC] px-3 py-1 text-xs font-semibold text-white hover:bg-[#7B6EE8]"
            >
              이동
            </button>
          </form>

          {/* 개발자도구/전용뷰 전환 단추 */}
          <div className="flex items-center rounded-sm bg-[#0a0a1a] p-0.5 border border-[#5546CC]/20">
            <button 
              onClick={() => setActiveTab('preview')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${activeTab === 'preview' ? 'bg-[#5546CC] text-white' : 'text-[#9894B8] hover:text-white'}`}
            >
              미리보기
            </button>
            <button 
              onClick={() => setActiveTab('source')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${activeTab === 'source' ? 'bg-[#5546CC] text-white' : 'text-[#9894B8] hover:text-white'}`}
            >
              소스보기 (F12)
            </button>
            <button 
              onClick={() => setActiveTab('console')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-all relative ${activeTab === 'console' ? 'bg-[#5546CC] text-white' : 'text-[#9894B8] hover:text-white'}`}
            >
              콘솔 (Log)
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            </button>
          </div>
        </div>

        {/* 메인 브라우저 이너 바디 */}
        <div className="flex-1 overflow-y-auto bg-[#07070f]">
          
          {activeTab === 'preview' && (
            <div className="w-full">
              {/* URL 파라미터가 find_me 일 때의 특별 비밀 뷰 연출! */}
              {(currentUrl.includes('ref=find_me') || currentUrl.includes('find_me')) ? (
                <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
                  <p className="font-mono text-xs text-[#C8A840] tracking-[0.25em] mb-4">
                    — ACCESS HIGH LEVEL AUTHORIZED SYSTEM ONLY —
                  </p>
                  <h2 className="font-serif font-bold text-2xl text-white mb-3 tracking-tight">
                    서연아, 네가 이 쪽지를 연 게 맞아.
                  </h2>
                  <div className="max-w-lg mb-6 border border-dashed border-[#C8A840]/30 bg-[#111128]/40 p-5 rounded font-mono text-sm leading-relaxed text-[#9894B8]">
                    <p className="mb-3 text-white font-bold">시간이 없어. 내 말 꼭 기억해.</p>
                    <p className="mb-2">1. 황수인이 끼고 다니는 머리 비녀 배지가 지하로 통하는 마스터키야.</p>
                    <p className="mb-2">2. 원장실 해부실습용 인형의 배 속 지퍼 뒤에 비밀 열쇠 쪽지가 있어.</p>
                    <p className="mb-2">3. 보건실에서 발견할 약품 캐비닛 코드는 <span className="text-[#C8A840] underline font-bold">B-3-47</span> 이야.</p>
                    <p className="text-red-400 font-semibold">[ID_0047 // STATUS: QUARANTINE // LOCATION: LAB_B3]</p>
                  </div>
                  <p className="text-xs text-[#50506A] font-serif italic">— 너와 끝까지 저항할 규리가 —</p>
                  <button 
                    onClick={() => {
                      setInputUrl('https://eden-academy.kr');
                      setCurrentUrl('https://eden-academy.kr');
                    }}
                    className="mt-8 rounded border border-gray-600 px-4 py-1.5 text-xs text-gray-400 hover:border-[#5546CC] hover:text-white"
                  >
                    일반 공식 홈페이지로 이동
                  </button>
                </div>
              ) : (
                /* 일반 에덴 기숙학원 홈페이지 시뮬레이션 */
                <div>
                  {/* Hero */}
                  <div className="border-b border-[#5546CC]/15 bg-gradient-to-b from-[#0c0c1e] to-[#07070f] px-8 py-16 text-center">
                    <span className="inline-block rounded-sm border border-[#C8A840]/40 px-2 py-0.5 text-[10px] font-mono tracking-widest text-[#C8A840]">
                      2026 최우수 영재 선발 상시 진행
                    </span>
                    <h1 className="font-serif text-4xl font-extrabold text-white mt-4 tracking-tight leading-tight">
                      선택받은 극소수만을<br />위한 몰입형 고밀도 공간
                    </h1>
                    <p className="mx-auto mt-4 max-w-md text-xs text-[#9894B8] leading-relaxed">
                      에덴 기숙학원은 잠재된 최우수 가치 인재의 지능 지수를 극대화하기 위해 설계된 비밀스럽고 럭셔리한 아카데미식 기구입니다.
                    </p>
                    <div className="mt-8 flex justify-center gap-3">
                      <a href="#admission" className="rounded bg-[#5546CC] px-4 py-2 text-xs font-semibold hover:bg-[#7B6EE8]">입학 지원요강</a>
                      <a href="#curriculum" className="rounded border border-[#C8A840]/30 px-4 py-2 text-xs font-semibold text-[#D4B86A] hover:bg-[#C8A840]/10">심화과정 탐색</a>
                    </div>
                  </div>

                  {/* Core Metrics */}
                  <div className="grid grid-cols-4 border-b border-[#5546CC]/15 bg-[#0c0c1e]/40 p-4 font-mono text-center">
                    <div>
                      <div className="text-xl font-bold text-[#D4B86A]">98.2%</div>
                      <div className="text-[10px] text-[#50506A]">명문대 진학률</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-[#D4B86A]">47명</div>
                      <div className="text-[10px] text-[#50506A]">현재 활성화 연구원생</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-red-500">B3</div>
                      <div className="text-[10px] text-[#50506A]">생명 기술 지정 등급</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-[#D4B86A]">100%</div>
                      <div className="text-[10px] text-[#50506A]">전액 특별 장학</div>
                    </div>
                  </div>

                  {/* Curriculums */}
                  <div className="p-8">
                    <h2 className="font-serif text-lg font-bold text-white mb-6">에덴 특성화 맞춤 전형 코스</h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded border border-[#5546CC]/10 bg-[#111128]/25 p-4">
                        <span className="text-xl">🔬</span>
                        <h3 className="mt-2 font-serif text-xs font-bold text-white">바이오사이언스 트랙 (BIO)</h3>
                        <p className="mt-1.5 text-[11px] text-[#9894B8] leading-relaxed">첨단 면역 분자 생명 및 뇌세포 기능 랩 실습. 원장 직통 지휘 아래 최고 권위 실험 참여.</p>
                      </div>
                      <div className="rounded border border-[#5546CC]/10 bg-[#111128]/25 p-4">
                        <span className="text-xl">🧠</span>
                        <h3 className="mt-2 font-serif text-xs font-bold text-white">인지과학 및 세뇌 트랙 (COG)</h3>
                        <p className="mt-1.5 text-[11px] text-[#9894B8] leading-relaxed">뇌 인지 메커니즘 훈련 및 고립 환경 행동 데이터 검사 최적화.</p>
                      </div>
                      <div className="rounded border border-[#5546CC]/10 bg-[#111128]/25 p-4">
                        <span className="text-xl">💻</span>
                        <h3 className="mt-2 font-serif text-xs font-bold text-white">디지털 보안 및 역학 트랙</h3>
                        <p className="mt-1.5 text-[11px] text-[#9894B8] leading-relaxed">철저한 네트워크 암호화 및 유출 방비 시스템 관리자 양성.</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div id="admission" className="border-t border-[#5546CC]/15 p-8 bg-[#0a0a1a]">
                    <h2 className="font-serif text-lg font-bold text-white mb-2">입학 사전 신청 및 자가 검증</h2>
                    <p className="text-[11px] text-[#50506A] mb-4">가족 관계가 단조롭고 독립성이 검증된 인원은 상시 가산 배점이 작용합니다.</p>
                    
                    {isSubmitted ? (
                      <div className="rounded bg-[#18A87A]/15 border border-[#18A87A]/30 p-4 text-center text-sm text-[#18A87A]">
                        ✓ 가치 인재 가지원서가 원장실 중앙 서버에 안전하게 가동되었습니다. (코드: EDEN_PROT_0047)
                      </div>
                    ) : (
                      <form onSubmit={(e) => { e.preventDefault(); setIsSubmitted(true); }} className="space-y-3 max-w-md">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-[#50506A] mb-1">지원자 한글 성명</label>
                            <input 
                              type="text" 
                              required
                              value={contactName}
                              onChange={e => setContactName(e.target.value)}
                              placeholder="권서연"
                              className="w-full bg-[#07070f] border border-[#5546CC]/20 rounded p-1.5 text-xs text-[#E6E4F4] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-[#50506A] mb-1">복제 통신 이메일</label>
                            <input 
                              type="email" 
                              required
                              value={contactEmail}
                              onChange={e => setContactEmail(e.target.value)}
                              placeholder="search@eden.kr"
                              className="w-full bg-[#07070f] border border-[#5546CC]/20 rounded p-1.5 text-xs text-[#E6E4F4] outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#50506A] mb-1">임상 지원 동기 설명</label>
                          <textarea 
                            rows={2}
                            required
                            value={contactMsg}
                            onChange={e => setContactMsg(e.target.value)}
                            placeholder="규리를 찾으러 이곳에 위장 전입하였습니다."
                            className="w-full bg-[#07070f] border border-[#5546CC]/20 rounded p-1.5 text-xs text-[#E6E4F4] outline-none"
                          />
                        </div>
                        <button 
                          type="submit" 
                          className="w-full rounded bg-[#5546CC] py-1.5 text-xs font-semibold text-white hover:bg-[#7B6EE8]"
                        >
                          원장 승인 자가 검사 제출
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Private warning footer */}
                  <div className="bg-[#040409] p-4 text-center text-[10px] text-[#50506A] border-t border-[#5546CC]/5">
                    © 2026 EDEN Academy & Corp. 정보주체 동의 무제한 처리 가동실.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'source' && (
            <div className="p-4 font-mono text-xs text-[#9894B8] leading-tight select-all">
              <pre className="whitespace-pre-wrap">
{`&lt;!DOCTYPE html&gt;
&lt;!-- ========================================================
     EDEN ACADEMY OFFICIAL GATEWAY SOURCE - BUILD_V2.6.4
     TINAG NOTICE: 이것은 상용 게임 서버가 아닙니다.
     실험체 규리 격리 로그_PID_0047 // LAB_B3 // STATUS=QUARANTINE
     
     ====================== 비밀 단서 ======================
     [황수인의 배지 형태는 단순 악세서리가 아닌 생체 자기 마스터 카드키(BADGE_KEY=MASTER)]
     [보건실 보관 마취 면역 화학 약품 조합 코드: B-3-47]
     [원장실 데스크 지퍼 해부 인형의 배 속 내막 쪽지 검색 필수]
     [주소창 끝에 파라미터 "?ref=find_me"를 붙이면 암호가 열릴 거야.]
     ======================================================== --&gt;
&lt;html lang="ko"&gt;
&lt;head&gt;
  &lt;meta charset="UTF-8" /&gt;
  &lt;title&gt;에덴 기숙학원 - 소수 우대선별 공간&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;!-- ...생략... --&gt;
  &lt;script&gt;
    /* console.log("규리_PID_0047: 비녀 배지가 엘리베이터 마스터키야."); */
  &lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;`}
              </pre>
            </div>
          )}

          {activeTab === 'console' && (
            <div className="flex h-full flex-col bg-[#05050b] p-4 font-mono text-xs text-green-400">
              <div className="flex-1 overflow-y-auto space-y-1">
                {consoleLogs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap leading-relaxed">
                    {log.includes('%c') ? (
                      // 스타일링된 로그 모사
                      <span>{log.replace(/%c/g, '')}</span>
                    ) : (
                      log
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center border-t border-[#5546CC]/20 pt-2 flex-shrink-0">
                <span className="mr-2 text-green-500 font-bold">&gt;</span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      executeConsoleCommand(searchQuery);
                    }
                  }}
                  placeholder='여기에 "find_me"를 입력한 뒤 Enter를 누르거나 "clear"를 치세요.'
                  className="w-full bg-transparent text-white outline-none placeholder:text-green-900"
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
