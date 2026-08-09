import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Exercise, ExerciseCategory } from '../../models';
import { FlowService } from '../../services/flow.service';
import { LibraryService } from '../../services/library.service';

@Component({
  selector: 'app-library-page',
  standalone: true,
  imports: [IonicModule, FormsModule, TranslatePipe],
  templateUrl: './library.page.html',
  styleUrl: './library.page.scss'
})
export class LibraryPage {
  private readonly router = inject(Router);
  private readonly libraryService = inject(LibraryService);
  private readonly flowService = inject(FlowService);
  private readonly allExercises = this.libraryService.getAll();

  readonly query = signal('');
  readonly category = signal<'all' | ExerciseCategory>('all');
  readonly level = signal<'all' | Exercise['level']>('all');
  readonly section = signal<'all' | Exercise['defaultSection']>('all');
  readonly browseMode = signal<'apparatus' | 'focus'>('apparatus');
  readonly selectedApparatus = signal<string>('all');
  readonly selectedFocus = signal<string>('all');
  readonly categories = this.libraryService.getCategories();
  readonly sections: Array<'all' | Exercise['defaultSection']> = ['all', 'warmup', 'core', 'cooldown'];
  readonly apparatusOptions = ['all', ...Array.from(new Set(this.allExercises.map((exercise) => exercise.apparatus))).sort((left, right) => left.localeCompare(right))];
  readonly focusOptions = ['all', ...Array.from(new Set(this.allExercises.flatMap((exercise) => exercise.focusAreas))).sort((left, right) => left.localeCompare(right))];

  get exercises(): Exercise[] {
    const filtered = this.libraryService.filter(this.query(), this.category(), this.level(), this.section());

    if (this.browseMode() === 'apparatus' && this.selectedApparatus() !== 'all') {
      return filtered.filter((exercise) => exercise.apparatus === this.selectedApparatus());
    }

    if (this.browseMode() === 'focus' && this.selectedFocus() !== 'all') {
      return filtered.filter((exercise) => exercise.focusAreas.includes(this.selectedFocus()));
    }

    return filtered;
  }

  get resultCount(): number {
    return this.exercises.length;
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

  addExercise(exercise: Exercise): void {
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
  }

  openExercise(exerciseId: string): void {
    this.router.navigate(['/exercise', exerciseId]);
  }

  setBrowseMode(mode: 'apparatus' | 'focus'): void {
    this.browseMode.set(mode);
  }
}
