import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FlowService } from '../services/flow.service';
import { OnboardingService } from '../services/onboarding.service';
import { TimerService } from '../services/timer.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [IonicModule, RouterLink, TranslatePipe],
  template: `
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>{{ 'PAGES.HOME.TITLE' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <div class="home-content ion-padding-horizontal">
        <ion-card class="hero-card">
          <p class="eyebrow">START HERE</p>
          <h2>{{ primaryActionLabel() }}</h2>
          <p>Use the 3 steps below to plan and run a class.</p>
          <ion-button size="large" routerLink="/flow-builder">{{ primaryActionLabel() }}</ion-button>
        </ion-card>

        <section class="workflow-panel" aria-label="How to use this app">
          <header>
            <h3>How To Use FloSmith</h3>
            <p>Follow these steps in order for each class.</p>
          </header>
          <div class="workflow-grid">
            <a routerLink="/flow-builder" class="workflow-step primary-step">
              <span class="step-index">1</span>
              <div>
                <strong>Build Class Flow</strong>
                <p>Add and order exercises for today’s class.</p>
              </div>
            </a>
            <a routerLink="/programs" class="workflow-step">
              <span class="step-index">2</span>
              <div>
                <strong>Load a Program (Optional)</strong>
                <p>Start from a template if you do not want to build from scratch.</p>
              </div>
            </a>
            <a routerLink="/timer" class="workflow-step">
              <span class="step-index">3</span>
              <div>
                <strong>Run Timer</strong>
                <p>Use timing and transitions while teaching.</p>
              </div>
            </a>
          </div>
        </section>

        
        <ion-card class="workspace-card">
          <ion-card-header>
            <ion-card-title>Resume A Saved Class</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (recentSavedFlows().length === 0) {
              <p class="recent-empty">No saved classes yet. Build your first class flow, then save it in Saved Flows.</p>
            } @else {
              <div class="recent-flow-list">
                @for (flow of recentSavedFlows(); track flow.id) {
                  <button class="recent-flow-item" (click)="loadSavedFlow(flow.id)">
                    <strong>{{ flow.name }}</strong>
                    <span>{{ flow.blocks.length }} blocks · {{ formatSeconds(flow.totalDurationSeconds) }}</span>
                  </button>
                }
              </div>
            }
            <ion-button fill="clear" routerLink="/saved-flows">Open Saved Flows</ion-button>
          </ion-card-content>
        </ion-card>

        <ion-card class="help-card">
          <ion-card-header>
            <ion-card-title>Need a quick refresher?</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Open Help Center or replay the tutorial.</p>
            <div class="help-actions">
              <ion-button fill="outline" (click)="openHelpCenter()">Open Help Center</ion-button>
              <ion-button (click)="restartTutorial()">Run Tutorial</ion-button>
            </div>
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
    .workflow-panel {
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

    .primary-step {
      border-color: color-mix(in srgb, var(--ion-color-primary) 45%, var(--flo-border) 55%);
      background: linear-gradient(140deg, color-mix(in srgb, var(--ion-color-primary) 8%, #ffffff 92%), var(--flo-surface-a));
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

    .workspace-card {
      border-radius: 22px;
    }

    .help-card {
      border-radius: 22px;
    }

    .help-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      margin-top: 0.8rem;
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

    @media (max-width: 760px) {
      .hero-card ion-button {
        width: 100%;
      }

      .help-actions ion-button {
        width: 100%;
      }
    }

  `
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly flowService = inject(FlowService);
  private readonly timerService = inject(TimerService);
  private readonly onboarding = inject(OnboardingService);

  readonly blockCount = computed(() => this.flowService.currentBlocks().length);
  readonly primaryActionLabel = computed(() => this.blockCount() > 0 ? 'Continue Current Flow' : 'Start New Flow');
  readonly recentSavedFlows = computed(() => [...this.flowService.savedFlows()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 3));

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

  openHelpCenter(): void {
    this.router.navigateByUrl('/help');
  }

  restartTutorial(): void {
    this.onboarding.reset();
    this.router.navigateByUrl('/welcome');
  }
}
