import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { ComposerMode, FlowBlock } from '../../models';
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
  private readonly flowService = inject(FlowService);
  private readonly libraryService = inject(LibraryService);
  private readonly timerService = inject(TimerService);
  private readonly preferencesService = inject(PreferencesService);

  readonly blocks = this.flowService.currentBlocks;
  readonly libraryExercises = this.libraryService.getAll();
  readonly selectedExerciseId = signal(this.libraryExercises[0]?.id ?? '');

  readonly mode = signal<ComposerMode>(this.preferencesService.getPreferences().composerMode);

  readonly totalLabel = computed(() => {
    const total = this.timerService.calculateTotalSeconds(this.blocks());
    return this.timerService.formatSeconds(total);
  });

  setMode(next: ComposerMode): void {
    this.mode.set(next);
    this.preferencesService.updatePreferences({ composerMode: next });
  }

  addSelectedExercise(): void {
    const exercise = this.libraryService.findById(this.selectedExerciseId());
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
}
