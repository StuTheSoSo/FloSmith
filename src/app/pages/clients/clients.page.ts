import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { ClientNotesService } from '../../services/client-notes.service';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [IonicModule, FormsModule, TranslatePipe],
  templateUrl: './clients.page.html',
  styleUrl: './clients.page.scss'
})
export class ClientsPage {
  private readonly clientNotesService = inject(ClientNotesService);

  readonly notes = this.clientNotesService.notes;
  readonly clientName = signal('');
  readonly noteText = signal('');
  readonly hasClients = computed(() => this.notes().length > 0);

  add(): void {
    const clientName = this.clientName().trim();
    const noteText = this.noteText().trim();

    if (!clientName || !noteText) {
      return;
    }

    this.clientNotesService.add(clientName, noteText);
    this.clientName.set('');
    this.noteText.set('');
  }

  remove(id: string): void {
    this.clientNotesService.remove(id);
  }
}
