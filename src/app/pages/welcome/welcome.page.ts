import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { OnboardingService } from '../../services/onboarding.service';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './welcome.page.html',
  styleUrl: './welcome.page.scss'
})
export class WelcomePage {
  private readonly router = inject(Router);
  private readonly onboarding = inject(OnboardingService);

  readonly stepIndex = signal(0);
  readonly steps = [
    {
      title: 'Welcome to FloSmith',
      subtitle: 'Plan classes in one place.',
      detail: 'Build, load, and run classes with clear timing cues.',
      points: ['Build one class at a time with less friction', 'Use repeatable plans without losing flexibility', 'Teach with timing confidence in live sessions']
    },
    {
      title: 'Step 1: Build Class Plan',
      subtitle: 'Add and arrange exercises.',
      detail: 'Open Class Plan, search, and tap to add.',
      points: ['Use quick add to build faster', 'Reorder blocks before class starts', 'Start class directly from Class Plan']
    },
    {
      title: 'Step 2: Use Exercises and Programs',
      subtitle: 'Choose precision or speed.',
      detail: 'Exercises adds one-by-one. Programs loads a full sequence.',
      points: ['Exercises is best for custom sequences', 'Programs is best for prebuilt full classes', 'Both feed directly into your active plan']
    },
    {
      title: 'Step 3: Start Class',
      subtitle: 'Teach with timer cues.',
      detail: 'Tap Start Class to run cues and use outline jumps.',
      points: ['Follow exercise, transition, and rest phases', 'Use now and next cues while teaching', 'Jump in the outline when you need to adapt live']
    }
  ];

  currentStep() {
    return this.steps[this.stepIndex()];
  }

  isLastStep(): boolean {
    return this.stepIndex() >= this.steps.length - 1;
  }

  nextStep(): void {
    this.stepIndex.update((value) => Math.min(value + 1, this.steps.length - 1));
  }

  previousStep(): void {
    this.stepIndex.update((value) => Math.max(value - 1, 0));
  }

  skip(): void {
    this.onboarding.markComplete();
    this.router.navigateByUrl('/');
  }

  finish(): void {
    this.onboarding.markComplete();
    this.router.navigateByUrl('/flow-builder');
  }
}
