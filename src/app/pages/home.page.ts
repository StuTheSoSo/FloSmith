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
          <p class="eyebrow">TODAY'S CLASS</p>
          <h2>{{ primaryActionLabel() }}</h2>
          <p>Most Pilates instructor apps follow a simple loop: choose a direction, build the class, then run it with confidence.</p>
          <div class="hero-actions">
            <ion-button size="large" routerLink="/flow-builder">{{ primaryActionLabel() }}</ion-button>
            <ion-button fill="outline" size="large" routerLink="/timer">Start Teaching View</ion-button>
          </div>
        </ion-card>

        <section class="quick-start-grid" aria-label="Primary app sections">
          <a routerLink="/programs" class="quick-start-card">
            <p>Programs</p>
            <strong>Follow structured class paths and progressions.</strong>
          </a>
          <a routerLink="/library" class="quick-start-card">
            <p>Exercise Library</p>
            <strong>Browse movements by apparatus, focus, and level.</strong>
          </a>
          <a routerLink="/saved-flows" class="quick-start-card">
            <p>Saved Classes</p>
            <strong>Reuse and adapt previous class plans quickly.</strong>
          </a>
          <a routerLink="/clients" class="quick-start-card">
            <p>Client Notes</p>
            <strong>Keep teaching context close before class starts.</strong>
          </a>
        </section>

        <section class="workflow-panel" aria-label="How to use this app">
          <header>
            <h3>Recommended Class Workflow</h3>
            <p>Mirrors the flow used in popular Pilates planning apps.</p>
          </header>
          <div class="workflow-grid">
            <a routerLink="/programs" class="workflow-step">
              <span class="step-index">1</span>
              <div>
                <strong>Choose Program Direction</strong>
                <p>Start from a ready structure when you want faster prep.</p>
              </div>
            </a>
            <a routerLink="/library" class="workflow-step">
              <span class="step-index">2</span>
              <div>
                <strong>Select or Swap Exercises</strong>
                <p>Refine the plan based on class level and equipment.</p>
              </div>
            </a>
            <a routerLink="/flow-builder" class="workflow-step primary-step">
              <span class="step-index">3</span>
              <div>
                <strong>Finalize Class Plan</strong>
                <p>Order blocks, timing, transitions, and teaching notes.</p>
              </div>
            </a>
            <a routerLink="/timer" class="workflow-step">
              <span class="step-index">4</span>
              <div>
                <strong>Teach with Timer</strong>
                <p>Run the class live and keep pacing predictable.</p>
              </div>
            </a>
          </div>
        </section>

        
        <ion-card class="workspace-card">
          <ion-card-header>
            <ion-card-title>Resume A Saved Class</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (blockCount() > 0) {
              <div class="resume-current-flow">
                <strong>Current plan in progress</strong>
                <span>{{ blockCount() }} blocks · {{ formatSeconds(currentFlowTotalSeconds()) }}</span>
                <div class="resume-current-actions">
                  <ion-button size="small" routerLink="/flow-builder">Continue Plan</ion-button>
                  <ion-button size="small" fill="outline" routerLink="/timer">Open Timer</ion-button>
                </div>
              </div>
            }

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

    .quick-start-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.65rem;
    }

    .quick-start-card {
      border-radius: 16px;
      border: 1px solid var(--flo-border);
      background: color-mix(in srgb, var(--flo-surface-b) 88%, #ffffff 12%);
      padding: 0.8rem;
      text-decoration: none;
      display: grid;
      gap: 0.28rem;
      box-shadow: 0 4px 16px rgba(23, 51, 71, 0.08);
    }

    .quick-start-card p {
      margin: 0;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--ion-color-primary);
      font-weight: 700;
    }

    .quick-start-card strong {
      color: var(--flo-brand-ink);
      font-size: 0.9rem;
      line-height: 1.35;
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

    .resume-current-flow {
      border: 1px solid var(--flo-border);
      border-radius: 14px;
      padding: 0.75rem;
      display: grid;
      gap: 0.35rem;
      background: color-mix(in srgb, var(--flo-surface-a) 88%, #ffffff 12%);
    }

    .resume-current-flow strong {
      color: var(--flo-brand-ink);
      font-size: 0.94rem;
    }

    .resume-current-flow span {
      color: var(--flo-ink-2);
      font-size: 0.84rem;
    }

    .resume-current-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.2rem;
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

    .hero-actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    @media (max-width: 760px) {
      .hero-card ion-button {
        width: 100%;
      }

      .quick-start-grid {
        grid-template-columns: 1fr;
      }

      .hero-actions {
        display: grid;
        grid-template-columns: 1fr;
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
  readonly currentFlowTotalSeconds = computed(() => this.timerService.calculateTotalSeconds(this.flowService.currentBlocks()));
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
