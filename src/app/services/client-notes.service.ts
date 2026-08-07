import { Injectable, signal } from '@angular/core';
import { ClientNote } from '../models';

const CLIENT_NOTES_KEY = 'flosmith.clientNotes';

@Injectable({ providedIn: 'root' })
export class ClientNotesService {
  readonly notes = signal<ClientNote[]>(this.load());

  add(clientName: string, noteText: string): void {
    const note: ClientNote = {
      id: crypto.randomUUID(),
      clientName,
      note: noteText,
      flags: [],
      updatedAt: new Date().toISOString()
    };

    this.notes.update((existing) => {
      const next = [note, ...existing];
      this.persist(next);
      return next;
    });
  }

  remove(id: string): void {
    this.notes.update((existing) => {
      const next = existing.filter((note) => note.id !== id);
      this.persist(next);
      return next;
    });
  }

  private load(): ClientNote[] {
    const raw = localStorage.getItem(CLIENT_NOTES_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as ClientNote[];
    } catch {
      return [];
    }
  }

  private persist(notes: ClientNote[]): void {
    localStorage.setItem(CLIENT_NOTES_KEY, JSON.stringify(notes));
  }
}
