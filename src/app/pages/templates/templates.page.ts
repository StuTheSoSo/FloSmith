import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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
  private readonly toastController = inject(ToastController);
  private readonly translate = inject(TranslateService);
  private readonly templateService = inject(TemplateService);
  private readonly flowService = inject(FlowService);
  private readonly timerService = inject(TimerService);
  private readonly allTemplates = this.templateService.getAll();
  private readonly maxFocusFilterOptions = 8;

  readonly searchText = signal('');
  readonly applyingTemplateId = signal<string | null>(null);
  readonly appliedTemplateId = signal<string | null>(null);
  readonly filterMode = signal<'apparatus' | 'focus' | 'level'>('apparatus');
  readonly selectedApparatus = signal('all');
  readonly selectedFocus = signal('all');
  readonly selectedLevel = signal<'all' | FlowTemplate['level']>('all');
  readonly apparatusOptions = ['all', ...Array.from(new Set(this.allTemplates.map((template) => template.apparatus))).sort((a, b) => a.localeCompare(b))];
  readonly focusOptions = (() => {
    const counts = new Map<string, number>();
    for (const template of this.allTemplates) {
      for (const area of template.focusAreas) {
        counts.set(area, (counts.get(area) ?? 0) + 1);
      }
    }

    const ranked = Array.from(counts.entries())
      .sort((left, right) => {
        if (right[1] !== left[1]) {
          return right[1] - left[1];
        }

        return left[0].localeCompare(right[0]);
      })
      .slice(0, this.maxFocusFilterOptions)
      .map(([label]) => label);

    return ['all', ...ranked];
  })();

  get templates(): FlowTemplate[] {
    const query = this.searchText().trim().toLowerCase();
    const queryFiltered = this.allTemplates.filter((template) =>
      !query ||
      template.name.toLowerCase().includes(query) ||
      (template.description ?? '').toLowerCase().includes(query) ||
      template.goal.toLowerCase().includes(query) ||
      template.apparatus.toLowerCase().includes(query) ||
      // Paid-only app: keep tier-search line commented for easy restore later.
      // (template.accessLevel ?? '').toLowerCase().includes(query) ||
      template.focusAreas.some((area) => area.toLowerCase().includes(query)) ||
      template.tags.some((tag) => tag.toLowerCase().includes(query))
    );

    if (this.filterMode() === 'apparatus' && this.selectedApparatus() !== 'all') {
      return queryFiltered.filter((template) => template.apparatus === this.selectedApparatus());
    }

    if (this.filterMode() === 'focus' && this.selectedFocus() !== 'all') {
      return queryFiltered.filter((template) => template.focusAreas.includes(this.selectedFocus()));
    }

    if (this.filterMode() === 'level' && this.selectedLevel() !== 'all') {
      return queryFiltered.filter((template) => template.level === this.selectedLevel());
    }

    return queryFiltered;
  }

  get resultCount(): number {
    return this.templates.length;
  }

  openTemplate(templateId: string): void {
    this.router.navigate(['/programs', templateId]);
  }

  setFilterMode(mode: 'apparatus' | 'focus' | 'level'): void {
    this.filterMode.set(mode);
  }

  async applyTemplate(templateId: string): Promise<void> {
    if (this.applyingTemplateId() || this.appliedTemplateId()) {
      return;
    }

    const template = this.templateService.getById(templateId);
    if (!template) {
      const errorToast = await this.toastController.create({
        message: this.translate.instant('PAGES.TEMPLATES.TOAST_APPLY_ERROR'),
        duration: 1800,
        color: 'danger',
        position: 'bottom'
      });
      await errorToast.present();
      return;
    }

    this.applyingTemplateId.set(templateId);

    this.flowService.replaceCurrentFlow(template.blocks);
    this.applyingTemplateId.set(null);
    this.appliedTemplateId.set(templateId);

    const successToast = await this.toastController.create({
      message: this.translate.instant('PAGES.TEMPLATES.TOAST_APPLY_SUCCESS', { name: template.name }),
      duration: 1400,
      color: 'success',
      position: 'bottom'
    });
    await successToast.present();

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 700);
    });

    await this.router.navigate(['/flow-builder']);
    this.appliedTemplateId.set(null);
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

  // Paid-only app: keep tier color logic commented for easy restore later.
  // accessColor(accessLevel?: FlowTemplate['accessLevel']): 'success' | 'medium' {
  //   return accessLevel === 'Free' ? 'success' : 'medium';
  // }

  visibleTags(template: FlowTemplate): string[] {
    return template.tags.filter((tag) => {
      const normalized = tag.trim().toLowerCase();
      return normalized !== 'free' && normalized !== 'pro';
    });
  }

  bestFor(template: FlowTemplate): string {
    const focus = template.focusAreas.slice(0, 2).join(' + ');
    return focus
      ? `${this.translate.instant('PAGES.TEMPLATES.BEST_FOR_PREFIX')}: ${focus}`
      : `${this.translate.instant('PAGES.TEMPLATES.BEST_FOR_PREFIX')}: ${this.translate.instant('PAGES.TEMPLATES.BEST_FOR_FALLBACK')}`;
  }
}
