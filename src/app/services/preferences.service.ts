import { Injectable } from '@angular/core';
import { AppPreferences } from '../models';

const PREF_KEY = 'flosmith.preferences';

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'theme-coral',
  locale: 'en',
  composerMode: 'list',
  timerPresetId: 'preset-balanced'
};

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  getPreferences(): AppPreferences {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    try {
      return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<AppPreferences>) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  updatePreferences(patch: Partial<AppPreferences>): AppPreferences {
    const next = { ...this.getPreferences(), ...patch };
    localStorage.setItem(PREF_KEY, JSON.stringify(next));
    return next;
  }
}
