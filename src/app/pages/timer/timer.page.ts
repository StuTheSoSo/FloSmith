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
  private statsVersion = signal(0);

  readonly presets = this.timerService.presets;
  readonly selectedPresetId = signal(this.preferences.getPreferences().timerPresetId);
  readonly hasStarted = signal(false);
  readonly isRunning = signal(false);
  readonly isComplete = signal(false);
  readonly outlineExpanded = signal(false);
  readonly currentIndex = signal(0);
  readonly currentExerciseElapsedSeconds = signal(0);
  readonly liveCueText = signal('');

  readonly blocks = computed(() => this.flowService.currentBlocks());
  readonly selectedPreset = computed(() => this.presets.find((preset) => preset.id === this.selectedPresetId()) ?? this.presets[0]);
  readonly currentBlock = computed(() => this.blocks()[this.currentIndex()] ?? null);
  readonly exerciseCount = computed(() => this.blocks().length);

  readonly totalLabel = computed(() => {
    const total = this.timerService.calculateTotalSeconds(this.flowService.currentBlocks());
    return this.timerService.formatSeconds(total);
  });

  readonly currentExerciseElapsedLabel = computed(() => this.timerService.formatSeconds(this.currentExerciseElapsedSeconds()));

  readonly currentAverageLabel = computed(() => {
    this.statsVersion();
    const block = this.currentBlock();
    if (!block) {
      return '--:--';
    }

    const average = this.exerciseTimingService.getAverage(block.exerciseId);
    return average === null ? '--:--' : this.timerService.formatSeconds(Math.round(average));
  });

  readonly currentSampleCount = computed(() => {
    this.statsVersion();
    const block = this.currentBlock();
    return block ? this.exerciseTimingService.getSampleCount(block.exerciseId) : 0;
  });

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

  readonly totalRemainingLabel = computed(() => {
    if (!this.hasStarted()) {
      return this.totalLabel();
    }

    const blocks = this.blocks();
    const index = this.currentIndex();
    if (blocks.length === 0 || index >= blocks.length) {
      return '0:00';
    }

    let remaining = 0;
    const current = blocks[index];
    remaining += Math.max(current.durationSeconds - this.currentExerciseElapsedSeconds(), 0);
    remaining += current.transitionSeconds + current.restSeconds;

    for (let i = index + 1; i < blocks.length; i += 1) {
      const block = blocks[i];
      remaining += block.durationSeconds + block.transitionSeconds + block.restSeconds;
    }

    return this.timerService.formatSeconds(remaining);
  });

  readonly totalRemainingSeconds = computed(() => {
    if (!this.hasStarted()) {
      return this.timerService.calculateTotalSeconds(this.blocks());
    }

    const blocks = this.blocks();
    const index = this.currentIndex();
    if (blocks.length === 0 || index >= blocks.length) {
      return 0;
    }

    let remaining = 0;
    const current = blocks[index];
    remaining += Math.max(current.durationSeconds - this.currentExerciseElapsedSeconds(), 0);
    remaining += current.transitionSeconds + current.restSeconds;

    for (let i = index + 1; i < blocks.length; i += 1) {
      const block = blocks[i];
      remaining += block.durationSeconds + block.transitionSeconds + block.restSeconds;
    }

    return remaining;
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

    return this.translate.instant('PAGES.TIMER.POSITION', {
      current: Math.min(this.currentIndex() + 1, this.blocks().length),
      total: this.blocks().length
    });
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

  readonly nextButtonLabel = computed(() => {
    const isLast = this.currentIndex() >= this.blocks().length - 1;
    return isLast ? this.translate.instant('PAGES.TIMER.FINISH_CLASS') : 'Next Exercise';
  });

  readonly canJumpInOutline = computed(() => this.hasStarted() && !this.isComplete());

  readonly outlinePreview = computed(() => {
    const source = this.outlineExpanded() ? this.blocks() : this.blocks().slice(0, 6);
    return source.map((block, index) => ({
      index: index + 1,
      name: block.exerciseName,
      durationLabel: this.blockDurationLabel(block)
    }));
  });

  readonly hiddenOutlineCount = computed(() => Math.max(this.blocks().length - this.outlinePreview().length, 0));
  readonly canToggleOutline = computed(() => this.blocks().length > 6);
  readonly outlineToggleLabel = computed(() =>
    this.outlineExpanded()
      ? this.translate.instant('PAGES.TIMER.OUTLINE_COLLAPSE')
      : this.translate.instant('PAGES.TIMER.OUTLINE_SHOW_ALL')
  );

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
      this.currentExerciseElapsedSeconds.set(0);
      this.beginExerciseTracking(this.blocks()[0]);
      this.showNowCue(this.blocks()[0].exerciseName);
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
    this.currentExerciseElapsedSeconds.set(0);
    this.resetExerciseTracking();
  }

  skipToNext(): void {
    if (!this.hasStarted() || this.isComplete()) {
      return;
    }

    this.advanceToNextExercise();
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
    this.currentExerciseElapsedSeconds.set(0);
    this.beginExerciseTracking(blocks[index]);
    this.showNowCue(`${this.translate.instant('PAGES.TIMER.NOW_PREFIX')}: ${blocks[index].exerciseName}`, 2000);
  }

  private ensureInterval(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      if (!this.isRunning() || this.isComplete() || !this.hasStarted()) {
        return;
      }

      this.currentExerciseElapsedSeconds.update((value) => value + 1);
    }, 1000);
  }

  private stopInterval(): void {
    if (!this.intervalId) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private advanceToNextExercise(): void {
    this.commitTrackedExerciseSample();
    const nextIndex = this.currentIndex() + 1;

    if (nextIndex >= this.blocks().length) {
      this.finishClass();
      return;
    }

    this.currentIndex.set(nextIndex);
    this.currentExerciseElapsedSeconds.set(0);
    this.beginExerciseTracking(this.blocks()[nextIndex]);
    this.emitPhaseFeedback();
    this.showNowCue(this.blocks()[nextIndex].exerciseName);
  }

  private blockDurationLabel(block: FlowBlock): string {
    return `${block.durationSeconds}s + ${block.transitionSeconds}s + ${block.restSeconds}s`;
  }

  private finishClass(): void {
    this.stopInterval();
    this.isRunning.set(false);
    this.isComplete.set(true);
    this.commitTrackedExerciseSample();
    this.resetExerciseTracking();
    this.emitPhaseFeedback(true);
    this.showNowCue(this.translate.instant('PAGES.TIMER.CUE_CLASS_COMPLETE'), 2800);
  }

  private beginExerciseTracking(block: FlowBlock): void {
    this.trackedExerciseBlockId = block.id;
    this.currentExerciseElapsedSeconds.set(0);
  }

  private commitTrackedExerciseSample(): void {
    const block = this.currentBlock();
    if (!block || this.trackedExerciseBlockId !== block.id) {
      this.resetExerciseTracking();
      return;
    }

    const elapsed = this.currentExerciseElapsedSeconds();
    if (elapsed > 0) {
      this.exerciseTimingService.recordSample(block.exerciseId, elapsed);
      this.statsVersion.update((value) => value + 1);
    }

    this.resetExerciseTracking();
  }

  private resetExerciseTracking(): void {
    this.trackedExerciseBlockId = null;
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