export type Scenario = 'A' | 'B' | 'C';

export type QuestType = 'observe' | 'code' | 'logic' | 'caesar' | 'count' | 'pattern' | 'choice';

export interface Choice {
  text: string;
  safe?: boolean;
  danger?: boolean;
  neutral?: boolean;
}

export interface Quest {
  qid: string;
  stage: number;
  location: string;
  emoji: string;
  title: string;
  problem: string;
  type: QuestType;
  answer?: string;
  choices?: Choice[];
  correctChoice?: number;
  itemsRequired?: string[];
  itemsGranted?: string[];
  hintsMax: number;
  timeLimit: number; // in seconds, 0 means no limit
  trustEffect?: { suin?: number; aran?: number };
  npcLine?: string;
  hintLines: string[];
  nextQuest: string;
  choiceTrust?: { suin?: number; aran?: number }[];
  choiceGrant?: string[][];
  choiceNext?: string[];
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  desc: string;
}

export interface LogEntry {
  time: string;
  text: string;
  type: 'normal' | 'good' | 'bad' | 'key' | 'info';
}

export interface GameState {
  scenario: Scenario | null;
  currentStage: number;
  currentQuest: string | null;
  completedQuests: string[];
  inventory: string[];
  trust: { suin: number; aran: number };
  hqCompleted: string[];
  hintsUsed: Record<string, number>;
  timerActive: boolean;
  timerRemaining: number;
}
