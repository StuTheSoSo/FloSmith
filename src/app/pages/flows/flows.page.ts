import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FlowTemplate, SavedFlow } from '../../models';
import { FlowService } from '../../services/flow.service';
import { TemplateService } from '../../services/template.service';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-flows-page',
  standalone: true,
  imports: [IonicModule, RouterLink],
  template: `
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Flows</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding-horizontal">
      <div class="flows-shell">

        <ion-button expand="block" class="new-flow-btn" (click)="buildNew()">
          + Build New Flow
        </ion-button>

        <!-- MY FLOWS -->
        @if (savedFlows().length > 0) {
          <div class="section-header">
            <h3>My Flows</h3>
          </div>
          <div class="flow-list">
            @for (flow of savedFlows(); track flow.id) {
              <ion-card class="flow-card">
                <ion-card-content>
                  <div class="flow-info">
                    <h4>{{ flow.name }}</h4>
                    <p>{{ flow.blocks.length }} exercises · {{ format(flow.totalDurationSeconds) }}</p>
                    @if (flow.tags.length > 0) {
                      <p class="tags">{{ flow.tags.join(' · ') }}</p>
                    }
                  </div>
                  <div class="flow-actions">
                    <ion-button fill="outline" size="small" (click)="editSaved(flow)">Edit</ion-button>
                    <ion-button size="small" (click)="startSaved(flow)">▶ Start</ion-button>
                    <ion-button fill="clear" size="small" color="danger" (click)="deleteSaved(flow.id)">
                      <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                    </ion-button>
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </div>
        }

        <!-- PRE-BUILT PROGRAMS -->
        <div class="section-header">
          <h3>Pre-built Programs</h3>
          <ion-searchbar
            [value]="query()"
            (ionInput)="query.set($any($event).detail.value ?? '')"
            placeholder="Search programs…"
            class="program-search"
          ></ion-searchbar>
        </div>
        <div class="flow-list">
          @for (t of filteredTemplates(); track t.id) {
            <ion-card class="flow-card" (click)="viewTemplate(t)" button>
              <ion-card-content>
                <div class="flow-info">
                  <h4>{{ t.name }}</h4>
                  <p>{{ t.level }} · {{ t.apparatus }} · {{ formatTemplate(t) }}</p>
                  @if (t.focusAreas?.length) {
                    <p class="tags">{{ t.focusAreas.join(' · ') }}</p>
                  }
                </div>
                <div class="flow-actions">
                  <ion-button fill="clear" size="small" (click)="$event.stopPropagation(); loadTemplate(t)">Load</ion-button>
                  <ion-button size="small" (click)="$event.stopPropagation(); startTemplate(t)">▶ Start</ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          }
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    .flows-shell { padding-top: 1rem; padding-bottom: 2rem; }
    .new-flow-btn { margin-bottom: 1.5rem; --border-radius: 14px; font-weight: 800; font-size: 1rem; }
    .section-header { margin: 1.25rem 0 0.5rem; }
    .section-header h3 { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 800; color: var(--flo-ink-2); text-transform: uppercase; letter-spacing: 0.08em; }
    .program-search { --background: transparent; padding: 0; margin: 0; }
    .flow-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .flow-card { margin: 0; }
    ion-card-content { display: flex; flex-direction: column; gap: 0.4rem; }
    .flow-info h4 { margin: 0 0 0.15rem; font-size: 1rem; font-weight: 700; color: var(--flo-ink); }
    .flow-info p { margin: 0; font-size: 0.85rem; color: var(--flo-ink-2); }
    .tags { font-size: 0.8rem !important; color: var(--flo-ink-3) !important; }
    .flow-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .flow-actions ion-button:last-child { margin-left: auto; }
  `]
})
export class FlowsPage {
  private readonly router = inject(Router);
  private readonly flowService = inject(FlowService);
  private readonly templateService = inject(TemplateService);
  private readonly timerService = inject(TimerService);

  readonly query = signal('');

  readonly savedFlows = computed(() =>
    [...this.flowService.savedFlows()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );

  readonly filteredTemplates = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.templateService.getAll().filter(t =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.apparatus.toLowerCase().includes(q) ||
      t.level.toLowerCase().includes(q) ||
      t.focusAreas?.some(f => f.toLowerCase().includes(q))
    );
  });

  buildNew(): void {
    this.flowService.clearCurrentFlow();
    this.router.navigateByUrl('/');
  }

  editSaved(flow: SavedFlow): void {
    this.flowService.replaceCurrentFlow(flow.blocks);
    this.router.navigateByUrl('/');
  }

  startSaved(flow: SavedFlow): void {
    this.flowService.replaceCurrentFlow(flow.blocks);
    this.router.navigateByUrl('/timer');
  }

  deleteSaved(id: string): void {
    this.flowService.deleteSavedFlow(id);
  }

  loadTemplate(t: FlowTemplate): void {
    this.flowService.replaceCurrentFlow(t.blocks);
    this.router.navigateByUrl('/');
  }

  viewTemplate(t: FlowTemplate): void {
    this.router.navigate(['/programs', t.id]);
  }

  startTemplate(t: FlowTemplate): void {
    this.flowService.replaceCurrentFlow(t.blocks);
    this.router.navigateByUrl('/timer');
  }

  format(seconds: number): string {
    return this.timerService.formatSeconds(seconds);
  }

  formatTemplate(t: FlowTemplate): string {
    const dur = t.blocks?.reduce((s, b) => s + (b.durationSeconds ?? 0) + (b.transitionSeconds ?? 0) + (b.restSeconds ?? 0), 0) ?? 0;
    return dur ? this.timerService.formatSeconds(dur) : '';
  }
}
