import { Injectable } from '@angular/core';
import { FlowBlock, TimerPreset } from '../models';

@Injectable({ providedIn: 'root' })
export class TimerService {
  readonly presets: TimerPreset[] = [
    {
      id: 'preset-balanced',
      name: 'Balanced',
      defaultTransitionSeconds: 15,
      defaultRestSeconds: 10,
      roundBehavior: 'none'
    },
    {
      id: 'preset-fast',
      name: 'Fast Pace',
      defaultTransitionSeconds: 10,
      defaultRestSeconds: 5,
      roundBehavior: 'none'
    },
    {
      id: 'preset-coaching',
      name: 'Coaching Heavy',
      defaultTransitionSeconds: 25,
      defaultRestSeconds: 15,
      roundBehavior: 'none'
    }
  ];

  calculateTotalSeconds(blocks: FlowBlock[]): number {
    return blocks.reduce((sum, block) => sum + block.durationSeconds + block.transitionSeconds + block.restSeconds, 0);
  }

  formatSeconds(total: number): string {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
