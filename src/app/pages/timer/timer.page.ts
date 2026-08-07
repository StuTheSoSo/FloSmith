import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FlowService } from '../../services/flow.service';
import { PreferencesService } from '../../services/preferences.service';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-timer-page',
  standalone: true,
  imports: [IonicModule, FormsModule, TranslatePipe],
  templateUrl: './timer.page.html',
  styleUrl: './timer.page.scss'
})
export class TimerPage {
  private readonly timerService = inject(TimerService);
  private readonly flowService = inject(FlowService);
  private readonly preferences = inject(PreferencesService);

  readonly presets = this.timerService.presets;
  readonly selectedPresetId = signal(this.preferences.getPreferences().timerPresetId);

  readonly totalLabel = computed(() => {
    const total = this.timerService.calculateTotalSeconds(this.flowService.currentBlocks());
    return this.timerService.formatSeconds(total);
  });

  readonly selectedPreset = computed(() => {
    return this.presets.find((preset) => preset.id === this.selectedPresetId()) ?? this.presets[0];
  });

  updatePreset(id: string): void {
    this.selectedPresetId.set(id);
    this.preferences.updatePreferences({ timerPresetId: id });
  }
}
