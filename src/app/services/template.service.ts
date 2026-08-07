import { Injectable } from '@angular/core';
import templatesData from '../../assets/data/templates.json';
import { FlowTemplate } from '../models';

const TEMPLATE_NOTES_KEY = 'flosmith.templateNotes';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly templates = templatesData as FlowTemplate[];

  getAll(): FlowTemplate[] {
    return this.templates;
  }

  getById(id: string): FlowTemplate | undefined {
    return this.templates.find((template) => template.id === id);
  }

  getNote(id: string): string {
    const notes = this.loadNotes();
    return notes[id] ?? '';
  }

  saveNote(id: string, note: string): void {
    const next = {
      ...this.loadNotes(),
      [id]: note
    };

    localStorage.setItem(TEMPLATE_NOTES_KEY, JSON.stringify(next));
  }

  private loadNotes(): Record<string, string> {
    const raw = localStorage.getItem(TEMPLATE_NOTES_KEY);
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return {};
    }
  }
}
