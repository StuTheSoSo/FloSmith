import { Component, ElementRef, QueryList, ViewChildren, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { addOutline, chevronDownOutline, chevronUpOutline, removeOutline, trashOutline } from 'ionicons/icons';
import { ComposerMode, FlowBlock, FlowSection } from '../../models';
import { ExerciseTimingService } from '../../services/exercise-timing.service';
import { FlowService } from '../../services/flow.service';
import { LibraryService } from '../../services/library.service';
import { PreferencesService } from '../../services/preferences.service';
import { TimerService } from '../../services/timer.service';

interface FlowSectionGroup {
  id: FlowSection;
  label: string;
  blocks: FlowBlock[];
}

@Component({
  selector: 'app-flow-builder-page',
  standalone: true,
  imports: [IonicModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './flow-builder.page.html',
  styleUrl: './flow-builder.page.scss'
})
export class FlowBuilderPage {
  @ViewChildren('planItemEl') planItemEls!: QueryList<ElementRef<HTMLElement>>;
  private readonly router = inject(Router);
  private readonly flowService = inject(FlowService);
  private readonly libraryService = inject(LibraryService);
  private readonly exerciseTimingService = inject(ExerciseTimingService);
  private readonly timerService = inject(TimerService);
  private readonly preferencesService = inject(PreferencesService);

  readonly blocks = this.flowService.currentBlocks;
  readonly libraryExercises = this.libraryService.getAll();
  readonly addQuery = signal('');
  readonly recentExerciseIds = signal<string[]>([]);
  readonly targetMinutes = signal(50);

  readonly mode = signal<ComposerMode>(this.preferencesService.getPreferences().composerMode);

  readonly totalSeconds = computed(() => this.timerService.calculateTotalSeconds(this.blocks()));

  readonly totalLabel = computed(() => {
    return this.timerService.formatSeconds(this.totalSeconds());
  });

  readonly activeTimeLabel = computed(() => {
    const activeSeconds = this.blocks().reduce((total, block) => total + block.durationSeconds, 0);
    return this.timerService.formatSeconds(activeSeconds);
  });

  readonly timingDetailLabel = computed(() => {
    const transitionSeconds = this.blocks().reduce((total, block) => total + block.transitionSeconds, 0);
    const restSeconds = this.blocks().reduce((total, block) => total + block.restSeconds, 0);
    return `${this.timerService.formatSeconds(transitionSeconds)} transitions · ${this.timerService.formatSeconds(restSeconds)} rest`;
  });

  readonly targetDeltaLabel = computed(() => {
    if (this.blocks().length === 0) {
      return 'Choose a target before building';
    }

    const deltaSeconds = this.totalSeconds() - (this.targetMinutes() * 60);
    if (Math.abs(deltaSeconds) < 30) {
      return 'On target';
    }

    const label = this.timerService.formatSeconds(Math.abs(deltaSeconds));
    return deltaSeconds > 0 ? `${label} over target` : `${label} under target`;
  });

  readonly sectionGroups = computed<FlowSectionGroup[]>(() => {
    const labels: Record<FlowSection, string> = {
      warmup: 'Warm-up',
      core: 'Main work',
      cooldown: 'Cool-down'
    };

    return (['warmup', 'core', 'cooldown'] as FlowSection[]).map((section) => ({
      id: section,
      label: labels[section],
      blocks: this.blocks().filter((block) => block.section === section)
    }));
  });

  constructor() {
    addIcons({
      'add-outline': addOutline,
      'chevron-down-outline': chevronDownOutline,
      'chevron-up-outline': chevronUpOutline,
      'remove-outline': removeOutline,
      'trash-outline': trashOutline
    });
  }

  readonly recentExercises = computed(() => this.recentExerciseIds()
    .map((id) => this.libraryService.findById(id))
    .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise)));

  readonly quickAddExercises = computed(() => {
    const query = this.addQuery().trim().toLowerCase();
    const matchScore = (name: string): number => {
      if (!query) {
        return 0;
      }

      const normalized = name.toLowerCase();
      if (normalized.startsWith(query)) {
        return 0;
      }

      const index = normalized.indexOf(query);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index + 10;
    };

    const candidates = this.libraryExercises
      .filter((exercise) => {
        if (!query) {
          return true;
        }

        const haystack = [exercise.name, exercise.apparatus, exercise.level, exercise.focusAreas.join(' ')].join(' ').toLowerCase();
        return haystack.includes(query);
      })
      .sort((left, right) => {
        const scoreDiff = matchScore(left.name) - matchScore(right.name);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        return left.name.localeCompare(right.name);
      });

    return candidates.slice(0, 20);
  });

  setMode(next: ComposerMode): void {
    this.mode.set(next);
    this.preferencesService.updatePreferences({ composerMode: next });
  }

  addExercise(exerciseId: string): void {
    const exercise = this.libraryService.findById(exerciseId);
    if (!exercise) {
      return;
    }

    const block: FlowBlock = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      durationSeconds: exercise.durationSeconds,
      transitionSeconds: 15,
      restSeconds: 10,
      notes: '',
      section: exercise.defaultSection
    };

    this.flowService.addBlock(block);

    const nextRecent = [exercise.id, ...this.recentExerciseIds().filter((id) => id !== exercise.id)].slice(0, 8);
    this.recentExerciseIds.set(nextRecent);
  }

  moveUp(index: number): void {
    this.flipMove(index, index - 1);
  }

  moveDown(index: number): void {
    this.flipMove(index, index + 1);
  }

  private flipMove(from: number, to: number): void {
    const items = this.planItemEls.toArray();
    const fromEl = items[from]?.nativeElement;
    const toEl = items[to]?.nativeElement;

    // Capture positions BEFORE the swap
    const fromTop = fromEl?.getBoundingClientRect().top ?? 0;
    const toTop = toEl?.getBoundingClientRect().top ?? 0;

    // Perform the data swap immediately
    this.flowService.moveBlock(from, to);

    // After Angular re-renders, apply inverted transforms then animate to zero
    requestAnimationFrame(() => {
      const items2 = this.planItemEls.toArray();
      // After swap: the element that was at 'from' is now at position 'to' in DOM
      const movedEl = items2[to]?.nativeElement;
      const displacedEl = items2[from]?.nativeElement;
      if (!movedEl || !displacedEl) return;

      const movedNewTop = movedEl.getBoundingClientRect().top;
      const displacedNewTop = displacedEl.getBoundingClientRect().top;

      const movedDy = fromTop - movedNewTop;
      const displacedDy = toTop - displacedNewTop;

      // Jump to old visual positions instantly
      movedEl.style.transition = 'none';
      displacedEl.style.transition = 'none';
      movedEl.style.transform = `translateY(${movedDy}px)`;
      displacedEl.style.transform = `translateY(${displacedDy}px)`;

      // Animate to natural (new) positions
      requestAnimationFrame(() => {
        const ease = 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)';
        movedEl.style.transition = ease;
        displacedEl.style.transition = ease;
        movedEl.style.transform = '';
        displacedEl.style.transform = '';
        setTimeout(() => {
          movedEl.style.transition = '';
          displacedEl.style.transition = '';
        }, 300);
      });
    });
  }

  remove(blockId: string): void {
    this.flowService.removeBlock(blockId);
  }

  adjustDuration(block: FlowBlock, deltaSeconds: number): void {
    const nextDuration = Math.max(15, block.durationSeconds + deltaSeconds);
    this.flowService.updateBlock(block.id, { durationSeconds: nextDuration });
  }

  blockTotalLabel(block: FlowBlock): string {
    return this.timerService.formatSeconds(block.durationSeconds + block.transitionSeconds + block.restSeconds);
  }

  blockDurationLabel(block: FlowBlock): string {
    return this.timerService.formatSeconds(block.durationSeconds);
  }

  clearAll(): void {
    this.flowService.clearCurrentFlow();
  }

  startFlow(): void {
    if (this.blocks().length === 0) {
      return;
    }

    this.router.navigate(['/timer']);
  }

  suggestedTimingLabel(exerciseId: string, fallbackSeconds: number): string {
    const count = this.exerciseTimingService.getSampleCount(exerciseId);
    if (count === 0) {
      return '';
    }

    const suggested = this.exerciseTimingService.getSuggestedDuration(exerciseId, fallbackSeconds, 5);
    const recentCount = Math.min(count, 5);
    return `~${suggested}s (${recentCount}x)`;
  }
}
