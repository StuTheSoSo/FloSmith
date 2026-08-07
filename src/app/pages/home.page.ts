import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FlowService } from '../services/flow.service';
import { PreferencesService } from '../services/preferences.service';
import { TemplateService } from '../services/template.service';
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
      <ion-card class="hero-card ion-margin-bottom">
        <div>
          <h2>{{ 'PAGES.HOME.SUBTITLE' | translate }}</h2>
          <p>{{ 'PAGES.HOME.DESCRIPTION' | translate }}</p>
        </div>
        <div class="hero-actions">
          <ion-button routerLink="/flow-builder">{{ 'NAV.FLOW' | translate }}</ion-button>
          <ion-button fill="outline" routerLink="/saved-flows">{{ 'NAV.SAVED' | translate }}</ion-button>
          <ion-button fill="outline" routerLink="/timer">{{ 'NAV.TIMER' | translate }}</ion-button>
        </div>
      </ion-card>

      <div class="stats-grid">
        <article class="stat-card">
          <span>{{ 'NAV.FLOW' | translate }}</span>
          <strong>{{ blockCount() }}</strong>
        </article>
        <article class="stat-card">
          <span>{{ 'NAV.SAVED' | translate }}</span>
          <strong>{{ savedCount() }}</strong>
        </article>
        <article class="stat-card">
          <span>{{ 'NAV.TEMPLATES' | translate }}</span>
          <strong>{{ templateCount() }}</strong>
        </article>
        <article class="stat-card">
          <span>{{ 'NAV.TIMER' | translate }}</span>
          <strong>{{ totalDuration() }}</strong>
        </article>
      </div>

      <ion-card class="workspace-card">
        <ion-card-header>
          <ion-card-title>{{ 'APP.TITLE' | translate }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="quick-links">
            <a routerLink="/flow-builder" class="quick-link-card">
              <strong>{{ 'NAV.FLOW' | translate }}</strong>
              <span>{{ totalDuration() }}</span>
            </a>
            <a routerLink="/saved-flows" class="quick-link-card">
              <strong>{{ 'NAV.SAVED' | translate }}</strong>
              <span>{{ savedCount() }}</span>
            </a>
            <a routerLink="/programs" class="quick-link-card">
              <strong>{{ 'NAV.TEMPLATES' | translate }}</strong>
              <span>{{ templateCount() }}</span>
            </a>
            <a routerLink="/timer" class="quick-link-card">
              <strong>{{ 'NAV.TIMER' | translate }}</strong>
              <span>{{ activePresetLabel() }}</span>
            </a>
          </div>
          <p class="workspace-meta">{{ activeThemeLabel() }}</p>
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
      gap: 1rem;
      padding-bottom: 2rem;
      box-sizing: border-box;
    }

    .hero-card,
    .stat-card,
    .workspace-card,
    .quick-link-card {
      border-radius: 22px;
      border: 1.5px solid var(--flo-border);
      background: linear-gradient(135deg, var(--flo-surface-a) 60%, var(--flo-surface-b) 100%);
      box-shadow: 0 8px 32px rgba(23, 51, 71, 0.1);
    }

    .hero-card {
      display: grid;
      gap: 16px;
      padding: 1.7rem 1.5rem 1.5rem;
    }

    .hero-card h2 {
      margin: 0 0 0.75rem;
      font-size: 2rem;
      color: var(--ion-color-primary);
    }

    .hero-card p,
    .workspace-meta {
      margin: 0;
      color: var(--flo-brand-ink);
      line-height: 1.5;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .stat-card {
      padding: 16px;
      display: grid;
      gap: 8px;
    }

    .stat-card span {
      font-size: 0.85rem;
      color: var(--flo-ink-2);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-card strong {
      font-size: 1.5rem;
      color: var(--ion-color-primary);
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

    .workspace-card ion-card-content {
      display: grid;
      gap: 1rem;
    }

    .workspace-meta {
      color: var(--flo-ink-2);
    }
  `
})
export class HomePage {
  private readonly flowService = inject(FlowService);
  private readonly timerService = inject(TimerService);
  private readonly templateService = inject(TemplateService);
  private readonly preferencesService = inject(PreferencesService);

  readonly blockCount = computed(() => this.flowService.currentBlocks().length);
  readonly savedCount = computed(() => this.flowService.savedFlows().length);
  readonly templateCount = computed(() => this.templateService.getAll().length);
  readonly totalDuration = computed(() => this.timerService.formatSeconds(this.timerService.calculateTotalSeconds(this.flowService.currentBlocks())));
  readonly activeThemeLabel = computed(() => `Theme: ${this.preferencesService.getPreferences().theme.replace('theme-', '')}`);
  readonly activePresetLabel = computed(() => {
    const presetId = this.preferencesService.getPreferences().timerPresetId;
    const preset = this.timerService.presets.find((item) => item.id === presetId) ?? this.timerService.presets[0];
    return `Preset: ${preset.name}`;
  });
}
