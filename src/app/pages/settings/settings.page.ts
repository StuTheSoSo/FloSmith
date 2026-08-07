import { Component, inject, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { PreferencesService } from '../../services/preferences.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [IonicModule, TranslatePipe],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss'
})
export class SettingsPage {
  private readonly languageService = inject(LanguageService);
  private readonly preferences = inject(PreferencesService);

  readonly locales = this.languageService.supportedLocales;
  readonly locale = signal(this.preferences.getPreferences().locale);
  readonly theme = signal(this.preferences.getPreferences().theme);
  readonly savedEmail = signal(localStorage.getItem('flosmith.email') ?? '');
  readonly emailInput = signal(this.savedEmail());

  readonly themes = [
    { value: 'theme-coral', label: 'Coral' },
    { value: 'theme-sea', label: 'Sea' },
    { value: 'theme-grove', label: 'Grove' }
  ];

  setLocale(value: string): void {
    this.locale.set(value);
    this.languageService.setLocale(value);
  }

  setTheme(value: string): void {
    this.theme.set(value);
    this.preferences.updatePreferences({ theme: value });
    document.documentElement.classList.remove('theme-coral', 'theme-sea', 'theme-grove');
    document.documentElement.classList.add(value);
  }

  saveEmail(): void {
    const email = this.emailInput().trim();
    localStorage.setItem('flosmith.email', email);
    this.savedEmail.set(email);
  }
}
