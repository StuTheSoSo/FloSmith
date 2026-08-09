import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Exercise } from '../../models';
import { FlowService } from '../../services/flow.service';
import { LibraryService } from '../../services/library.service';

@Component({
  selector: 'app-library-page',
  standalone: true,
  imports: [IonicModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './library.page.html',
  styleUrl: './library.page.scss'
})
export class LibraryPage {
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly translate = inject(TranslateService);
  private readonly libraryService = inject(LibraryService);
  private readonly flowService = inject(FlowService);
  private readonly allExercises = this.libraryService.getAll();

  readonly query = signal('');
  readonly flowCount = this.flowService.currentBlocks;
  readonly activeGroup = signal<'apparatus' | 'focus' | 'section' | 'level'>('apparatus');
  readonly level = signal<'all' | Exercise['level']>('all');
  readonly section = signal<'all' | Exercise['defaultSection']>('all');
  readonly selectedApparatus = signal<string>('all');
  readonly selectedFocus = signal<string>('all');
  readonly sections: Array<'all' | Exercise['defaultSection']> = ['all', 'warmup', 'core', 'cooldown'];
  readonly apparatusOptions = ['all', ...Array.from(new Set(this.allExercises.map((exercise) => exercise.apparatus))).sort((left, right) => left.localeCompare(right))];
  readonly focusOptions = ['all', ...Array.from(new Set(this.allExercises.flatMap((exercise) => exercise.focusAreas))).sort((left, right) => left.localeCompare(right))];

  get exercises(): Exercise[] {
    const group = this.activeGroup();
    const selectedLevel = group === 'level' ? this.level() : 'all';
    const selectedSection = group === 'section' ? this.section() : 'all';

    const filtered = this.libraryService.filter(this.query(), 'all', selectedLevel, selectedSection);

    if (group === 'apparatus' && this.selectedApparatus() !== 'all') {
      return filtered.filter((exercise) => exercise.apparatus === this.selectedApparatus());
    }

    if (group === 'focus' && this.selectedFocus() !== 'all') {
      return filtered.filter((exercise) => exercise.focusAreas.includes(this.selectedFocus()));
    }

    return filtered;
  }

  get resultCount(): number {
    return this.exercises.length;
  }

  get groupedExercises(): Array<{ id: string; label: string; exercises: Exercise[] }> {
    const group = this.activeGroup();
    const groups = new Map<string, Exercise[]>();

    for (const exercise of this.exercises) {
      const key = this.groupLabelForExercise(exercise, group);
      const existing = groups.get(key) ?? [];
      existing.push(exercise);
      groups.set(key, existing);
    }

    return this.sortGroupLabels(Array.from(groups.keys()), group).map((label) => ({
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      exercises: [...(groups.get(label) ?? [])].sort((left, right) => left.name.localeCompare(right.name))
    }));
  }

  sectionLabel(section: Exercise['defaultSection']): string {
    if (section === 'warmup') {
      return 'Warmup';
    }

    if (section === 'cooldown') {
      return 'Cooldown';
    }

    return 'Core';
  }

  async addExercise(exercise: Exercise): Promise<void> {
    this.flowService.addBlock({
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      durationSeconds: exercise.durationSeconds,
      transitionSeconds: 15,
      restSeconds: 10,
      notes: '',
      section: exercise.defaultSection
    });

    const count = this.flowService.currentBlocks().length;
    const toast = await this.toastController.create({
      message: this.translate.instant('PAGES.LIBRARY.TOAST_ADDED', { name: exercise.name, count }),
      duration: 1700,
      color: 'success',
      position: 'bottom',
      buttons: [
        {
          text: this.translate.instant('PAGES.LIBRARY.TOAST_VIEW_PLAN'),
          handler: () => {
            void this.router.navigate(['/flow-builder']);
          }
        }
      ]
    });

    await toast.present();
  }

  openExercise(exerciseId: string): void {
    this.router.navigate(['/exercise', exerciseId]);
  }

  setActiveGroup(group: 'apparatus' | 'focus' | 'section' | 'level'): void {
    this.activeGroup.set(group);
  }

  private groupLabelForExercise(
    exercise: Exercise,
    group: 'apparatus' | 'focus' | 'section' | 'level'
  ): string {
    if (group === 'apparatus') {
      return exercise.apparatus;
    }

    if (group === 'focus') {
      if (this.selectedFocus() !== 'all') {
        return this.selectedFocus();
      }

      return exercise.focusAreas[0] ?? 'Other';
    }

    if (group === 'section') {
      return this.sectionLabel(exercise.defaultSection);
    }

    return this.levelLabel(exercise.level);
  }

  private levelLabel(level: Exercise['level']): string {
    if (level === 'beginner') {
      return 'Beginner';
    }

    if (level === 'intermediate') {
      return 'Intermediate';
    }

    return 'Advanced';
  }

  private sortGroupLabels(
    labels: string[],
    group: 'apparatus' | 'focus' | 'section' | 'level'
  ): string[] {
    if (group === 'section') {
      const order: Record<string, number> = { Warmup: 0, Core: 1, Cooldown: 2 };
      return labels.sort((left, right) => (order[left] ?? 99) - (order[right] ?? 99));
    }

    if (group === 'level') {
      const order: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };
      return labels.sort((left, right) => (order[left] ?? 99) - (order[right] ?? 99));
    }

    return labels.sort((left, right) => left.localeCompare(right));
  }
}
