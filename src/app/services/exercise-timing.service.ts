import { Injectable } from '@angular/core';

const EXERCISE_TIMING_KEY = 'flosmith.exerciseTiming.v1';
const MAX_SAMPLES_PER_EXERCISE = 20;
const DEFAULT_WINDOW = 5;

type TimingStore = Record<string, number[]>;

@Injectable({ providedIn: 'root' })
export class ExerciseTimingService {
  recordSample(exerciseId: string, elapsedSeconds: number): void {
    const rounded = Math.max(1, Math.round(elapsedSeconds));
    const store = this.loadStore();
    const existing = store[exerciseId] ?? [];
    const next = [...existing, rounded].slice(-MAX_SAMPLES_PER_EXERCISE);
    store[exerciseId] = next;
    this.saveStore(store);
  }

  getAverage(exerciseId: string, window = DEFAULT_WINDOW): number | null {
    const samples = this.loadStore()[exerciseId] ?? [];
    if (samples.length === 0) {
      return null;
    }

    const selected = samples.slice(-Math.max(1, window));
    const total = selected.reduce((sum, item) => sum + item, 0);
    return total / selected.length;
  }

  getSampleCount(exerciseId: string): number {
    return (this.loadStore()[exerciseId] ?? []).length;
  }

  getSuggestedDuration(exerciseId: string, fallbackSeconds: number, window = DEFAULT_WINDOW): number {
    const average = this.getAverage(exerciseId, window);
    return average === null ? fallbackSeconds : Math.max(1, Math.round(average));
  }

  private loadStore(): TimingStore {
    const raw = localStorage.getItem(EXERCISE_TIMING_KEY);
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw) as TimingStore;
      return parsed ?? {};
    } catch {
      return {};
    }
  }

  private saveStore(store: TimingStore): void {
    localStorage.setItem(EXERCISE_TIMING_KEY, JSON.stringify(store));
  }
}
