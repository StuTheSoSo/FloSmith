import { Injectable, signal } from '@angular/core';
import { FlowBlock, SavedFlow } from '../models';
import { TimerService } from './timer.service';

const SAVED_FLOWS_KEY = 'flosmith.savedFlows';

@Injectable({ providedIn: 'root' })
export class FlowService {
  readonly currentBlocks = signal<FlowBlock[]>([]);
  readonly savedFlows = signal<SavedFlow[]>(this.loadSavedFlows());

  constructor(private timerService: TimerService) {}

  addBlock(block: FlowBlock): void {
    this.currentBlocks.update((blocks) => [...blocks, block]);
  }

  removeBlock(blockId: string): void {
    this.currentBlocks.update((blocks) => blocks.filter((block) => block.id !== blockId));
  }

  updateBlock(blockId: string, patch: Partial<FlowBlock>): void {
    this.currentBlocks.update((blocks) => blocks.map((block) => block.id === blockId ? { ...block, ...patch } : block));
  }

  moveBlock(fromIndex: number, toIndex: number): void {
    this.currentBlocks.update((blocks) => {
      if (toIndex < 0 || toIndex >= blocks.length || fromIndex === toIndex) {
        return blocks;
      }

      const next = [...blocks];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  replaceCurrentFlow(blocks: FlowBlock[]): void {
    this.currentBlocks.set(blocks.map((block) => ({ ...block })));
  }

  clearCurrentFlow(): void {
    this.currentBlocks.set([]);
  }

  saveCurrentFlow(name: string, tags: string[] = []): SavedFlow {
    const now = new Date().toISOString();
    const blocks = this.currentBlocks();
    const totalDurationSeconds = this.timerService.calculateTotalSeconds(blocks);

    const flow: SavedFlow = {
      id: crypto.randomUUID(),
      name,
      tags,
      blocks: blocks.map((block) => ({ ...block })),
      totalDurationSeconds,
      createdAt: now,
      updatedAt: now
    };

    this.savedFlows.update((existing) => {
      const next = [flow, ...existing];
      this.persistSavedFlows(next);
      return next;
    });

    return flow;
  }

  deleteSavedFlow(id: string): void {
    this.savedFlows.update((existing) => {
      const next = existing.filter((flow) => flow.id !== id);
      this.persistSavedFlows(next);
      return next;
    });
  }

  duplicateSavedFlow(id: string): void {
    const original = this.savedFlows().find((flow) => flow.id === id);
    if (!original) {
      return;
    }

    const duplicated: SavedFlow = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} Copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: original.blocks.map((block) => ({ ...block, id: crypto.randomUUID() }))
    };

    this.savedFlows.update((existing) => {
      const next = [duplicated, ...existing];
      this.persistSavedFlows(next);
      return next;
    });
  }

  private loadSavedFlows(): SavedFlow[] {
    const raw = localStorage.getItem(SAVED_FLOWS_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as SavedFlow[];
    } catch {
      return [];
    }
  }

  private persistSavedFlows(flows: SavedFlow[]): void {
    localStorage.setItem(SAVED_FLOWS_KEY, JSON.stringify(flows));
  }
}
