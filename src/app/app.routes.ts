import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: '', loadComponent: () => import('./pages/flow-builder/flow-builder.page').then((m) => m.FlowBuilderPage) },
	{ path: 'flows', loadComponent: () => import('./pages/flows/flows.page').then((m) => m.FlowsPage) },
	{ path: 'flow-builder', redirectTo: '', pathMatch: 'full' },
	{ path: 'library', loadComponent: () => import('./pages/library/library.page').then((m) => m.LibraryPage) },
	{ path: 'exercise/:id', loadComponent: () => import('./pages/exercise-detail/exercise-detail.page').then((m) => m.ExerciseDetailPage) },
	{ path: 'programs', loadComponent: () => import('./pages/templates/templates.page').then((m) => m.TemplatesPage) },
	{ path: 'programs/:id', loadComponent: () => import('./pages/program-detail/program-detail.page').then((m) => m.ProgramDetailPage) },
	{ path: 'templates', redirectTo: 'programs', pathMatch: 'full' },
	{ path: 'saved-flows', redirectTo: '', pathMatch: 'full' },
	{ path: 'timer', loadComponent: () => import('./pages/timer/timer.page').then((m) => m.TimerPage) },
	{ path: 'clients', loadComponent: () => import('./pages/clients/clients.page').then((m) => m.ClientsPage) },
	{ path: 'welcome', loadComponent: () => import('./pages/welcome/welcome.page').then((m) => m.WelcomePage) },
	{ path: 'help', loadComponent: () => import('./pages/help/help.page').then((m) => m.HelpPage) },
	{ path: 'settings', loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage) },
	{ path: '**', redirectTo: '' }
];
