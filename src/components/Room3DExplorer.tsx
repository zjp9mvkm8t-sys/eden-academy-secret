import { useState, useEffect, useRef, MouseEvent, TouchEvent } from 'react';
import { Quest } from '../types';
import { Compass, Navigation, Info } from 'lucide-react';

interface Room3DExplorerProps {
  quest: Quest;
  inventory: string[];
  searchedHotspots: Record<string, boolean>;
  onHotspotClick: (id: string, spotKey: string, dialog: string, grantsItemId?: string) => void;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Hotspot3D {
  id: string;
  name: string;
  pos: Point3D;
  dialog: string;
  grantsItemId?: string;
  glowHint?: string; // 클루 야광 표식
}

export default function Room3DExplorer({
  quest,
  inventory,
  searchedHotspots,
  onHotspotClick
}: Room3DExplorerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 3D 뷰 변수 - 멀미 방지를 위해 정면(0°)으로 조준각을 고정 락인합니다.
  const [yaw] = useState<number>(0);
  const [hasFlashlight, setHasFlashlight] = useState<boolean>(false);
  const [flashlightOn, setFlashlightOn] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 150, y: 150 });
  const [photoMode, setPhotoMode] = useState<boolean>(false); // 기본을 원래 3D 벡터 와이어프레임 기조로 복귀해 초가속 구동 최적화

  // 미스터리 공간 실사 CCTV 이미지 리포지토리 준비 및 캐싱 관리
  const corridorImgRef = useRef<HTMLImageElement | null>(null);
  const labImgRef = useRef<HTMLImageElement | null>(null);
  const officeImgRef = useRef<HTMLImageElement | null>(null);
  const generalImgRef = useRef<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);

  useEffect(() => {
    let loadedCount = 0;
    const totalImgCount = 4;
    const handleSingleImageLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalImgCount) {
        setImagesLoaded(true);
      }
    };

    const img1 = new Image();
    img1.src = "https://images.unsplash.com/photo-1562774053-f5a02f6ef87a?auto=format&fit=crop&w=1200&q=80"; // 밝고 깨끗한 아카데미 기숙사 메인 복도 전경
    img1.referrerPolicy = "no-referrer";
    img1.onload = handleSingleImageLoaded;
    img1.onerror = handleSingleImageLoaded;
    corridorImgRef.current = img1;

    const img2 = new Image();
    img2.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80"; // 첨단 장비가 놓인 화사하고 청결한 무균 보건실/실험 부스
    img2.referrerPolicy = "no-referrer";
    img2.onload = handleSingleImageLoaded;
    img2.onerror = handleSingleImageLoaded;
    labImgRef.current = img2;

    const img3 = new Image();
    img3.src = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"; // 품격 있고 쾌적한 최고 관리자 집무/접견실
    img3.referrerPolicy = "no-referrer";
    img3.onload = handleSingleImageLoaded;
    img3.onerror = handleSingleImageLoaded;
    officeImgRef.current = img3;

    const img4 = new Image();
    img4.src = "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"; // 세련된 아카데미 메인 로비
    img4.referrerPolicy = "no-referrer";
    img4.onload = handleSingleImageLoaded;
    img4.onerror = handleSingleImageLoaded;
    generalImgRef.current = img4;
  }, []);

  // 현재 활성화된 핫스팟 목록
  const [hotspots, setHotspots] = useState<Hotspot3D[]>([]);

  // 캔버스 크기 제어
  const [dimensions, setDimensions] = useState({ width: 480, height: 260 });

  // 소지품 내에 손전등이 장착되었는지 인지
  useEffect(() => {
    const owned = inventory.includes('flashlight');
    setHasFlashlight(owned);
    if (!owned) {
      setFlashlightOn(false);
    }
  }, [inventory]);

  // 각 퀘스트/장소별 3D 원근 핫스팟의 공간 좌표 셋업
  useEffect(() => {
    if (!quest) return;

    let spotList: Hotspot3D[] = [];

    let isCorridor = quest.location?.includes('복도') || quest.location?.includes('기숙사') || quest.location?.includes('로비') || quest.location?.includes('사물함') || quest.location?.includes('전실');
    const isLab = quest.location?.includes('보건실') || quest.location?.includes('약품실') || quest.location?.includes('무균실') || quest.location?.includes('실험실') || quest.location?.includes('수용실') || quest.qid === 'A-10-gas' || quest.qid === 'A-11';
    const isOffice = quest.location?.includes('원장실') || quest.location?.includes('집무실') || quest.location?.includes('사무실') || quest.location?.includes('통제실') || quest.qid === 'A-04';

    if (!isCorridor && !isLab && !isOffice) {
      isCorridor = true; // Fallback
    }

    if (isCorridor) {
      spotList = [
        {
          id: 'locker_gyuri',
          name: '🔒 김규리의 개인 보관함',
          pos: { x: -110, y: -10, z: 120 },
          dialog: '사물함 전면 도어에 다이얼 자키 도크 [0315] 가 장학되어 있습니다. 규리의 강박적 역순 습관을 뒤집어 적용해보세요.',
          glowHint: '⚠️ 0315 -> [ REVERSE DIAL LOCK: 5130 ]'
        },
        {
          id: 'notice_rule',
          name: '📋 주간 점호 비상수칙',
          pos: { x: 110, y: 15, z: 130 },
          dialog: '비상 점호 대전: "모든 보건관 및 통제실은 수요일 가스 사이클 교체 주기를 절대 주시하라" 표시가 인쇄되어 있습니다.',
          glowHint: '💬 WEDNESDAY VENTILATOR CYCLE: 8 MINUTES'
        },
        {
          id: 'corridor_box',
          name: '📦 복도 비상 수납함',
          pos: { x: 0, y: -55, z: 175 },
          dialog: '수납함 먼지더미 틈바구니에서 비밀 핀코드 조각 "03-15" 필체가 적힌 누런 수첩 서열을 확인했습니다!',
          glowHint: '🔑 KEY LOG: D3 STORAGE COMPARTMENT_0315'
        },
        {
          id: 'clean_cart',
          name: '📋 청소 수납 카트',
          pos: { x: -90, y: -30, z: 220 },
          dialog: '버려진 카트 하구 밑창에서 유용한 "군용 손전등(Flashlight)"과 세척 기록 부품을 보완 획득했습니다!',
          grantsItemId: 'flashlight',
          glowHint: '🔦 SYSTEM LANTERN DETECTED'
        },
        {
          id: 'clean_schedule',
          name: '📋 벽보 청소 일정표',
          pos: { x: 112, y: 5, z: 85 },
          dialog: '형광펜 밑줄: 수요일 경비 교체 비권 순찰 주기는 정각 기준 "8분" 자릿수라고 선명히 등재되어 있습니다.',
          grantsItemId: 'schedule',
          glowHint: '⏱️ CYCLE INTERVAL: 08 MINUTES'
        }
      ];
    } else if (isLab) {
      spotList = [
        {
          id: 'med_temp',
          name: '🌡️ 배양 수용 온도계',
          pos: { x: -80, y: 10, z: 140 },
          dialog: '수조의 원격 튜브 온도가 영상 4도에 완벽히 정합 정체되어 있습니다. 이 고휘도 배양 기호는 바이오 락 조절자와 상응합니다.',
          glowHint: '❄️ SPECIMEN TEMP STABILIZED AT: 4°C'
        },
        {
          id: 'med_reagent',
          name: '🧪 시료 용매 [B-3-47]',
          pos: { x: 50, y: -10, z: 110 },
          dialog: '실험 구획 3번 약품 라벨에 굵직하게 식각되어 있는 비밀 고유식별코드: "B-3-47" 자율수 배열이 기록되어 있습니다.',
          glowHint: '🧪 REAGENT ID [B-3-47] / COMBINATION TARGET'
        },
        {
          id: 'med_report',
          name: '📂 임상 격리 보고서',
          pos: { x: -10, y: -30, z: 155 },
          dialog: '김규리 생체 소멸 보고서: "에덴 임상 3호 적합 개체는 지하 배양 격리 도크 구획으로 직결 이송함" 원장 오프라인 인장이 낙서되어 있습니다.',
          glowHint: '📄 EXPERIMENT NO.3 OUTCOME: DEEP B3 ISOLATED'
        },
        {
          id: 'anatomical_doll',
          name: '🪆 해부학 마모 인형',
          pos: { x: 90, y: -15, z: 130 },
          dialog: '지퍼로 봉합된 해부 인형 내부 주머니를 파헤치자, 규리가 최후 비명 속에 가죽 수축지에 적어놓은 유서 쪽지를 발견했습니다!',
          glowHint: '📜 "비녀(Hairpin)를 찾아라, 그게 지독한 잠금의 금속 열쇠야..."'
        }
      ];
    } else if (isOffice) {
      spotList = [
        {
          id: 'office_safe',
          name: '💼 원장 위조 이중 금고',
          pos: { x: -65, y: -10, z: 120 },
          dialog: '두꺼운 강철 금고 다이얼 아래 "임명 연력의 마지막 기둥"이라는 자구가 음각되어 있어 역대 회장 기록이 관건입니다.',
          glowHint: '🔒 MASTER DECOY PIN: ENTER COUNCIL YEAR [2019]'
        },
        {
          id: 'office_frame',
          name: '🖼️ 가설 서예 액자 뒤',
          pos: { x: 10, y: 15, z: 160 },
          dialog: '서예 액자 측면 캔버스 후판 나무를 뒤흔들자, 탈출 회로의 핵심 이탈 코드 "2749" 각인이 선명하게 규명되었습니다!',
          grantsItemId: 'bracelet',
          glowHint: '🔐 HIDDEN VAULT PASSWORD: [ 2749 ]'
        },
        {
          id: 'office_chip',
          name: '💾 부대표 생체 통제 칩',
          pos: { x: 75, y: -25, z: 110 },
          dialog: '수인 대표의 백업 생체 정보 칩이 먼지를 쓴 채 잠겨 있습니다. 내부 수열 복호에 "7823" 정밀 수치가 적용되고 있습니다.',
          glowHint: '💾 BIOMETRIC CHIP DECRYPTION CODE: 7823'
        },
        {
          id: 'office_clock',
          name: '⏰ 금속 스탠드 시계',
          pos: { x: -110, y: 10, z: 140 },
          dialog: '차가운 금속 톱니 소리만 기계적으로 흘러갑니다. 뚜렷한 표식은 없는 침형 아날로그 시계입니다.',
          glowHint: '⏱️ NO DETACHABLE CORE INDICATED'
        },
        {
          id: 'office_plant',
          name: '🌿 원형 관상 식물',
          pos: { x: -30, y: -20, z: 130 },
          dialog: '화분 줄기 안쪽 흙이 인위적으로 파헤쳐져 있지만 시들어 버린 갈색 나뭇잎만 몇 조각 떨어져 나부킵니다.',
          glowHint: '🌿 HIDDEN COMPARTMENT EMPTY'
        }
      ];
    } else {
      spotList = [
        {
          id: 'spec_frequencies',
          name: '📡 공간 주파수 정밀 스캔',
          pos: { x: -50, y: -5, z: 150 },
          dialog: '안전 이탈 방지용 초고강도 방해 전파의 전력 레벨과 파형이 분석됩니다. 주파수 일치가 생체 소멸을 방지합니다.',
          glowHint: '📡 EM RADIATION FREQUENCY: 472 MHz'
        },
        {
          id: 'spec_hatch',
          name: '🔒 격리구 구압 해치 분석',
          pos: { x: 50, y: -20, z: 130 },
          dialog: '해치의 유압 개방 밸브 실린더가 수인 부대표의 모범 비녀 열쇠 형태를 필요로 함을 인지했습니다.',
          glowHint: '🔒 HYDRAULIC VALVE COUPLING: PIN INSERTION REQUIRED'
        }
      ];
    }

    setHotspots(spotList);
  }, [quest]);

  // 창 크기 조절 매퍼
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.floor(width),
          height: Math.floor(Math.max(260, height - 30))
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 3D 렌더링 파이프라인 (완벽하게 정지된 초고해상도 실감형 캠 캔버스)
  useEffect(() => {
    if (!quest) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const drawFrame = () => {
      if (!canvas || !ctx || !quest) return;

      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      const w = dimensions.width;
      const h = dimensions.height;
      const cx = w / 2;
      const cy = h / 2;
      // 3D 초점 왜곡 각도
      const focus = Math.max(300, w * 0.7);

      let isCorridor = quest.location?.includes('복도') || quest.location?.includes('기숙사') || quest.location?.includes('로비') || quest.location?.includes('사물함') || quest.location?.includes('전실');
      const isLab = quest.location?.includes('보건실') || quest.location?.includes('약품실') || quest.location?.includes('무균실') || quest.location?.includes('실험실') || quest.location?.includes('수용실') || quest.qid === 'A-10-gas' || quest.qid === 'A-11';
      const isOffice = quest.location?.includes('원장실') || quest.location?.includes('집무실') || quest.location?.includes('사무실') || quest.location?.includes('통제실') || quest.qid === 'A-04';

      if (!isCorridor && !isLab && !isOffice) {
        isCorridor = true; // Fallback
      }

      // 드로우 초기화
      ctx.fillStyle = '#010306';
      ctx.fillRect(0, 0, w, h);

      if (photoMode && imagesLoaded) {
        let activeImg = generalImgRef.current;
        if (isCorridor) activeImg = corridorImgRef.current;
        else if (isLab) activeImg = labImgRef.current;
        else if (isOffice) activeImg = officeImgRef.current;

        if (activeImg && activeImg.complete) {
          ctx.save();
          // 선명하고 아름다운 풀컬러 실제 공간 분위기를 연출하기 위해 밝기만 자연스럽게 살려줍니다.
          ctx.filter = 'brightness(80%) contrast(100%)';
          ctx.drawImage(activeImg, 0, 0, w, h);
          ctx.restore();
        }
      }

      // 정지된 3D 뷰 렌더링을 위해 cos, sin을 완전히 고정하며, 이로 인해 유구한 멀미나 떨림을 완벽히 소거합니다.
      const cosY = 1;
      const sinY = 0;

      const timeSec = Date.now() * 0.001;

      // 잔잔한 전구 형광등 실시간 전압 노이즈 (매우 자연스러운 밝기 흔들림, 물리 좌표 흔들림 없음)
      const flickerFactor = 0.94 + Math.sin(timeSec * 35) * 0.03 + (Math.random() < 0.006 ? -0.15 : 0);

      const project = (pt: Point3D) => {
        const rx = pt.x * cosY - pt.z * sinY;
        const rz = pt.x * sinY + pt.z * cosY;
        const camZ = rz + 200;
        if (camZ <= 10) return null;

        const sx = cx + (rx * focus) / camZ;
        const sy = cy - (pt.y * focus) / camZ;
        return { x: sx, y: sy, depth: camZ };
      };

      const draw3DLine = (p1: Point3D, p2: Point3D, strokeStyle: string, lineWidth: number = 1) => {
        if (photoMode && imagesLoaded) return; // 실사 모드일 때는 와이어 그리기 스킵
        const pt1 = project(p1);
        const pt2 = project(p2);
        if (pt1 && pt2) {
          ctx.save();
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
          ctx.restore();
        }
      };

      // 8모퉁이 가상 격자
      const roomCorners: Point3D[] = [
        { x: -160, y: -100, z: 40 },  
        { x: 160, y: -100, z: 40 },   
        { x: 160, y: -100, z: 360 },  
        { x: -160, y: -100, z: 360 }, 
        { x: -160, y: 100, z: 40 },   
        { x: 160, y: 100, z: 40 },    
        { x: 160, y: 100, z: 360 },   
        { x: -160, y: 100, z: 360 }   
      ];

      const projectedCorners = roomCorners.map(project);

      const fillPolygon = (indices: number[], fillStyle: string | CanvasGradient) => {
        if (photoMode && imagesLoaded) return; // 실사 모드일 때는 3D 폴리곤 채우기 스킵
        const proj = indices.map(idx => projectedCorners[idx]);
        if (proj.some(p => p === null)) return;
        ctx.beginPath();
        ctx.moveTo(proj[0]!.x, proj[0]!.y);
        for (let i = 1; i < proj.length; i++) {
          ctx.lineTo(proj[i]!.x, proj[i]!.y);
        }
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
      };

      // ────────────────────────────────────────────────────────
      // [지물 배경 드로우 제어부]
      // ────────────────────────────────────────────────────────
      if (isCorridor) {
        // 1. 바닥 드로우 (왁스 코팅 고광택 타일 바닥 시뮬레이션)
        const floorGrad = ctx.createLinearGradient(cx, cy, cx, h);
        floorGrad.addColorStop(0, '#02060c'); 
        floorGrad.addColorStop(0.3, '#04101c');
        floorGrad.addColorStop(1, '#010204');  
        fillPolygon([0, 1, 2, 3], floorGrad);

        // 정교한 타일 가로 세로 원근 홈
        ctx.strokeStyle = 'rgba(74, 85, 104, 0.07)';
        ctx.lineWidth = 1;
        for (let gx = -160; gx <= 160; gx += 40) {
          const ptFar = project({ x: gx, y: -100, z: 360 });
          const ptNear = project({ x: gx * 2.2, y: -100, z: 40 });
          if (ptFar && ptNear) {
            ctx.beginPath();
            ctx.moveTo(ptFar.x, ptFar.y);
            ctx.lineTo(ptNear.x, ptNear.y);
            ctx.stroke();
          }
        }
        for (let gz = 40; gz <= 360; gz += 45) {
          draw3DLine({ x: -360, y: -100, z: gz }, { x: 360, y: -100, z: gz }, 'rgba(74, 85, 104, 0.05)', 1);
        }

        // 2. 천장 드로우
        const ceilingGrad = ctx.createLinearGradient(cx, 0, cx, cy);
        ceilingGrad.addColorStop(0, '#010103');
        ceilingGrad.addColorStop(1, '#050a12');
        fillPolygon([4, 5, 6, 7], ceilingGrad);

        // 천장 형광등 사각형 배치 및 바닥 반사 (레퍼런스 이미지의 찬연한 수직 반사 구현)
        const lightZs = [85, 140, 200, 270, 340];
        lightZs.forEach((lz, idx) => {
          const lW = 20 - idx * 2.5;
          const lBL = project({ x: -lW, y: 100, z: lz });
          const lBR = project({ x: lW, y: 100, z: lz });
          const lTL = project({ x: -lW, y: 100, z: lz + 18 });
          const lTR = project({ x: lW, y: 100, z: lz + 18 });

          if (lBL && lBR && lTL && lTR) {
            ctx.save();
            ctx.shadowBlur = (16 - idx * 2.2) * flickerFactor;
            ctx.shadowColor = 'rgba(165, 243, 252, 0.82)';
            ctx.fillStyle = `rgba(224, 242, 254, ${flickerFactor * (0.95 - idx * 0.16)})`;
            ctx.beginPath();
            ctx.moveTo(lTL.x, lTL.y);
            ctx.lineTo(lTR.x, lTR.y);
            ctx.lineTo(lBR.x, lBR.y);
            ctx.lineTo(lBL.x, lBL.y);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // 바닥에 길고 맑은 형광등 반사 라인 (Wet-look)
            const rStart = project({ x: 0, y: -100, z: lz + 9 });
            if (rStart) {
              const rWidth = (16 - idx * 2) * (w / 480);
              const rHeight = (70 + idx * 18) * (h / 260);
              const refGrad = ctx.createLinearGradient(rStart.x, rStart.y, rStart.x, rStart.y + rHeight);
              const alphaValue = Math.max(0.015, 0.22 * (1 - idx * 0.18)) * flickerFactor;
              refGrad.addColorStop(0, `rgba(186, 230, 253, ${alphaValue})`);
              refGrad.addColorStop(0.3, `rgba(56, 189, 248, ${alphaValue * 0.45})`);
              refGrad.addColorStop(1, 'rgba(0,0,0,0)');

              ctx.fillStyle = refGrad;
              ctx.fillRect(rStart.x - rWidth / 2, rStart.y, rWidth, rHeight);
            }
          }
        });

        // 3. 좌/우 벽 드로우
        const wallLeftGrad = ctx.createLinearGradient(0, cy, cx * 0.5, cy);
        wallLeftGrad.addColorStop(0, '#010204');
        wallLeftGrad.addColorStop(1, '#06101c');
        fillPolygon([0, 3, 7, 4], wallLeftGrad);

        const wallRightGrad = ctx.createLinearGradient(w, cy, cx * 1.5, cy);
        wallRightGrad.addColorStop(0, '#010204');
        wallRightGrad.addColorStop(1, '#06101c');
        fillPolygon([1, 2, 6, 5], wallRightGrad);

        // 4. 사물함 캐비닛 (락커) 촘촘히 묘사
        const lockerZs = [60, 95, 130, 165, 200, 235, 270, 305, 340];
        lockerZs.forEach((lz, idx) => {
          // 좌측 락커
          const lT1 = project({ x: -160, y: 60, z: lz });
          const lT2 = project({ x: -160, y: 60, z: lz + 30 });
          const lB1 = project({ x: -160, y: -100, z: lz });
          const lB2 = project({ x: -160, y: -100, z: lz + 30 });

          if (lT1 && lT2 && lB1 && lB2) {
            const lockGrad = ctx.createLinearGradient(lT1.x, cy, lT2.x, cy);
            lockGrad.addColorStop(0, '#03080e');
            lockGrad.addColorStop(0.5, '#0a1d33');
            lockGrad.addColorStop(1, '#010204');
            ctx.fillStyle = lockGrad;
            ctx.beginPath();
            ctx.moveTo(lT1.x, lT1.y);
            ctx.lineTo(lT2.x, lT2.y);
            ctx.lineTo(lB2.x, lB2.y);
            ctx.lineTo(lB1.x, lB1.y);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = idx % 2 === 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 사물함 환풍 그릴 슬릿 3개 상단 드로우
            const lV = project({ x: -160, y: 40, z: lz + 15 });
            if (lV) {
              ctx.fillStyle = '#010203';
              ctx.fillRect(lV.x - 2.5, lV.y - 11, 5, 2);
              ctx.fillRect(lV.x - 2.5, lV.y - 7, 5, 2);
              ctx.fillRect(lV.x - 2.5, lV.y - 3, 5, 2);
            }

            // 다이얼 자키 도크 묘사
            const lK = project({ x: -160, y: -15, z: lz + 22 });
            if (lK) {
              ctx.fillStyle = '#475569';
              ctx.beginPath();
              ctx.arc(lK.x, lK.y, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // 우측 락커
          const rT1 = project({ x: 160, y: 60, z: lz });
          const rT2 = project({ x: 160, y: 60, z: lz + 30 });
          const rB1 = project({ x: 160, y: -100, z: lz });
          const rB2 = project({ x: 160, y: -100, z: lz + 30 });

          if (rT1 && rT2 && rB1 && rB2) {
            const lockGrad = ctx.createLinearGradient(rT1.x, cy, rT2.x, cy);
            lockGrad.addColorStop(0, '#010204');
            lockGrad.addColorStop(0.5, '#0a1d33');
            lockGrad.addColorStop(1, '#03080e');
            ctx.fillStyle = lockGrad;
            ctx.beginPath();
            ctx.moveTo(rT1.x, rT1.y);
            ctx.lineTo(rT2.x, rT2.y);
            ctx.lineTo(rB2.x, rB2.y);
            ctx.lineTo(rB1.x, rB1.y);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = idx % 2 === 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 환풍 그릴
            const rV = project({ x: 160, y: 40, z: lz + 15 });
            if (rV) {
              ctx.fillStyle = '#010203';
              ctx.fillRect(rV.x - 2.5, rV.y - 11, 5, 2);
              ctx.fillRect(rV.x - 2.5, rV.y - 7, 5, 2);
              ctx.fillRect(rV.x - 2.5, rV.y - 3, 5, 2);
            }

            // 다이얼
            const rK = project({ x: 160, y: -15, z: lz + 22 });
            if (rK) {
              ctx.fillStyle = '#475569';
              ctx.beginPath();
              ctx.arc(rK.x, rK.y, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });

        // 5. 복도 저편 뒷벽 및 비상구 철제문
        const backWallGrad = ctx.createLinearGradient(cx, cy - 30, cx, cy + 30);
        backWallGrad.addColorStop(0, '#010306');
        backWallGrad.addColorStop(1, '#050c18');
        fillPolygon([3, 2, 6, 7], backWallGrad);

        const dB1 = project({ x: -33, y: -100, z: 350 });
        const dB2 = project({ x: 33, y: -100, z: 350 });
        const dT1 = project({ x: -33, y: 40, z: 350 });
        const dT2 = project({ x: 33, y: 40, z: 350 });

        if (dB1 && dB2 && dT1 && dT2) {
          ctx.fillStyle = '#010203';
          ctx.beginPath();
          ctx.moveTo(dT1.x, dT1.y);
          ctx.lineTo(dT2.x, dT2.y);
          ctx.lineTo(dB2.x, dB2.y);
          ctx.lineTo(dB1.x, dB1.y);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // 중앙 여닫이선
          ctx.strokeStyle = 'rgba(0,0,0,0.8)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo((dT1.x + dT2.x)/2, (dT1.y + dT2.y)/2);
          ctx.lineTo((dB1.x + dB2.x)/2, (dB1.y + dB2.y)/2);
          ctx.stroke();

          // 안전바
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          const barY = dT1.y + (dB1.y - dT1.y) * 0.58;
          ctx.beginPath();
          ctx.moveTo(dT1.x + 3, barY);
          ctx.lineTo(dT2.x - 3, barY);
          ctx.stroke();

          // 비상구 유리창 (푸른 광택)
          const wL1 = project({ x: -21, y: 15, z: 345 });
          const wL2 = project({ x: -10, y: 15, z: 345 });
          const wL_T1 = project({ x: -21, y: -23, z: 345 });
          const wL_T2 = project({ x: -10, y: -23, z: 345 });

          if (wL1 && wL2 && wL_T1 && wL_T2) {
            ctx.fillStyle = 'rgba(14, 116, 144, 0.35)';
            ctx.beginPath();
            ctx.moveTo(wL1.x, wL1.y);
            ctx.lineTo(wL2.x, wL2.y);
            ctx.lineTo(wL_T2.x, wL_T2.y);
            ctx.lineTo(wL_T1.x, wL_T1.y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0c4a6e';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }

          const wR1 = project({ x: 10, y: 15, z: 345 });
          const wR2 = project({ x: 21, y: 15, z: 345 });
          const wR_T1 = project({ x: 10, y: -23, z: 345 });
          const wR_T2 = project({ x: 21, y: -23, z: 345 });

          if (wR1 && wR2 && wR_T1 && wR_T2) {
            ctx.fillStyle = 'rgba(14, 116, 144, 0.35)';
            ctx.beginPath();
            ctx.moveTo(wR1.x, wR1.y);
            ctx.lineTo(wR2.x, wR2.y);
            ctx.lineTo(wR_T2.x, wR_T2.y);
            ctx.lineTo(wR_T1.x, wR_T1.y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0c4a6e';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // 6. 천장 비상수구 매달려 있는 초록빛 EXIT 간판 (레퍼런스 이미지 핵심 장식)
        const eNodeBase = project({ x: 0, y: 78, z: 120 });
        if (eNodeBase) {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(eNodeBase.x, eNodeBase.y - 15);
          ctx.lineTo(eNodeBase.x, eNodeBase.y);
          ctx.stroke();

          const signW = 28 * (w / 480);
          const signH = 14 * (h / 260);

          ctx.save();
          ctx.shadowBlur = 11 * flickerFactor;
          ctx.shadowColor = '#22c55e';

          ctx.fillStyle = '#030a04';
          ctx.fillRect(eNodeBase.x - signW / 2, eNodeBase.y, signW, signH);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 0.9;
          ctx.strokeRect(eNodeBase.x - signW / 2, eNodeBase.y, signW, signH);

          ctx.fillStyle = '#4ade80';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('EXIT', eNodeBase.x, eNodeBase.y + signH - 4.5);
          ctx.restore();
        }

      } else if (isLab) {
        // [약품 바이오 무균실 환경 묘사]
        const floorGrad = ctx.createLinearGradient(cx, cy, cx, h);
        floorGrad.addColorStop(0, '#0c1214');
        floorGrad.addColorStop(0.3, '#101a1c');
        floorGrad.addColorStop(1, '#040708');
        fillPolygon([0, 1, 2, 3], floorGrad);

        ctx.strokeStyle = 'rgba(20, 184, 166, 0.04)';
        ctx.lineWidth = 1;
        for (let gx = -160; gx <= 160; gx += 40) {
          const ptFar = project({ x: gx, y: -100, z: 360 });
          const ptNear = project({ x: gx * 2.2, y: -100, z: 40 });
          if (ptFar && ptNear) {
            ctx.beginPath();
            ctx.moveTo(ptFar.x, ptFar.y);
            ctx.lineTo(ptNear.x, ptNear.y);
            ctx.stroke();
          }
        }

        const ceilingGrad = ctx.createLinearGradient(cx, 0, cx, cy);
        ceilingGrad.addColorStop(0, '#020304');
        ceilingGrad.addColorStop(1, '#0c1518');
        fillPolygon([4, 5, 6, 7], ceilingGrad);

        const wallLeftGrad = ctx.createLinearGradient(0, cy, cx * 0.5, cy);
        wallLeftGrad.addColorStop(0, '#020304');
        wallLeftGrad.addColorStop(1, '#0e181c');
        fillPolygon([0, 3, 7, 4], wallLeftGrad);

        const wallRightGrad = ctx.createLinearGradient(w, cy, cx * 1.5, cy);
        wallRightGrad.addColorStop(0, '#020304');
        wallRightGrad.addColorStop(1, '#0e181c');
        fillPolygon([1, 2, 6, 5], wallRightGrad);

        // 시료 계측 모니터 및 바이오 시그널 (Right Wall)
        const scrT = project({ x: 160, y: 30, z: 150 });
        const scrB = project({ x: 160, y: -20, z: 150 });
        if (scrT && scrB) {
          const sW = scrT.x - project({ x: 125, y: 30, z: 150 })!.x;
          const sH = scrB.y - scrT.y;
          ctx.fillStyle = '#020617';
          ctx.fillRect(scrT.x - sW, scrT.y, sW, sH);
          ctx.strokeStyle = '#0f766e';
          ctx.lineWidth = 1;
          ctx.strokeRect(scrT.x - sW, scrT.y, sW, sH);

          ctx.strokeStyle = '#2dd4bf';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(scrT.x - sW + 4, scrT.y + sH/2);
          for (let sx = 0; sx < sW - 8; sx += 4) {
            const val = Math.sin((sx + timeSec * 45) * 0.5) * (sx % 12 === 0 ? 11 : 1.2);
            ctx.lineTo(scrT.x - sW + 4 + sx, scrT.y + sH/2 + val);
          }
          ctx.stroke();

          ctx.fillStyle = '#0d9488';
          ctx.font = '7px monospace';
          ctx.fillText('BIOCENTRIC 3', scrT.x - sW + 5, scrT.y + 11);
        }

        // 좌측 생체 배양 수조 원통 실린더 묘사
        const tubeB = project({ x: -110, y: -100, z: 160 });
        const tubeT = project({ x: -110, y: 45, z: 160 });
        if (tubeB && tubeT) {
          const tW = project({ x: -90, y: -100, z: 160 })!.x - tubeB.x;
          const tH = tubeB.y - tubeT.y;

          ctx.save();
          ctx.shadowBlur = 14;
          ctx.shadowColor = '#06b6d4';
          ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
          ctx.fillRect(tubeB.x, tubeT.y + 14, tW, tH - 18);
          ctx.restore();

          ctx.strokeStyle = 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(tubeB.x, tubeT.y, tW, tH);

          // 금속 전단 캡
          ctx.fillStyle = '#334155';
          ctx.fillRect(tubeB.x - 2, tubeT.y - 4, tW + 4, 5);
          ctx.fillRect(tubeB.x - 2, tubeB.y - 1, tW + 4, 5);

          // 수중 기포 부상 모션
          ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
          for (let b = 0; b < 5; b++) {
            const bx = tubeB.x + 3 + ((b * 11 + timeSec * 12) % (tW - 6));
            const by = tubeB.y - 6 - ((b * 21 + timeSec * 19) % (tH - 18));
            ctx.beginPath();
            ctx.arc(bx, by, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

      } else if (isOffice) {
        // [원장의 중후하고 오싹한 집무 격실 묘사]
        const floorGrad = ctx.createLinearGradient(cx, cy, cx, h);
        floorGrad.addColorStop(0, '#100705');
        floorGrad.addColorStop(0.3, '#1a0d0c');
        floorGrad.addColorStop(1, '#050202');
        fillPolygon([0, 1, 2, 3], floorGrad);

        ctx.strokeStyle = 'rgba(120, 53, 4, 0.06)';
        ctx.lineWidth = 1.5;
        for (let gx = -160; gx <= 160; gx += 32) {
          const ptFar = project({ x: gx, y: -100, z: 360 });
          const ptNear = project({ x: gx * 2.2, y: -100, z: 40 });
          if (ptFar && ptNear) {
            ctx.beginPath();
            ctx.moveTo(ptFar.x, ptFar.y);
            ctx.lineTo(ptNear.x, ptNear.y);
            ctx.stroke();
          }
        }

        const ceilingGrad = ctx.createLinearGradient(cx, 0, cx, cy);
        ceilingGrad.addColorStop(0, '#020101');
        ceilingGrad.addColorStop(1, '#110908');
        fillPolygon([4, 5, 6, 7], ceilingGrad);

        const wallLeftGrad = ctx.createLinearGradient(0, cy, cx * 0.5, cy);
        wallLeftGrad.addColorStop(0, '#020101');
        wallLeftGrad.addColorStop(1, '#150a08');
        fillPolygon([0, 3, 7, 4], wallLeftGrad);

        const wallRightGrad = ctx.createLinearGradient(w, cy, cx * 1.5, cy);
        wallRightGrad.addColorStop(0, '#020101');
        wallRightGrad.addColorStop(1, '#150a08');
        fillPolygon([1, 2, 6, 5], wallRightGrad);

        // 클래식 괘종시계 조율 (Left Wall)
        const clkNode = project({ x: -110, y: 10, z: 140 });
        if (clkNode) {
          const cW = 10 * (w / 480);
          const cH = 45 * (h / 260);
          ctx.fillStyle = '#1c0a00';
          ctx.fillRect(clkNode.x - cW/2, clkNode.y - cH/2, cW, cH);
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1;
          ctx.strokeRect(clkNode.x - cW/2, clkNode.y - cH/2, cW, cH);

          // 황동 시계판
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.arc(clkNode.x, clkNode.y - cH/3, 3, 0, Math.PI * 2);
          ctx.fill();

          // 똑딱이는 추
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(clkNode.x, clkNode.y - cH/6);
          const swingAngle = Math.sin(timeSec * 4.2) * 11;
          ctx.lineTo(clkNode.x + swingAngle * 0.28, clkNode.y + cH/3);
          ctx.stroke();
        }

        // 우측 대형 목재 고서 수납장 장하 (Right Wall)
        const bsT = project({ x: 160, y: 55, z: 150 });
        const bsB = project({ x: 160, y: -45, z: 150 });
        if (bsT && bsB) {
          const bsW = bsT.x - project({ x: 125, y: 55, z: 150 })!.x;
          const bsH = bsB.y - bsT.y;
          ctx.fillStyle = '#0f0500';
          ctx.fillRect(bsT.x - bsW, bsT.y, bsW, bsH);
          ctx.strokeStyle = '#270e00';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(bsT.x - bsW, bsT.y, bsW, bsH);

          for (let shelfY = bsT.y + 10; shelfY < bsB.y - 6; shelfY += bsH / 4) {
            ctx.fillStyle = '#270e00';
            ctx.fillRect(bsT.x - bsW, shelfY, bsW, 2);

            let totalBk = 0;
            while (totalBk < bsW - 4) {
              const bkW = 2.4 + (totalBk * 3.3 % 3);
              const bkH = bsH / 5.2 + (totalBk % 3);
              ctx.fillStyle = totalBk % 3 === 0 ? '#451a03' : totalBk % 3 === 1 ? '#14532d' : '#1e3a8a';
              ctx.fillRect(bsT.x - bsW + 2 + totalBk, shelfY - bkH, bkW, bkH);
              totalBk += bkW + 1;
            }
          }
        }

        // 중앙 아치형 이중 격자창과 음침한 푸른 달빛 분산
        const winBaseL = project({ x: -35, y: -20, z: 340 });
        const winBaseR = project({ x: 35, y: -20, z: 340 });
        const winSpringL = project({ x: -35, y: 35, z: 340 });
        const winSpringR = project({ x: 35, y: 35, z: 340 });
        const winApex = project({ x: 0, y: 65, z: 340 });

        if (winBaseL && winBaseR && winSpringL && winSpringR && winApex) {
          ctx.fillStyle = 'rgba(17, 24, 39, 0.45)';
          ctx.beginPath();
          ctx.moveTo(winBaseL.x, winBaseL.y);
          ctx.lineTo(winSpringL.x, winSpringL.y);
          ctx.quadraticCurveTo(winSpringL.x, winApex.y + 6, winApex.x, winApex.y);
          ctx.quadraticCurveTo(winSpringR.x, winApex.y + 6, winSpringR.x, winSpringR.y);
          ctx.lineTo(winBaseR.x, winBaseR.y);
          ctx.closePath();

          const windowMist = ctx.createLinearGradient(winApex.x, winApex.y, winApex.x, winBaseL.y);
          windowMist.addColorStop(0, 'rgba(165, 241, 252, 0.16)');
          windowMist.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
          ctx.fillStyle = windowMist;
          ctx.fill();

          ctx.strokeStyle = '#1e1b4b';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(winApex.x, winApex.y);
          ctx.lineTo((winBaseL.x + winBaseR.x)/2, winBaseL.y);
          ctx.moveTo(winSpringL.x, winSpringL.y);
          ctx.lineTo(winSpringR.x, winSpringR.y);
          ctx.stroke();
        }

        // 고풍스런 집무용 중형 마호가니 책상
        const dsB1 = project({ x: -45, y: -100, z: 180 });
        const dsB2 = project({ x: 45, y: -100, z: 180 });
        const dsT1 = project({ x: -45, y: -50, z: 180 });
        const dsT2 = project({ x: 45, y: -50, z: 180 });

        if (dsB1 && dsB2 && dsT1 && dsT2) {
          ctx.fillStyle = '#220b02';
          ctx.beginPath();
          ctx.moveTo(dsT1.x, dsT1.y);
          ctx.lineTo(dsT2.x, dsT2.y);
          ctx.lineTo(dsB2.x, dsB2.y);
          ctx.lineTo(dsB1.x, dsB1.y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#0a0300';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // 황동 서랍 금속고리
          ctx.fillStyle = '#d97706';
          ctx.fillRect((dsT1.x + dsT2.x)/2 - 12, dsT1.y + 12, 6, 2.5);
          ctx.fillRect((dsT1.x + dsT2.x)/2 + 6, dsT1.y + 12, 6, 2.5);

          // 탁상 목재 상판
          const surf1 = project({ x: -45, y: -50, z: 180 });
          const surf2 = project({ x: 45, y: -50, z: 180 });
          const surf3 = project({ x: 45, y: -50, z: 230 });
          const surf4 = project({ x: -45, y: -50, z: 230 });

          if (surf1 && surf2 && surf3 && surf4) {
            ctx.fillStyle = '#2d1508';
            ctx.beginPath();
            ctx.moveTo(surf1.x, surf1.y);
            ctx.lineTo(surf2.x, surf2.y);
            ctx.lineTo(surf3.x, surf3.y);
            ctx.lineTo(surf4.x, surf4.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 뱅커 스탠드 황동 램프 오버레이
            const lampBase = project({ x: 26, y: -50, z: 195 });
            const lampHead = project({ x: 23, y: -38, z: 190 });
            if (lampBase && lampHead) {
              ctx.strokeStyle = '#e2e8f0';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(lampBase.x, lampBase.y);
              ctx.lineTo(lampHead.x, lampHead.y);
              ctx.stroke();

              ctx.save();
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#d97706';
              ctx.fillStyle = '#065f46';
              ctx.beginPath();
              ctx.ellipse(lampHead.x, lampHead.y, 4, 2, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();

              // 책상 위에 흩뿌려지는 황동색 조명 효과
              const lampGlow = ctx.createRadialGradient(lampHead.x, lampHead.y, 2, lampBase.x - 12, lampBase.y + 8, 35);
              lampGlow.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
              lampGlow.addColorStop(0.4, 'rgba(217, 119, 6, 0.1)');
              lampGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = lampGlow;
              ctx.beginPath();
              ctx.arc(lampHead.x, lampHead.y, 35, 0, Math.PI * 2);
              ctx.fill();
            }

            // 군용 조밀 규격 임상 서첩 (Confidential docs)
            const paperPt = project({ x: -15, y: -50, z: 195 });
            if (paperPt) {
              ctx.fillStyle = 'rgba(244, 244, 245, 0.75)';
              ctx.beginPath();
              ctx.moveTo(paperPt.x - 8, paperPt.y - 4);
              ctx.lineTo(paperPt.x + 8, paperPt.y - 6);
              ctx.lineTo(paperPt.x + 11, paperPt.y + 5);
              ctx.lineTo(paperPt.x - 5, paperPt.y + 7);
              ctx.closePath();
              ctx.fill();

              ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      // ────────────────────────────────────────────────────────
      // 3. 핫스팟 홀로그라피 노드 투영 및 드로우
      // ────────────────────────────────────────────────────────
      hotspots.forEach((spot) => {
        const proj = project(spot.pos);
        if (!proj) return;

        const isChecked = searchedHotspots[spot.name];

        // 타겟 고리 둥근 원 드로우
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = isChecked ? 'rgba(74, 222, 128, 0.25)' : 'rgba(251, 191, 36, 0.2)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = isChecked ? '#10b981' : '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 14 + Math.sin(Date.now() / 150) * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = isChecked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // 십자 타겟선
        ctx.beginPath();
        ctx.moveTo(proj.x - 12, proj.y); ctx.lineTo(proj.x + 12, proj.y);
        ctx.moveTo(proj.x, proj.y - 12); ctx.lineTo(proj.x, proj.y + 12);
        ctx.strokeStyle = isChecked ? 'rgba(74, 222, 128, 0.5)' : 'rgba(251, 191, 36, 0.5)';
        ctx.stroke();

        // 이름 표기 가독성 가속 백 레이어 가미
        ctx.font = 'bold 9px "Inter", sans-serif';
        const textOnly = isChecked ? `[✓] ${spot.name.replace(/^[^\s]+\s+/, '')}` : spot.name;
        const tWidth = ctx.measureText(textOnly).width;
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(proj.x - tWidth / 2 - 4, proj.y - 26, tWidth + 8, 11);

        ctx.fillStyle = isChecked ? '#34d399' : '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText(textOnly, proj.x, proj.y - 18);
      });

      // ────────────────────────────────────────────────────────
      // 4. 전술 야간 수색 손전등(Flashlight) 조준빔 합성 마스킹
      // ────────────────────────────────────────────────────────
      if (flashlightOn) {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = w;
        maskCanvas.height = h;
        const maskCtx = maskCanvas.getContext('2d');

        if (maskCtx) {
          // 장막 어둠 강하
          maskCtx.fillStyle = 'rgba(1, 2, 4, 0.95)';
          maskCtx.fillRect(0, 0, w, h);

          // 랜턴 투과 그라데이션
          const grad = maskCtx.createRadialGradient(
            mousePos.x, mousePos.y, 15,
            mousePos.x, mousePos.y, w * 0.26
          );
          grad.addColorStop(0, 'rgba(0,0,0,1)');         // 투과
          grad.addColorStop(0.2, 'rgba(0,0,0,0.95)');
          grad.addColorStop(0.5, 'rgba(0,0,0,0.35)');
          grad.addColorStop(0.9, 'rgba(0,0,0,0.05)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');          // 어둠 장막

          maskCtx.globalCompositeOperation = 'destination-out';
          maskCtx.fillStyle = grad;
          maskCtx.beginPath();
          maskCtx.arc(mousePos.x, mousePos.y, w * 0.26, 0, Math.PI * 2);
          maskCtx.fill();

          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(maskCanvas, 0, 0);

          // 노란색 아날로그 필라멘트 수색 조명 테두리 링
          ctx.beginPath();
          ctx.arc(mousePos.x, mousePos.y, 45, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.12)';
          ctx.lineWidth = 14;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(mousePos.x, mousePos.y, 25, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // 손전등 근접 범위 내 벽면에 고착된 야광 기호 (Glow Hint Clues)
          hotspots.forEach((spot) => {
            if (!spot.glowHint) return;
            const proj = project(spot.pos);
            if (!proj) return;

            const dx = proj.x - mousePos.x;
            const dy = proj.y - mousePos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 손전등 광선 안에 포착되었을 때
            if (dist < w * 0.22) {
              const opacity = Math.max(0, 1 - dist / (w * 0.22));
              ctx.save();
              ctx.shadowBlur = 12;
              ctx.shadowColor = '#22c55e';
              ctx.font = 'bold 11px monospace';

              ctx.fillStyle = 'rgba(0,0,0,0.85)';
              const glowText = `☣️ ${spot.glowHint}`;
              const gWidth = ctx.measureText(glowText).width;
              ctx.fillRect(proj.x - gWidth/2 - 4, proj.y + 14, gWidth + 8, 13);

              ctx.fillStyle = `rgba(34, 197, 94, ${opacity * 0.95})`;
              ctx.textAlign = 'center';
              ctx.fillText(glowText, proj.x, proj.y + 24);
              ctx.restore();
            }
          });
        }
      }

      // ────────────────────────────────────────────────────────
      // 5. 레이더 조준 크로스헤어 HUD 오버레이
      // ────────────────────────────────────────────────────────
      ctx.strokeStyle = 'rgba(215, 184, 106, 0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      const len = 12;
      ctx.strokeStyle = '#d4b86a';
      ctx.lineWidth = 2.5;
      // Top-Left
      ctx.beginPath(); ctx.moveTo(10, 10 + len); ctx.lineTo(10, 10); ctx.lineTo(10 + len, 10); ctx.stroke();
      // Top-Right
      ctx.beginPath(); ctx.moveTo(w - 10, 10 + len); ctx.lineTo(w - 10, 10); ctx.lineTo(w - 10 - len, 10); ctx.stroke();
      // Bottom-Left
      ctx.beginPath(); ctx.moveTo(10, h - 10 - len); ctx.lineTo(10, h - 10); ctx.lineTo(10 + len, h - 10); ctx.stroke();
      // Bottom-Right
      ctx.beginPath(); ctx.moveTo(w - 10, h - 10 - len); ctx.lineTo(w - 10, h - 10); ctx.lineTo(w - 10 - len, h - 10); ctx.stroke();

      // 6. Volumetric Dust Particles 둥실둥실 부유하는 미세 먼지 소수 렌더링
      ctx.save();
      for (let i = 0; i < 28; i++) {
        const pz = 40 + ((i * 19.3 + timeSec * 14) % 320); 
        const px = Math.sin(i * 12.5 + timeSec * 0.4) * 110 + Math.cos(i * 3.1) * 25;
        const py = -100 + ((i * 14.7 + timeSec * 8) % 200); 

        const proj = project({ x: px, y: py, z: pz });
        if (proj) {
          const dx = proj.x - mousePos.x;
          const dy = proj.y - mousePos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let pOpacity = 0.04;
          if (flashlightOn && dist < w * 0.26) {
            pOpacity += (1 - dist / (w * 0.26)) * 0.42;
          }

          const pSize = 0.8 + Math.abs(Math.sin(timeSec * 2 + i)) * 1.5 * (1 - pz / 400);

          ctx.fillStyle = `rgba(224, 242, 254, ${pOpacity * (1 - pz / 400) * flickerFactor})`;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, pSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 7. 아날로그 35mm 고화질 색보정 및 극장용 비네트 마감
      const vignette = ctx.createRadialGradient(cx, cy, w * 0.25, cx, cy, w * 0.72);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(0.5, 'rgba(0,0,0,0.22)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      // 맑은 시안 블루 스틸 필터링 레이어
      ctx.fillStyle = 'rgba(103, 232, 249, 0.012)';
      ctx.fillRect(0, 0, w, h);

      // CRT 고정형 미세 가로 스캔선
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 센서 은염 특유 단선 노이즈 포인트
      ctx.fillStyle = 'rgba(255, 255, 255, 0.024)';
      for (let i = 0; i < 15; i++) {
        const rx = Math.random() * w;
        const ry = Math.random() * h;
        ctx.fillRect(rx, ry, 1.2, 1.2);
      }
    };

    const tick = () => {
      drawFrame();
      animFrameId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [dimensions, hotspots, searchedHotspots, flashlightOn, mousePos, photoMode, imagesLoaded]);

  // 마우스 이동 핸들러 (손전등 트래킹)
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    setMousePos({ x: curX, y: curY });
  };

  // 모바일 터치 핸들러 수색
  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.touches.length === 1) {
      const rect = canvas.getBoundingClientRect();
      const curX = e.touches[0].clientX - rect.left;
      const curY = e.touches[0].clientY - rect.top;
      setMousePos({ x: curX, y: curY });
    }
  };

  // 캔버스 클릭 시 정지 수색 핫스팟 감지
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const w = dimensions.width;
    const h = dimensions.height;
    const cx = w / 2;
    const cy = h / 2;
    const focus = Math.max(300, w * 0.7);

    let clickedSpot: Hotspot3D | null = null;
    let minDist = 24; // 유효 클릭 반경(24px)

    hotspots.forEach((spot) => {
      const rx = spot.pos.x;
      const rz = spot.pos.z;
      const camZ = rz + 200;

      if (camZ <= 10) return;

      const sx = cx + (rx * focus) / camZ;
      const sy = cy - (spot.pos.y * focus) / camZ;

      const dist = Math.sqrt((clickX - sx) ** 2 + (clickY - sy) ** 2);
      if (dist < minDist) {
        clickedSpot = spot;
        minDist = dist;
      }
    });

    if (clickedSpot) {
      const spotCast = clickedSpot as Hotspot3D;
      onHotspotClick(spotCast.id, spotCast.name, spotCast.dialog, spotCast.grantsItemId);
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#0b0c10]/95 rounded-lg border border-[#d4b86a]/20 overflow-hidden relative">
      
      {/* 고해상도 헤더 바 */}
      <div className="flex justify-between items-center bg-black/80 px-4 py-2 border-b border-white/5 select-none font-mono text-[10px]">
        <div className="flex items-center gap-2">
          <Navigation className="h-3.5 w-3.5 text-[#d4b86a] animate-pulse" />
          <span className="font-serif text-[#d4b86a] font-bold">
            {quest?.location?.includes('원장실') || quest?.location?.includes('집무실') 
              ? '원격 3D 탐색: 원장집무실' 
              : quest?.location?.includes('보건실') || quest?.location?.includes('실험실') || quest?.location?.includes('약품실')
              ? '원격 3D 탐색: 지하생체실험실'
              : '원격 3D 탐색: 1층 기숙사 메인복도'}
          </span>
        </div>
        
        {/* 카메라 피드 방식 토글 인터랙터 (실사 vs 3D 격자) */}
        <div className="flex items-center gap-3">
          <div className="flex bg-[#0f1115] border border-white/10 p-0.5 rounded gap-1 shrink-0">
            <button
              onClick={() => setPhotoMode(true)}
              className={`px-2 py-0.5 rounded text-[8.5px] font-mono transition-all cursor-pointer uppercase ${photoMode ? 'bg-[#22c55e]/25 text-emerald-400 font-black border border-[#22c55e]/30' : 'text-zinc-500 hover:text-zinc-300'}`}
              id="btn_live_cctv_photo"
            >
              📸 REAL SPACE VIEW
            </button>
            <button
              onClick={() => setPhotoMode(false)}
              className={`px-2 py-0.5 rounded text-[8.5px] font-mono transition-all cursor-pointer uppercase ${!photoMode ? 'bg-[#fbbf24]/25 text-yellow-400 font-black border border-[#fbbf24]/30' : 'text-zinc-500 hover:text-zinc-300'}`}
              id="btn_wireframe_3d_vector"
            >
              📐 3D VECTOR LAYER
            </button>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
        </div>
      </div>

      {/* 탐사 캔버스 보드 */}
      <div 
        ref={containerRef}
        className="w-full h-[450px] md:h-[530px] lg:h-[610px] relative bg-[#010306] overflow-hidden shadow-2xl rounded-md"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          onTouchMove={handleTouchMove}
          className="w-full h-full block cursor-crosshair"
        />

        {/* 3D 고정 나침반 정보 */}
        <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-sm border border-white/10 px-2 py-1 rounded flex items-center gap-1.5 pointer-events-none select-none font-mono text-[9px] text-gray-400">
          <Compass className="h-3 w-3 text-[#d4b86a]" />
          <span>STABLE SENSOR COUPLING</span>
        </div>

        {/* 손전등 안내 알림 */}
        {hasFlashlight && !flashlightOn && (
          <div className="absolute bottom-4 left-4 bg-black/85 backdrop-blur-md border border-yellow-500/40 px-3 py-1.5 rounded-md pointer-events-none text-[9.5px] font-mono text-yellow-400 shadow-md animate-bounce">
            🔦 수색 손전등 전원(LIGHT ON)을 켜고 마우스로 캄캄한 현장의 단서들을 찾으세요!
          </div>
        )}
      </div>

      {/* 실시간 보안 상태 콘솔 패널 */}
      <div className="bg-black/90 p-3.5 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center shrink-0">
        
        {/* 안정형 카메라 관측 안내 표지 */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase select-none shrink-0">STATIONARY:</span>
          <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
            멀미 유발 및 어지러움을 방지하기 위해 <strong>카메라 시점 회전 기능이 해제되고 정적 리얼 뷰로 고정</strong>되었습니다. 안심하고 현장을 수색하십시오.
          </p>
        </div>

        {/* 손전등 토글 버튼 */}
        <div className="flex items-center justify-between gap-3 bg-[#0a0a0f] border border-white/5 p-2 rounded-lg">
          <div className="flex items-center gap-2 select-none">
            <span className="text-lg">🔦</span>
            <div>
              <span className="text-[10px] text-gray-500 block leading-none font-mono">TACTICAL BRIGHT LANTERN</span>
              <span className="text-[11px] text-gray-300 font-semibold font-sans">
                {hasFlashlight ? '휴대용 군용 손전등 장치 장착' : '손전등 요망'}
              </span>
            </div>
          </div>
          
          {hasFlashlight ? (
            <button
              onClick={() => setFlashlightOn(!flashlightOn)}
              className={`px-4 py-1.5 rounded text-[11px] font-semibold cursor-pointer transition-all border shrink-0 ${flashlightOn ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'bg-black text-gray-400 border-white/10 hover:border-amber-400/50'}`}
            >
              {flashlightOn ? '🔦 LIGHT ON' : '🔌 LIGHT OFF'}
            </button>
          ) : (
            <span className="text-[9px] font-mono text-red-500 bg-red-950/20 border border-red-900/30 px-2 py-1 rounded">
              ※ 복도 청소 수납 카트 수색 요망
            </span>
          )}
        </div>

      </div>

      <div className="bg-[#0e0e13] px-4 py-2 border-t border-white/5 flex items-center justify-between font-mono text-[9px] text-[#55526d] select-none shrink-0">
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3 text-[#d4b86a]" />
          마우스를 캔버스에서 조준해 손전등 빛을 가이드하고, 타겟 노드들을 클릭하여 수집하십시오.
        </span>
        <span className="shrink-0 uppercase font-bold text-[#d4b86a]/70">procedural perspective 3d engine</span>
      </div>

    </div>
  );
}
