import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, RouterOutlet } from '@angular/router';
import { addIcons } from 'ionicons';
import { homeOutline, libraryOutline, listOutline, settingsOutline, trashOutline } from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from './services/language.service';
import { PreferencesService } from './services/preferences.service';

interface NavItem {
  labelKey: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, IonicModule, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);
  private readonly preferencesService = inject(PreferencesService);
  private readonly defaultTheme = 'theme-coral';
  private readonly allowedThemes = new Set(['theme-coral', 'theme-sea', 'theme-grove']);

  readonly navItems: NavItem[] = [
    { labelKey: 'NAV.HOME', path: '/', icon: 'home-outline' },
    { labelKey: 'NAV.FLOW', path: '/flow-builder', icon: 'create-outline' },
    { labelKey: 'NAV.LIBRARY', path: '/library', icon: 'library-outline' },
    { labelKey: 'NAV.TEMPLATES', path: '/programs', icon: 'list-outline' },
    { labelKey: 'NAV.SETTINGS', path: '/settings', icon: 'settings-outline' }
  ];

  constructor() {
    addIcons({
      'create-outline': listOutline,
      'home-outline': homeOutline,
      'library-outline': libraryOutline,
      'list-outline': listOutline,
      'settings-outline': settingsOutline,
      'trash-outline': trashOutline
    });

    this.languageService.init();
    this.applySavedTheme();
  }

  isTabActive(path: string): boolean {
    const url = this.router.url || '/';
    if (path === '/') {
      return url === '/';
    }

    return url === path || url.startsWith(path + '/');
  }

  navigate(path: string): void {
    this.router.navigateByUrl(path);
  }

  private applySavedTheme(): void {
    const theme = this.normalizeTheme(this.preferencesService.getPreferences().theme) ?? this.defaultTheme;
    document.documentElement.classList.remove('theme-coral', 'theme-sea', 'theme-grove');
    document.documentElement.classList.add(theme);
  }

  private normalizeTheme(value: string | null): string | null {
    if (!value) {
      return null;
    }

    return this.allowedThemes.has(value) ? value : null;
  }
}
