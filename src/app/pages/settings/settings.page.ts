import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { OnboardingService } from '../../services/onboarding.service';
import { PreferencesService } from '../../services/preferences.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [IonicModule, TranslatePipe],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss'
})
export class SettingsPage {
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);
  private readonly preferences = inject(PreferencesService);
  private readonly onboarding = inject(OnboardingService);

  readonly locales = this.languageService.supportedLocales;
  readonly locale = signal(this.preferences.getPreferences().locale);
  readonly theme = signal(this.preferences.getPreferences().theme);
  readonly savedEmail = signal(localStorage.getItem('flosmith.email') ?? '');
  readonly emailInput = signal(this.savedEmail());
  readonly instructorName = signal(this.preferences.getPreferences().instructorName ?? '');
  readonly nameSaved = signal(false);

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

  saveName(): void {
    this.preferences.updatePreferences({ instructorName: this.instructorName().trim() });
    this.nameSaved.set(true);
    setTimeout(() => this.nameSaved.set(false), 2000);
  }

  openHelpCenter(): void {
    this.router.navigateByUrl('/help');
  }

  restartTutorial(): void {
    this.onboarding.reset();
    this.router.navigateByUrl('/welcome');
  }
}
