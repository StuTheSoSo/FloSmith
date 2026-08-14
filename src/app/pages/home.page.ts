import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FlowService } from '../services/flow.service';
import { PreferencesService } from '../services/preferences.service';
import { TimerService } from '../services/timer.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [IonicModule, RouterLink],
  template: `
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>FloSmith</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" routerLink="/settings">
            <ion-icon name="settings-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding-horizontal">
      <div class="home-shell">

        <div class="greeting">
          <p class="greeting-line">{{ greeting() }}</p>
          <p class="greeting-sub">{{ recentFlows().length === 0 ? 'Ready to build your first class?' : 'Your saved classes are below.' }}</p>
        </div>

        <ion-button expand="block" class="new-flow-btn" routerLink="/flow-builder">
          + New Flow
        </ion-button>

        @if (recentFlows().length === 0) {
          <div class="empty-flows">
            <p class="empty-copy">Build a class in <strong>Flows</strong>, then save it to find it here.</p>
          </div>
        } @else {
          <div class="flows-list">
            @for (flow of recentFlows(); track flow.id) {
              <ion-card class="flow-card">
                <ion-card-content>
                  <h2 class="flow-name">{{ flow.name }}</h2>
                  <p class="flow-meta">{{ flow.blocks.length }} exercises &middot; {{ format(flow.totalDurationSeconds) }}</p>
                  @if (flow.tags.length > 0) {
                    <p class="flow-tags">{{ flow.tags.join(' · ') }}</p>
                  }
                  <div class="flow-actions">
                    <ion-button fill="outline" size="small" (click)="edit(flow.id)">Edit</ion-button>
                    <ion-button size="small" (click)="startClass(flow.id)">Start Class</ion-button>
                    <ion-button fill="clear" size="small" color="danger" (click)="deleteFlow(flow.id)">
                      <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                    </ion-button>
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </div>
        }

      </div>
    </ion-content>
  `,
  styles: [`
    .home-shell { padding-top: 1rem; }
    .greeting { margin-bottom: 1.25rem; }
    .greeting-line { font-size: 1.5rem; font-weight: 800; color: var(--flo-ink); margin: 0 0 0.2rem; }
    .greeting-sub { font-size: 0.92rem; color: var(--flo-ink-2); margin: 0; }
    .new-flow-btn { margin-bottom: 1.25rem; --border-radius: 14px; font-weight: 800; font-size: 1rem; }
    .empty-flows { text-align: center; padding: 2rem 1rem; }
    .empty-copy { color: var(--flo-ink-2); margin: 0; }
    .flows-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .flow-card { margin: 0; }
    .flow-name { font-size: 1.1rem; font-weight: 700; margin: 0 0 0.2rem; color: var(--flo-ink); }
    .flow-meta { font-size: 0.88rem; color: var(--flo-ink-2); margin: 0 0 0.25rem; }
    .flow-tags { font-size: 0.82rem; color: var(--flo-ink-3); margin: 0 0 0.75rem; }
    .flow-actions { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem; }
    .flow-actions ion-button:last-child { margin-left: auto; }
  `]
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly flowService = inject(FlowService);
  private readonly timerService = inject(TimerService);
  private readonly preferences = inject(PreferencesService);

  readonly recentFlows = computed(() =>
    [...this.flowService.savedFlows()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );

  readonly greeting = computed(() => {
    const name = this.preferences.getPreferences().instructorName?.trim();
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return name ? `${timeGreeting}, ${name}.` : `${timeGreeting}.`;
  });

  edit(id: string): void {
    const flow = this.flowService.savedFlows().find(f => f.id === id);
    if (!flow) return;
    this.flowService.replaceCurrentFlow(flow.blocks);
    this.router.navigateByUrl('/flow-builder');
  }

  startClass(id: string): void {
    const flow = this.flowService.savedFlows().find(f => f.id === id);
    if (!flow) return;
    this.flowService.replaceCurrentFlow(flow.blocks);
    this.router.navigateByUrl('/timer');
  }

  deleteFlow(id: string): void {
    this.flowService.deleteSavedFlow(id);
  }

  format(seconds: number): string {
    return this.timerService.formatSeconds(seconds);
  }
}
