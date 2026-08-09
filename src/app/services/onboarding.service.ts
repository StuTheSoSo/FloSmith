import { Injectable } from '@angular/core';

const ONBOARDING_COMPLETE_KEY = 'flosmith.onboarding.complete';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  hasCompleted(): boolean {
    return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === '1';
  }

  markComplete(): void {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, '1');
  }

  reset(): void {
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  }
}
