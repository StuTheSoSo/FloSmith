import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, RouterOutlet } from '@angular/router';
import { addIcons } from 'ionicons';
import { homeOutline, layersOutline, barbellOutline, albumsOutline, settingsOutline, trashOutline } from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from './services/language.service';
import { OnboardingService } from './services/onboarding.service';
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
  private readonly onboarding = inject(OnboardingService);
  private readonly defaultTheme = 'theme-coral';
  private readonly allowedThemes = new Set(['theme-coral', 'theme-sea', 'theme-grove']);

  readonly navItems: NavItem[] = [
    { labelKey: 'NAV.HOME',      path: '/',        icon: 'home-outline'    },
    { labelKey: 'NAV.FLOW',      path: '/flows',   icon: 'layers-outline'  },
    { labelKey: 'NAV.LIBRARY',   path: '/library', icon: 'barbell-outline' },
    { labelKey: 'NAV.TEMPLATES', path: '/programs',icon: 'albums-outline'  },
  ];

  constructor() {
    addIcons({
      'albums-outline': albumsOutline,
      'barbell-outline': barbellOutline,
      'home-outline': homeOutline,
      'layers-outline': layersOutline,
      'settings-outline': settingsOutline,
      'trash-outline': trashOutline
    });

    this.languageService.init();
    this.applySavedTheme();

    if (!this.onboarding.hasCompleted()) {
      queueMicrotask(() => {
        this.router.navigateByUrl('/welcome');
      });
    }
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

  isPrimaryNavVisible(): boolean {
    const url = this.router.url || '/';
    return !url.startsWith('/welcome');
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
