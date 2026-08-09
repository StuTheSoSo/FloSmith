import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FlowService } from '../services/flow.service';
import { PreferencesService } from '../services/preferences.service';
import { TemplateService } from '../services/template.service';
import { TimerService } from '../services/timer.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [IonicModule, RouterLink, DatePipe, TranslatePipe],
  template: `
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>{{ 'PAGES.HOME.TITLE' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <div class="home-content ion-padding-horizontal">
        <ion-card class="hero-card">
          <p class="eyebrow">TODAY'S STUDIO</p>
          <h2>Plan polished sessions, faster.</h2>
          <p>Build focused classes, adapt for client needs, and deliver with confidence from one workspace.</p>

          <div class="hero-primary">
            <ion-button size="large" routerLink="/flow-builder">{{ primaryActionLabel() }}</ion-button>
            <ion-button fill="clear" routerLink="/programs">Browse Programs</ion-button>
          </div>

          <div class="hero-status">
            <div class="status-pill">
              <span>Current Flow</span>
              <strong>{{ flowStatusLabel() }}</strong>
            </div>
            <div class="status-pill">
              <span>Duration</span>
              <strong>{{ totalDuration() }}</strong>
            </div>
            <div class="status-pill">
              <span>Timer</span>
              <strong>{{ activePresetLabel() }}</strong>
            </div>
          </div>

          @if (isFirstSession()) {
            <div class="context-banner">
              <p class="context-title">New here? Start in under 60 seconds.</p>
              <p class="context-copy">Create your first flow, then save it so you can reuse and adjust it per client.</p>
            </div>
          } @else if (needsResumePrompt()) {
            <div class="context-banner">
              <p class="context-title">Welcome back. Your class library is ready.</p>
              <p class="context-copy">Load a saved class or start a new flow from your program templates.</p>
            </div>
          }
        </ion-card>

        <section class="workflow-panel">
          <header>
            <h3>Your Session Workflow</h3>
            <p>Follow this sequence to move from plan to delivery with fewer taps.</p>
          </header>
          <div class="workflow-grid">
            <a routerLink="/flow-builder" class="workflow-step">
              <span class="step-index">1</span>
              <div>
                <strong>Build the Sequence</strong>
                <p>Add and reorder exercises for today.</p>
              </div>
            </a>
            <a routerLink="/programs" class="workflow-step">
              <span class="step-index">2</span>
              <div>
                <strong>Apply a Program</strong>
                <p>Start from proven templates when needed.</p>
              </div>
            </a>
            <a routerLink="/timer" class="workflow-step">
              <span class="step-index">3</span>
              <div>
                <strong>Lead with Timer</strong>
                <p>Keep pacing crisp with transitions and rests.</p>
              </div>
            </a>
          </div>
        </section>

        <div class="stats-grid">
          <article class="stat-card">
            <span>Exercises in Current Flow</span>
            <strong>{{ blockCount() }}</strong>
          </article>
          <article class="stat-card">
            <span>Saved Classes</span>
            <strong>{{ savedCount() }}</strong>
          </article>
          <article class="stat-card">
            <span>Program Library</span>
            <strong>{{ templateCount() }}</strong>
          </article>
          <article class="stat-card">
            <span>Workspace Theme</span>
            <strong>{{ activeThemeLabel() }}</strong>
          </article>
        </div>

        <ion-card class="workspace-card">
          <ion-card-header>
            <ion-card-title>Quick Actions</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="quick-links">
              <a routerLink="/flow-builder" class="quick-link-card">
                <strong>{{ 'NAV.FLOW' | translate }}</strong>
                <span>{{ flowLinkHint() }}</span>
              </a>
              <a routerLink="/clients" class="quick-link-card">
                <strong>{{ 'NAV.CLIENTS' | translate }}</strong>
                <span>Keep private notes and flags</span>
              </a>
              <a routerLink="/saved-flows" class="quick-link-card">
                <strong>{{ 'NAV.SAVED' | translate }}</strong>
                <span>{{ savedCount() }} saved</span>
              </a>
              <a routerLink="/programs" class="quick-link-card">
                <strong>{{ 'NAV.TEMPLATES' | translate }}</strong>
                <span>{{ templateCount() }} templates</span>
              </a>
              <a routerLink="/library" class="quick-link-card">
                <strong>{{ 'NAV.LIBRARY' | translate }}</strong>
                <span>Find precise cues and regressions</span>
              </a>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="workspace-card">
          <ion-card-header>
            <ion-card-title>Recent Saved Classes</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (recentSavedFlows().length === 0) {
              <p class="recent-empty">No saved classes yet. Save today’s flow to build your reusable class library.</p>
            } @else {
              <div class="recent-flow-list">
                @for (flow of recentSavedFlows(); track flow.id) {
                  <button class="recent-flow-item" (click)="loadSavedFlow(flow.id)">
                    <strong>{{ flow.name }}</strong>
                    <span>{{ flow.blocks.length }} blocks · {{ formatSeconds(flow.totalDurationSeconds) }}</span>
                    <span class="meta-line">Updated {{ flow.updatedAt | date:'MMM d' }}</span>
                  </button>
                }
              </div>
            }
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: `
    .home-content {
      width: min(980px, 100%);
      max-width: 980px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      padding-bottom: 2.4rem;
      box-sizing: border-box;
    }

    .hero-card,
    .workflow-panel,
    .stat-card,
    .quick-link-card {
      border-radius: 22px;
      border: 1.5px solid var(--flo-border);
      background: linear-gradient(135deg, var(--flo-surface-a) 60%, var(--flo-surface-b) 100%);
      box-shadow: 0 8px 32px rgba(23, 51, 71, 0.1);
    }

    .hero-card {
      display: flex;
      flex-direction: column;
      gap: 0.95rem;
      padding: 1.5rem;
    }

    .eyebrow {
      margin: 0;
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--flo-ink-2);
      font-weight: 800;
    }

    .hero-card h2 {
      margin: 0;
      font-size: clamp(1.55rem, 3.8vw, 2rem);
      line-height: 1.15;
      color: var(--ion-color-primary);
    }

    .hero-card p {
      margin: 0;
      color: var(--flo-brand-ink);
      line-height: 1.5;
    }

    .hero-primary {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      margin-top: 0.2rem;
    }

    .hero-status {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.6rem;
    }

    .context-banner {
      border-radius: 14px;
      border: 1px solid var(--flo-border);
      padding: 0.75rem 0.85rem;
      display: grid;
      gap: 0.2rem;
      background: linear-gradient(120deg, color-mix(in srgb, var(--ion-color-secondary) 16%, #ffffff 84%), #ffffff);
    }

    .context-title {
      margin: 0;
      font-weight: 800;
      color: var(--flo-brand-ink);
      font-size: 0.9rem;
    }

    .context-copy {
      margin: 0;
      font-size: 0.84rem;
      color: var(--flo-ink-2);
    }

    .status-pill {
      border-radius: 14px;
      padding: 0.65rem 0.75rem;
      background: color-mix(in srgb, var(--flo-chip) 82%, #ffffff 18%);
      border: 1px solid var(--flo-border);
      display: grid;
      gap: 0.18rem;
    }

    .status-pill span {
      color: var(--flo-ink-2);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }

    .status-pill strong {
      color: var(--flo-brand-ink);
      font-size: 0.93rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .workflow-panel {
      padding: 1.1rem;
      display: grid;
      gap: 0.85rem;
    }

    .workflow-panel h3 {
      margin: 0;
      color: var(--ion-color-primary);
      font-size: 1.05rem;
    }

    .workflow-panel p {
      margin: 0.25rem 0 0;
      color: var(--flo-ink-2);
      font-size: 0.9rem;
    }

    .workflow-grid {
      display: grid;
      gap: 0.6rem;
    }

    .workflow-step {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.75rem;
      text-decoration: none;
      border-radius: 16px;
      border: 1px solid var(--flo-border);
      padding: 0.75rem;
      background: color-mix(in srgb, var(--flo-surface-b) 86%, #ffffff 14%);
    }

    .step-index {
      width: 30px;
      height: 30px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: linear-gradient(120deg, var(--ion-color-primary), var(--ion-color-tertiary));
      color: #fff;
      font-weight: 800;
      font-size: 0.82rem;
    }

    .workflow-step strong {
      color: var(--flo-brand-ink);
      font-size: 0.96rem;
    }

    .workflow-step p {
      margin: 0.16rem 0 0;
      font-size: 0.84rem;
      color: var(--flo-ink-2);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .stat-card {
      padding: 0.95rem;
      display: grid;
      gap: 0.35rem;
    }

    .stat-card span {
      font-size: 0.78rem;
      color: var(--flo-ink-2);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
    }

    .stat-card strong {
      font-size: clamp(1.05rem, 3vw, 1.45rem);
      color: var(--ion-color-primary);
      line-height: 1.2;
    }

    .quick-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.85rem;
    }

    .quick-link-card {
      display: grid;
      gap: 0.4rem;
      padding: 1rem 1.1rem;
      text-decoration: none;
      color: var(--flo-brand-ink);
    }

    .quick-link-card strong {
      color: var(--ion-color-primary);
    }

    .quick-link-card span {
      color: var(--flo-ink-2);
    }

    .workspace-card {
      border-radius: 22px;
    }

    .workspace-card ion-card-content {
      display: grid;
      gap: 0.9rem;
    }

    .recent-empty {
      margin: 0;
      color: var(--flo-ink-2);
      font-weight: 600;
    }

    .recent-flow-list {
      display: grid;
      gap: 0.55rem;
    }

    .recent-flow-item {
      border: 1px solid var(--flo-border);
      background: color-mix(in srgb, var(--flo-surface-b) 78%, #ffffff 22%);
      color: var(--flo-brand-ink);
      border-radius: 14px;
      padding: 0.7rem 0.8rem;
      text-align: left;
      display: grid;
      gap: 0.15rem;
    }

    .recent-flow-item strong {
      font-size: 0.95rem;
    }

    .recent-flow-item span {
      color: var(--flo-ink-2);
      font-size: 0.83rem;
    }

    .meta-line {
      font-size: 0.78rem;
    }

    @media (max-width: 760px) {
      .hero-status {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .hero-primary ion-button {
        width: 100%;
      }
    }

  `
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly flowService = inject(FlowService);
  private readonly timerService = inject(TimerService);
  private readonly templateService = inject(TemplateService);
  private readonly preferencesService = inject(PreferencesService);

  readonly blockCount = computed(() => this.flowService.currentBlocks().length);
  readonly savedCount = computed(() => this.flowService.savedFlows().length);
  readonly templateCount = computed(() => this.templateService.getAll().length);
  readonly totalDuration = computed(() => this.timerService.formatSeconds(this.timerService.calculateTotalSeconds(this.flowService.currentBlocks())));
  readonly activeThemeLabel = computed(() => this.preferencesService.getPreferences().theme.replace('theme-', ''));
  readonly activePresetLabel = computed(() => {
    const presetId = this.preferencesService.getPreferences().timerPresetId;
    const preset = this.timerService.presets.find((item) => item.id === presetId) ?? this.timerService.presets[0];
    return preset.name;
  });
  readonly primaryActionLabel = computed(() => this.blockCount() > 0 ? 'Continue Current Flow' : 'Start New Flow');
  readonly flowStatusLabel = computed(() => this.blockCount() > 0 ? `${this.blockCount()} exercises` : 'Not started');
  readonly flowLinkHint = computed(() => this.blockCount() > 0 ? `${this.blockCount()} exercises • ${this.totalDuration()}` : 'Start from scratch');
  readonly recentSavedFlows = computed(() => [...this.flowService.savedFlows()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 3));
  readonly isFirstSession = computed(() => this.savedCount() === 0 && this.blockCount() === 0);
  readonly needsResumePrompt = computed(() => this.savedCount() > 0 && this.blockCount() === 0);

  formatSeconds(value: number): string {
    return this.timerService.formatSeconds(value);
  }

  loadSavedFlow(id: string): void {
    const flow = this.flowService.savedFlows().find((item) => item.id === id);
    if (!flow) {
      return;
    }

    this.flowService.replaceCurrentFlow(flow.blocks);
    this.router.navigateByUrl('/flow-builder');
  }
}
