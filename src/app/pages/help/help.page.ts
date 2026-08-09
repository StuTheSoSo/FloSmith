import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { OnboardingService } from '../../services/onboarding.service';

interface LearningModule {
  id: string;
  title: string;
  purpose: string;
  skills: string[];
  actionLabel: string;
  actionRoute: string;
}

interface WorkflowGuide {
  id: string;
  title: string;
  goal: string;
  steps: string[];
  actionLabel: string;
  actionRoute: string;
}

interface HelpFaq {
  id: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [IonicModule, RouterLink],
  templateUrl: './help.page.html',
  styleUrl: './help.page.scss'
})
export class HelpPage {
  private readonly router = inject(Router);
  private readonly onboarding = inject(OnboardingService);

  readonly learningModules: LearningModule[] = [
    {
      id: 'home',
      title: 'Home: Start your day quickly',
      purpose: 'Use Home as your command center before class starts.',
      skills: [
        'Resume recent saved classes in one tap.',
        'Jump into Class Plan to build a new session.',
        'Use Help and Tutorial links whenever you need a refresher.'
      ],
      actionLabel: 'Open Home',
      actionRoute: '/'
    },
    {
      id: 'flow',
      title: 'Class Plan: Build the sequence',
      purpose: 'Assemble and reorder today\'s class before teaching.',
      skills: [
        'Quick-add exercises with search and recent picks.',
        'Review timing for each exercise block.',
        'Launch class directly with Start Class once ready.'
      ],
      actionLabel: 'Open Class Plan',
      actionRoute: '/flow-builder'
    },
    {
      id: 'library',
      title: 'Exercises: Add one move at a time',
      purpose: 'Use filters and grouping to find specific movements fast.',
      skills: [
        'Group by apparatus, body focus, placement, or level.',
        'Add individual exercises to your active plan.',
        'Jump to Class Plan from add confirmations.'
      ],
      actionLabel: 'Open Exercises',
      actionRoute: '/library'
    },
    {
      id: 'programs',
      title: 'Programs: Load complete templates',
      purpose: 'Start from a full prebuilt flow when speed matters.',
      skills: [
        'Filter template results by equipment or focus.',
        'Apply a program in one action.',
        'Fine-tune the loaded class back in Class Plan.'
      ],
      actionLabel: 'Open Programs',
      actionRoute: '/programs'
    },
    {
      id: 'timer',
      title: 'Timer: Teach with confidence',
      purpose: 'Run the class with phase cues, outline jumps, and pacing support.',
      skills: [
        'Start, pause, reset, and skip while teaching live.',
        'Watch now/next cues to stay ahead.',
        'Use outline jump to adapt for client needs in real time.'
      ],
      actionLabel: 'Open Timer',
      actionRoute: '/timer'
    }
  ];

  readonly workflowGuides: WorkflowGuide[] = [
    {
      id: 'first-class',
      title: 'Build your first class in under 10 minutes',
      goal: 'Create and run a complete class from scratch.',
      steps: [
        'Go to Class Plan and add 6 to 10 exercises with quick add.',
        'Open Exercises to find any missing movements and add them.',
        'Review sequence order in Class Plan and adjust timing blocks.',
        'Tap Start Class and run the session in Timer.',
        'Save the flow after class so you can reuse it later.'
      ],
      actionLabel: 'Start In Class Plan',
      actionRoute: '/flow-builder'
    },
    {
      id: 'template-fast',
      title: 'Create a class quickly from a Program',
      goal: 'Load a full template then customize it to your group.',
      steps: [
        'Open Programs and filter by apparatus or focus.',
        'Apply the best matching template.',
        'Return to Class Plan and remove or swap any exercises.',
        'Start Class and teach with timer cues.'
      ],
      actionLabel: 'Browse Programs',
      actionRoute: '/programs'
    },
    {
      id: 'timing-calibration',
      title: 'Improve timing accuracy over time',
      goal: 'Let FloSmith learn your real teaching pace.',
      steps: [
        'Run classes in Timer instead of manually timing outside the app.',
        'Use normal exercise flow so live phase time can be captured.',
        'Repeat classes across several sessions.',
        'Review suggested durations shown in Class Plan and quick add lists.'
      ],
      actionLabel: 'Open Timer',
      actionRoute: '/timer'
    }
  ];

  readonly faqs: HelpFaq[] = [
    {
      id: 'start-class',
      question: 'How do I start a class?',
      answer: 'Build a sequence in Class Plan, then tap Start Class. If Start Class is disabled, add at least one exercise first.'
    },
    {
      id: 'difference',
      question: 'What is the difference between Exercises and Programs?',
      answer: 'Exercises adds one movement at a time. Programs loads a complete prebuilt class plan in one step.'
    },
    {
      id: 'timing',
      question: 'How do suggested exercise times work?',
      answer: 'FloSmith learns from completed class runs. After enough samples, suggested durations reflect your recent teaching pace.'
    },
    {
      id: 'empty-plan',
      question: 'Why is my plan empty when I open Timer?',
      answer: 'Timer runs the active Class Plan only. Add exercises in Class Plan or apply a Program first, then return to Timer.'
    },
    {
      id: 'save-flow',
      question: 'When should I save flows?',
      answer: 'Save a flow after you finish shaping a class you want to reuse. Then load it from Saved Flows for future sessions.'
    }
  ];

  startTutorial(): void {
    this.onboarding.reset();
    this.router.navigateByUrl('/welcome');
  }

  openRoute(path: string): void {
    this.router.navigateByUrl(path);
  }
}
