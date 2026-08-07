import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FlowTemplate } from '../../models';
import { FlowService } from '../../services/flow.service';
import { TemplateService } from '../../services/template.service';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-templates-page',
  standalone: true,
  imports: [IonicModule, FormsModule, TranslatePipe],
  templateUrl: './templates.page.html',
  styleUrl: './templates.page.scss'
})
export class TemplatesPage {
  private readonly router = inject(Router);
  private readonly templateService = inject(TemplateService);
  private readonly flowService = inject(FlowService);
  private readonly timerService = inject(TimerService);

  readonly searchText = signal('');

  get templates(): FlowTemplate[] {
    const query = this.searchText().trim().toLowerCase();
    if (!query) {
      return this.templateService.getAll();
    }

    return this.templateService.getAll().filter((template) =>
      template.name.toLowerCase().includes(query) ||
      (template.description ?? '').toLowerCase().includes(query) ||
      template.goal.toLowerCase().includes(query) ||
      template.apparatus.toLowerCase().includes(query) ||
      (template.accessLevel ?? '').toLowerCase().includes(query) ||
      template.focusAreas.some((area) => area.toLowerCase().includes(query)) ||
      template.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  get resultCount(): number {
    return this.templates.length;
  }

  openTemplate(templateId: string): void {
    this.router.navigate(['/programs', templateId]);
  }

  applyTemplate(templateId: string): void {
    const template = this.templateService.getById(templateId);
    if (!template) {
      return;
    }

    this.flowService.replaceCurrentFlow(template.blocks);
  }

  formatTemplateDuration(templateId: string): string {
    const template = this.templateService.getById(templateId);
    if (!template) {
      return '0:00';
    }

    return this.timerService.formatSeconds(this.timerService.calculateTotalSeconds(template.blocks));
  }

  levelColor(level: FlowTemplate['level']): 'success' | 'warning' | 'danger' {
    if (level === 'beginner') {
      return 'success';
    }

    if (level === 'intermediate') {
      return 'warning';
    }

    return 'danger';
  }

  accessColor(accessLevel?: FlowTemplate['accessLevel']): 'success' | 'medium' {
    return accessLevel === 'Free' ? 'success' : 'medium';
  }
}
