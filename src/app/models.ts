export type ExerciseCategory = string;
export type FlowSection = 'warmup' | 'core' | 'cooldown';
export type ComposerMode = 'list' | 'timeline';
export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  apparatus: string;
  level: ExerciseLevel;
  durationSeconds: number;
  contraindications: string[];
  contraindicationsNote?: string;
  cueTags: string[];
  focusAreas: string[];
  defaultSection: FlowSection;
  benefits?: string;
  focus?: string;
  setup?: string;
  breathing?: string;
  reps?: string;
  safetyNote?: string;
  whereToFeel?: string;
  transitionIn?: string;
  transitionOut?: string;
  selfCheck?: string;
  whatToAvoid?: string;
  alternativeExercise?: string;
  instructorNote?: string;
  teachingCues?: string[];
  instructions?: string[];
  modifications?: string[];
  progressions?: string[];
  primaryMuscles?: string[];
}

export interface FlowBlock {
  id: string;
  exerciseId: string;
  exerciseName: string;
  durationSeconds: number;
  transitionSeconds: number;
  restSeconds: number;
  notes: string;
  section: FlowSection;
}

export interface SavedFlow {
  id: string;
  name: string;
  blocks: FlowBlock[];
  totalDurationSeconds: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FlowTemplate {
  id: string;
  name: string;
  description?: string;
  goal: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  accessLevel?: 'Free' | 'Pro';
  apparatus: string;
  focusAreas: string[];
  tags: string[];
  recommendedClassLengthMinutes: number;
  blocks: FlowBlock[];
}

export interface TimerPreset {
  id: string;
  name: string;
  defaultTransitionSeconds: number;
  defaultRestSeconds: number;
  roundBehavior: 'none' | 'repeat';
}

export interface ClientNote {
  id: string;
  clientName: string;
  note: string;
  flags: string[];
  updatedAt: string;
}

export interface AppPreferences {
  theme: string;
  locale: string;
  composerMode: ComposerMode;
  timerPresetId: string;
  instructorName?: string;
}
