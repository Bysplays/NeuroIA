export type CognitiveDomain = 'attention' | 'language' | 'memory' | 'executive' | 'motor';

export type ExerciseId =
  | 'visual-scanning'
  | 'language-naming'
  | 'word-completion'
  | 'memory-path'
  | 'memory-pairs'
  | 'daily-sequencing'
  | 'categorization'
  | 'motor-target'
  | 'motor-tracking';

export interface ExerciseDefinition {
  id: ExerciseId;
  domain: CognitiveDomain;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
}

export type FontSize = 'normal' | 'large' | 'xlarge';

export type ContrastMode = 'standard' | 'high-contrast' | 'soft-dark';

export type HandDominance = 'center' | 'left' | 'right';

export interface AccessibilitySettings {
  showCompanions?: boolean; // Decorative companions; enabled when absent in older profiles.
  pageStyle?: 'default' | 'cozy'; // Older profiles use Default when absent.
  fontSize: FontSize;
  contrast: ContrastMode;
  handDominance: HandDominance;
  speechEnabled: boolean;
  speechRate: number; // 0.7 - 1.2
  soundEffects: boolean;
  leftSideAnchor: boolean; // Legacy persisted field; no longer rendered or configurable.
  hapticTouchFeedback: boolean;
}

export interface DomainProgress {
  level: number;
  totalCompleted: number;
  avgAccuracy: number;
  history: {
    date: string;
    accuracy: number;
    score: number;
  }[];
}

export interface TherapistNote {
  id: string;
  date: string;
  author: string;
  note: string;
  priorityDomain?: CognitiveDomain;
  patientMood?: 'energico' | 'positivo' | 'neutro' | 'cansado';
}

export interface UserProfile {
  name: string;
  strokeDate?: string;
  affectedSide?: 'izquierda' | 'derecha' | 'bilateral' | 'ninguno';
  streakDays: number;
  lastActiveDate: string;
  totalMinutes: number;
  totalSessions: number;
  totalScore: number; // Puntos totales acumulados (NeuroPuntos de Vitalidad)
  domainProgress: Record<CognitiveDomain, DomainProgress>;
  dailyPlanCompletedToday: boolean;
  settings: AccessibilitySettings;
  therapistNotes: TherapistNote[];
  prescribedDomains: CognitiveDomain[]; // Lista múltiple de áreas prioritarias pautadas por el terapeuta
  prescribedDomain?: CognitiveDomain | null; // Retrocompatibilidad
  therapistGuidanceNote?: string;
}

export interface MistakeDetail {
  id?: string;
  item: string;
  userAction: string;
  correctSolution: string;
  explanation?: string;
}

export interface ExerciseResult {
  id: string;
  exerciseId: string;
  domain: CognitiveDomain;
  date: string;
  durationSeconds: number;
  accuracy: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  difficulty?: string;
  feedbackMessage: string;
  notes?: string;
  mistakesList?: MistakeDetail[];
}

export interface CognitiveDomainInfo {
  id: CognitiveDomain;
  title: string;
  subtitle: string;
  description: string;
  clinicalTarget: string;
  color: string;
  bgLight: string;
  iconName: string;
  exerciseTitle: string;
}

export interface DailyPlanSession {
  inProgress: boolean;
  queue: CognitiveDomain[];
  currentIndex: number;
  completedResults: ExerciseResult[];
}
