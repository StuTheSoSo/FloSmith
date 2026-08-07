import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { PreferencesService } from './preferences.service';

interface LocaleConfig {
  code: string;
  label: string;
  rtl: boolean;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly supportedLocales: LocaleConfig[] = [
    { code: 'en', label: 'English', rtl: false },
    { code: 'es', label: 'Espanol', rtl: false },
    { code: 'fr', label: 'Francais', rtl: false },
    { code: 'de', label: 'Deutsch', rtl: false },
    { code: 'pt', label: 'Portugues', rtl: false },
    { code: 'it', label: 'Italiano', rtl: false },
    { code: 'ja', label: 'Japanese', rtl: false },
    { code: 'zh-Hans', label: 'Chinese (Simplified)', rtl: false },
    { code: 'ar', label: 'Arabic', rtl: true }
  ];

  readonly currentLocale = signal('en');
  readonly languageChange$ = new Subject<string>();

  constructor(
    private translate: TranslateService,
    private preferences: PreferencesService
  ) {}

  init(): void {
    this.translate.addLangs(this.supportedLocales.map((locale) => locale.code));
    const preferred = this.preferences.getPreferences().locale;
    const browser = navigator.language;
    const resolved = this.resolveLocale(preferred || browser || 'en');
    this.setLocale(resolved);
  }

  setLocale(code: string): void {
    const resolved = this.resolveLocale(code);
    const locale = this.supportedLocales.find((item) => item.code === resolved) ?? this.supportedLocales[0];

    this.currentLocale.set(locale.code);
    this.translate.use(locale.code);
    this.preferences.updatePreferences({ locale: locale.code });

    document.documentElement.setAttribute('lang', locale.code);
    document.documentElement.setAttribute('dir', locale.rtl ? 'rtl' : 'ltr');

    this.languageChange$.next(locale.code);
  }

  private resolveLocale(code: string): string {
    if (this.supportedLocales.some((item) => item.code === code)) {
      return code;
    }

    const lower = code.toLowerCase();
    const prefixMatch = this.supportedLocales.find((item) => lower.startsWith(item.code.toLowerCase()));
    return prefixMatch?.code ?? 'en';
  }
}
