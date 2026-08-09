import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FlowBlock } from '../../models';
import { ExerciseTimingService } from '../../services/exercise-timing.service';
import { FlowService } from '../../services/flow.service';
import { PreferencesService } from '../../services/preferences.service';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-timer-page',
  standalone: true,
  imports: [IonicModule, FormsModule, TranslatePipe],
  templateUrl: './timer.page.html',
  styleUrl: './timer.page.scss'
})
export class TimerPage implements OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly timerService = inject(TimerService);
  private readonly flowService = inject(FlowService);
  private readonly exerciseTimingService = inject(ExerciseTimingService);
  private readonly preferences = inject(PreferencesService);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private cueTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private audioContext: AudioContext | null = null;
  private trackedExerciseBlockId: string | null = null;
  private trackedExerciseElapsedSeconds = 0;

  readonly presets = this.timerService.presets;
  readonly selectedPresetId = signal(this.preferences.getPreferences().timerPresetId);
  readonly hasStarted = signal(false);
  readonly isRunning = signal(false);
  readonly isComplete = signal(false);
  readonly outlineExpanded = signal(false);
  readonly currentIndex = signal(0);
  readonly currentPhase = signal<'exercise' | 'transition' | 'rest'>('exercise');
  readonly phaseSecondsRemaining = signal(0);
  readonly liveCueText = signal('');

  readonly blocks = computed(() => this.flowService.currentBlocks());

  readonly totalLabel = computed(() => {
    const total = this.timerService.calculateTotalSeconds(this.flowService.currentBlocks());
    return this.timerService.formatSeconds(total);
  });

  readonly selectedPreset = computed(() => {
    return this.presets.find((preset) => preset.id === this.selectedPresetId()) ?? this.presets[0];
  });

  readonly currentBlock = computed(() => this.blocks()[this.currentIndex()] ?? null);
  readonly exerciseCount = computed(() => this.blocks().length);

  readonly sectionCountLabel = computed(() => {
    const counts = this.blocks().reduce((acc, block) => {
      acc[block.section] += 1;
      return acc;
    }, { warmup: 0, core: 0, cooldown: 0 });

    const parts: string[] = [];
    if (counts.warmup > 0) {
      parts.push(this.translate.instant('PAGES.TIMER.SECTION_FORMAT', { count: counts.warmup, section: this.translate.instant('COMMON.WARMUP').toLowerCase() }));
    }
    if (counts.core > 0) {
      parts.push(this.translate.instant('PAGES.TIMER.SECTION_FORMAT', { count: counts.core, section: this.translate.instant('COMMON.CORE').toLowerCase() }));
    }
    if (counts.cooldown > 0) {
      parts.push(this.translate.instant('PAGES.TIMER.SECTION_FORMAT', { count: counts.cooldown, section: this.translate.instant('COMMON.COOLDOWN').toLowerCase() }));
    }

    return parts.join(' · ');
  });

  readonly exerciseTotalLabel = computed(() => this.timerService.formatSeconds(this.blocks().reduce((sum, block) => sum + block.durationSeconds, 0)));
  readonly transitionTotalLabel = computed(() => this.timerService.formatSeconds(this.blocks().reduce((sum, block) => sum + block.transitionSeconds, 0)));
  readonly restTotalLabel = computed(() => this.timerService.formatSeconds(this.blocks().reduce((sum, block) => sum + block.restSeconds, 0)));

  readonly phaseLabel = computed(() => {
    const phase = this.currentPhase();
    if (phase === 'exercise') {
      return this.translate.instant('PAGES.TIMER.PHASE_EXERCISE');
    }

    if (phase === 'transition') {
      return this.translate.instant('PAGES.TIMER.PHASE_TRANSITION');
    }

    return this.translate.instant('PAGES.TIMER.PHASE_REST');
  });

  readonly phaseTimeLabel = computed(() => this.timerService.formatSeconds(this.phaseSecondsRemaining()));

  readonly currentPhaseTotalSeconds = computed(() => {
    const block = this.currentBlock();
    if (!block) {
      return 1;
    }

    return Math.max(this.phaseDuration(block, this.currentPhase()), 1);
  });

  readonly phaseProgress = computed(() => {
    const total = this.currentPhaseTotalSeconds();
    const remaining = Math.min(this.phaseSecondsRemaining(), total);
    const done = Math.max(total - remaining, 0);
    return done / total;
  });

  readonly totalRemainingLabel = computed(() => {
    if (!this.hasStarted()) {
      return this.totalLabel();
    }

    const blocks = this.blocks();
    const currentIndex = this.currentIndex();

    if (blocks.length === 0 || currentIndex >= blocks.length) {
      return '0:00';
    }

    let remaining = this.phaseSecondsRemaining();
    for (let index = currentIndex + 1; index < blocks.length; index += 1) {
      const block = blocks[index];
      remaining += block.durationSeconds + block.transitionSeconds + block.restSeconds;
    }

    const current = blocks[currentIndex];
    if (this.currentPhase() === 'exercise') {
      remaining += current.transitionSeconds + current.restSeconds;
    } else if (this.currentPhase() === 'transition') {
      remaining += current.restSeconds;
    }

    return this.timerService.formatSeconds(Math.max(remaining, 0));
  });

  readonly totalRemainingSeconds = computed(() => {
    if (!this.hasStarted()) {
      return this.timerService.calculateTotalSeconds(this.blocks());
    }

    const blocks = this.blocks();
    const currentIndex = this.currentIndex();
    if (blocks.length === 0 || currentIndex >= blocks.length) {
      return 0;
    }

    let remaining = this.phaseSecondsRemaining();
    for (let index = currentIndex + 1; index < blocks.length; index += 1) {
      const block = blocks[index];
      remaining += block.durationSeconds + block.transitionSeconds + block.restSeconds;
    }

    const current = blocks[currentIndex];
    if (this.currentPhase() === 'exercise') {
      remaining += current.transitionSeconds + current.restSeconds;
    } else if (this.currentPhase() === 'transition') {
      remaining += current.restSeconds;
    }

    return Math.max(remaining, 0);
  });

  readonly classProgress = computed(() => {
    const total = Math.max(this.timerService.calculateTotalSeconds(this.blocks()), 1);
    const remaining = this.totalRemainingSeconds();
    return Math.max(0, Math.min(1, (total - remaining) / total));
  });

  readonly currentPositionLabel = computed(() => {
    if (!this.hasStarted() || this.blocks().length === 0) {
      return this.translate.instant('PAGES.TIMER.POSITION', { current: 0, total: this.blocks().length });
    }

    const index = Math.min(this.currentIndex() + 1, this.blocks().length);
    return this.translate.instant('PAGES.TIMER.POSITION', { current: index, total: this.blocks().length });
  });

  readonly upNextExercise = computed(() => {
    if (this.blocks().length === 0) {
      return '';
    }

    if (!this.hasStarted()) {
      return this.blocks()[0].exerciseName;
    }

    const nextIndex = this.currentIndex() + 1;
    return this.blocks()[nextIndex]?.exerciseName ?? this.translate.instant('PAGES.TIMER.FINISH_CLASS');
  });

  readonly canJumpInOutline = computed(() => this.hasStarted() && !this.isComplete());

  readonly outlinePreview = computed(() => {
    const source = this.outlineExpanded() ? this.blocks() : this.blocks().slice(0, 6);
    const items = source.map((block, index) => ({
      index: index + 1,
      name: block.exerciseName,
      durationLabel: this.blockDurationLabel(block)
    }));

    return items;
  });

  readonly hiddenOutlineCount = computed(() => Math.max(this.blocks().length - this.outlinePreview().length, 0));

  ngOnDestroy(): void {
    this.stopInterval();
    this.clearCueTimeout();
  }

  updatePreset(id: string): void {
    this.selectedPresetId.set(id);
    this.preferences.updatePreferences({ timerPresetId: id });
  }

  startOrResume(): void {
    if (this.blocks().length === 0 || this.isComplete()) {
      return;
    }

    if (!this.hasStarted()) {
      this.hasStarted.set(true);
      this.currentIndex.set(0);
      this.currentPhase.set('exercise');
      this.phaseSecondsRemaining.set(this.phaseDuration(this.blocks()[0], 'exercise'));
      this.showNowCue(this.blocks()[0].exerciseName);
      this.beginExerciseTracking(this.blocks()[0]);
    }

    if (this.phaseSecondsRemaining() <= 0) {
      const block = this.currentBlock();
      if (block) {
        this.phaseSecondsRemaining.set(this.phaseDuration(block, this.currentPhase()));
      }
    }

    this.isRunning.set(true);
    this.ensureInterval();
  }

  pause(): void {
    this.isRunning.set(false);
    this.stopInterval();
  }

  reset(): void {
    this.stopInterval();
    this.hasStarted.set(false);
    this.isRunning.set(false);
    this.isComplete.set(false);
    this.outlineExpanded.set(false);
    this.currentIndex.set(0);
    this.currentPhase.set('exercise');
    this.phaseSecondsRemaining.set(0);
    this.resetExerciseTracking();
  }

  skipToNext(): void {
    if (!this.hasStarted() || this.isComplete()) {
      return;
    }

    this.advancePhaseOrBlock();
  }

  toggleOutlineExpanded(): void {
    this.outlineExpanded.update((value) => !value);
  }

  jumpToExercise(index: number): void {
    if (!this.canJumpInOutline()) {
      return;
    }

    const blocks = this.blocks();
    if (index < 0 || index >= blocks.length) {
      return;
    }

    this.commitTrackedExerciseSample();
    this.currentIndex.set(index);
    this.currentPhase.set('exercise');
    this.phaseSecondsRemaining.set(this.phaseDuration(blocks[index], 'exercise'));
    this.showNowCue(`${this.translate.instant('PAGES.TIMER.NOW_PREFIX')}: ${blocks[index].exerciseName}`, 2000);
    this.beginExerciseTracking(blocks[index]);
  }

  private ensureInterval(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      if (!this.isRunning()) {
        return;
      }

      if (this.currentPhase() === 'exercise' && this.trackedExerciseBlockId) {
        this.trackedExerciseElapsedSeconds += 1;
      }

      const next = this.phaseSecondsRemaining() - 1;
      if (next > 0) {
        this.phaseSecondsRemaining.set(next);
        return;
      }

      this.advancePhaseOrBlock();
    }, 1000);
  }

  private stopInterval(): void {
    if (!this.intervalId) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private advancePhaseOrBlock(): void {
    const block = this.currentBlock();
    if (!block) {
      this.finishClass();
      return;
    }

    const phase = this.currentPhase();
    if (phase === 'exercise') {
      this.commitTrackedExerciseSample();
      this.currentPhase.set('transition');
      this.phaseSecondsRemaining.set(this.phaseDuration(block, 'transition'));
      this.emitPhaseFeedback();
      if (this.phaseSecondsRemaining() <= 0) {
        this.advancePhaseOrBlock();
      }
      return;
    }

    if (phase === 'transition') {
      this.currentPhase.set('rest');
      this.phaseSecondsRemaining.set(this.phaseDuration(block, 'rest'));
      this.emitPhaseFeedback();
      if (this.phaseSecondsRemaining() <= 0) {
        this.advancePhaseOrBlock();
      }
      return;
    }

    const nextIndex = this.currentIndex() + 1;
    if (nextIndex >= this.blocks().length) {
      this.finishClass();
      return;
    }

    this.currentIndex.set(nextIndex);
    this.currentPhase.set('exercise');
    this.phaseSecondsRemaining.set(this.phaseDuration(this.blocks()[nextIndex], 'exercise'));
    this.beginExerciseTracking(this.blocks()[nextIndex]);
    this.emitPhaseFeedback();
    this.showNowCue(this.blocks()[nextIndex].exerciseName);
  }

  private phaseDuration(block: { durationSeconds: number; transitionSeconds: number; restSeconds: number }, phase: 'exercise' | 'transition' | 'rest'): number {
    if (phase === 'exercise') {
      return block.durationSeconds;
    }

    if (phase === 'transition') {
      return block.transitionSeconds;
    }

    return block.restSeconds;
  }

  private blockDurationLabel(block: FlowBlock): string {
    return `${block.durationSeconds}s + ${block.transitionSeconds}s + ${block.restSeconds}s`;
  }

  private finishClass(): void {
    this.stopInterval();
    this.isRunning.set(false);
    this.isComplete.set(true);
    this.phaseSecondsRemaining.set(0);
    this.commitTrackedExerciseSample();
    this.resetExerciseTracking();
    this.emitPhaseFeedback(true);
    this.showNowCue(this.translate.instant('PAGES.TIMER.CUE_CLASS_COMPLETE'), 2800);
  }

  private beginExerciseTracking(block: FlowBlock): void {
    this.trackedExerciseBlockId = block.id;
    this.trackedExerciseElapsedSeconds = 0;
  }

  private commitTrackedExerciseSample(): void {
    const block = this.currentBlock();
    if (!block || this.trackedExerciseBlockId !== block.id) {
      this.resetExerciseTracking();
      return;
    }

    if (this.trackedExerciseElapsedSeconds > 0) {
      this.exerciseTimingService.recordSample(block.exerciseId, this.trackedExerciseElapsedSeconds);
    }

    this.resetExerciseTracking();
  }

  private resetExerciseTracking(): void {
    this.trackedExerciseBlockId = null;
    this.trackedExerciseElapsedSeconds = 0;
  }

  private emitPhaseFeedback(isComplete = false): void {
    this.playCueTone(isComplete ? 900 : 660, isComplete ? 220 : 110);
    this.triggerHaptic(isComplete ? [120, 70, 120] : [45]);
  }

  private showNowCue(text: string, durationMs = 2500): void {
    this.liveCueText.set(text);
    this.clearCueTimeout();
    this.cueTimeoutId = setTimeout(() => {
      this.liveCueText.set('');
      this.cueTimeoutId = null;
    }, durationMs);
  }

  private clearCueTimeout(): void {
    if (!this.cueTimeoutId) {
      return;
    }

    clearTimeout(this.cueTimeoutId);
    this.cueTimeoutId = null;
  }

  private triggerHaptic(pattern: number[]): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }

    const capacitorHaptics = (globalThis as { Capacitor?: { Plugins?: { Haptics?: { impact?: (options: { style: 'Medium' }) => Promise<void> } } } }).Capacitor?.Plugins?.Haptics;
    void capacitorHaptics?.impact?.({ style: 'Medium' });
  }

  private playCueTone(frequency: number, durationMs: number): void {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    try {
      this.audioContext ??= new AudioContextCtor();
      if (this.audioContext.state === 'suspended') {
        void this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const now = this.audioContext.currentTime;
      const duration = durationMs / 1000;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.01);
    } catch {
      // Audio feedback is optional. Swallow runtime audio errors to keep timer resilient.
    }
  }
}
