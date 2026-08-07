import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { LibraryService } from '../../services/library.service';
import { TemplateService } from '../../services/template.service';
import { FlowService } from '../../services/flow.service';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-program-detail-page',
  standalone: true,
  imports: [IonicModule, FormsModule, TranslatePipe],
  templateUrl: './program-detail.page.html',
  styleUrl: './program-detail.page.scss'
})
export class ProgramDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly libraryService = inject(LibraryService);
  private readonly templateService = inject(TemplateService);
  private readonly flowService = inject(FlowService);
  private readonly timerService = inject(TimerService);

  readonly templateId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly template = this.templateService.getById(this.templateId);
  readonly note = signal(this.templateService.getNote(this.templateId));
  readonly noteSaved = signal(false);
  readonly duration = computed(() => {
    if (!this.template) {
      return '0:00';
    }

    return this.timerService.formatSeconds(this.timerService.calculateTotalSeconds(this.template.blocks));
  });

  readonly stageSummary = computed(() => {
    if (!this.template) {
      return [] as string[];
    }

    const sections = Array.from(new Set(this.template.blocks.map((block) => block.section)));
    return sections.map((section) => section.charAt(0).toUpperCase() + section.slice(1));
  });

  applyTemplate(): void {
    if (!this.template) {
      return;
    }

    this.flowService.replaceCurrentFlow(this.template.blocks);
    this.router.navigateByUrl('/flow-builder');
  }

  saveNote(): void {
    this.templateService.saveNote(this.templateId, this.note().trim());
    this.noteSaved.set(true);
    setTimeout(() => this.noteSaved.set(false), 1500);
  }

  openExercise(exerciseId: string): void {
    if (!this.libraryService.findById(exerciseId)) {
      return;
    }

    this.router.navigate(['/exercise', exerciseId]);
  }
}