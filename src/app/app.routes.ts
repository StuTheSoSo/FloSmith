import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: '', loadComponent: () => import('./pages/home.page').then((m) => m.HomePage) },
	{ path: 'flow-builder', loadComponent: () => import('./pages/flow-builder/flow-builder.page').then((m) => m.FlowBuilderPage) },
	{ path: 'library', loadComponent: () => import('./pages/library/library.page').then((m) => m.LibraryPage) },
	{ path: 'exercise/:id', loadComponent: () => import('./pages/exercise-detail/exercise-detail.page').then((m) => m.ExerciseDetailPage) },
	{ path: 'programs', loadComponent: () => import('./pages/templates/templates.page').then((m) => m.TemplatesPage) },
	{ path: 'programs/:id', loadComponent: () => import('./pages/program-detail/program-detail.page').then((m) => m.ProgramDetailPage) },
	{ path: 'templates', redirectTo: 'programs', pathMatch: 'full' },
	{ path: 'saved-flows', loadComponent: () => import('./pages/saved-flows/saved-flows.page').then((m) => m.SavedFlowsPage) },
	{ path: 'timer', loadComponent: () => import('./pages/timer/timer.page').then((m) => m.TimerPage) },
	{ path: 'clients', loadComponent: () => import('./pages/clients/clients.page').then((m) => m.ClientsPage) },
	{ path: 'settings', loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage) },
	{ path: '**', redirectTo: '' }
];
