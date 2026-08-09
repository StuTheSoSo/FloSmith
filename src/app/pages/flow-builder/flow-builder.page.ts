import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { ComposerMode, FlowBlock } from '../../models';
import { ExerciseTimingService } from '../../services/exercise-timing.service';
import { FlowService } from '../../services/flow.service';
import { LibraryService } from '../../services/library.service';
import { PreferencesService } from '../../services/preferences.service';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-flow-builder-page',
  standalone: true,
  imports: [IonicModule, FormsModule, TranslatePipe],
  templateUrl: './flow-builder.page.html',
  styleUrl: './flow-builder.page.scss'
})
export class FlowBuilderPage {
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

  readonly mode = signal<ComposerMode>(this.preferencesService.getPreferences().composerMode);

  readonly totalLabel = computed(() => {
    const total = this.timerService.calculateTotalSeconds(this.blocks());
    return this.timerService.formatSeconds(total);
  });

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
    this.flowService.moveBlock(index, index - 1);
  }

  moveDown(index: number): void {
    this.flowService.moveBlock(index, index + 1);
  }

  remove(blockId: string): void {
    this.flowService.removeBlock(blockId);
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
