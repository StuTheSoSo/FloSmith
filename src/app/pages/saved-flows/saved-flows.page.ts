import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FlowService } from '../../services/flow.service';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-saved-flows-page',
  standalone: true,
  imports: [IonicModule, FormsModule, TranslatePipe],
  templateUrl: './saved-flows.page.html',
  styleUrl: './saved-flows.page.scss'
})
export class SavedFlowsPage {
  private readonly flowService = inject(FlowService);
  private readonly timerService = inject(TimerService);

  readonly flowName = signal('My Class Flow');
  readonly tagsText = signal('');
  readonly flows = this.flowService.savedFlows;
  readonly currentCount = computed(() => this.flowService.currentBlocks().length);
  readonly recentFlows = computed(() => [...this.flows()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));

  saveCurrent(): void {
    const name = this.flowName().trim();
    if (!name || this.currentCount() === 0) {
      return;
    }

    const tags = this.tagsText()
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    this.flowService.saveCurrentFlow(name, tags);
    this.tagsText.set('');
  }

  delete(id: string): void {
    this.flowService.deleteSavedFlow(id);
  }

  duplicate(id: string): void {
    this.flowService.duplicateSavedFlow(id);
  }

  load(id: string): void {
    const flow = this.flows().find((item) => item.id === id);
    if (!flow) {
      return;
    }

    this.flowService.replaceCurrentFlow(flow.blocks);
  }

  format(seconds: number): string {
    return this.timerService.formatSeconds(seconds);
  }

  formatUpdatedAt(value: string): string {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
