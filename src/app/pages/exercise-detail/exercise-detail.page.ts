import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FlowService } from '../../services/flow.service';
import { LibraryService } from '../../services/library.service';

@Component({
  selector: 'app-exercise-detail-page',
  standalone: true,
  imports: [IonicModule, TranslatePipe],
  templateUrl: './exercise-detail.page.html',
  styleUrl: './exercise-detail.page.scss'
})
export class ExerciseDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly libraryService = inject(LibraryService);
  private readonly flowService = inject(FlowService);

  readonly exerciseId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly exercise = this.libraryService.findById(this.exerciseId);

  addToFlow(): void {
    if (!this.exercise) {
      return;
    }

    this.flowService.addBlock({
      id: crypto.randomUUID(),
      exerciseId: this.exercise.id,
      exerciseName: this.exercise.name,
      durationSeconds: this.exercise.durationSeconds,
      transitionSeconds: 15,
      restSeconds: 10,
      notes: '',
      section: this.exercise.defaultSection
    });
  }
}