import {Routes} from '@angular/router';

import {LoginComponent} from "./features/auth/login/login.component";
import {RegistryComponent} from "./features/users/registry.component";
import {MainLayoutComponent} from "./layouts/main-layout/main-layout.component";
import {UsersComponent} from "./features/users/users.component";
import {HistoryComponent} from "./features/history/history.component";
import {DiagnosticComponent} from "./features/diagnostic/diagnostic.component";
import {UserGuideComponent} from './features/manuals/user-guide/user-guide.component';
import {HomeRedirectComponent} from './features/home/home-redirect.component';
import {DashboardComponent} from './features/dashboard/dashboard.component';

import {authGuard} from './core/guards/auth.guard';
import {roleGuard} from './core/guards/role.guard';

export const routes: Routes = [
    {path: '', redirectTo: '/login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'registro', component: RegistryComponent},
    {
        path: 'admin',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', component: HomeRedirectComponent, pathMatch: 'full' },
            { path: 'dashboard', component: DashboardComponent, canActivate: [roleGuard] },
            { path: 'users', component: UsersComponent, canActivate: [roleGuard] },
            { path: 'diagnostico', component: DiagnosticComponent, canActivate: [roleGuard] },
            { path: 'historial', component: HistoryComponent, canActivate: [roleGuard] },
            { path: 'registro', component: RegistryComponent, canActivate: [roleGuard] },
            { path: 'manual', component: UserGuideComponent, canActivate: [roleGuard] },
            {
                path: 'editor',
                loadComponent: () => import('./features/manuals/manual-editor/manual-editor.component').then(m => m.ManualEditorComponent),
                canActivate: [roleGuard]
            }
        ]
    },
];
