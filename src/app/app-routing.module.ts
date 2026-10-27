import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard, LoginGuard } from './guards/auth.guard';
import { NotificacionesComponent } from './components/notificaciones/notificaciones.component';
import { CamarasComponent } from './components/camaras/camaras.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: LoginComponent, canActivate: [LoginGuard] },
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'notificaciones', component: NotificacionesComponent, canActivate: [AuthGuard] },
  { path: 'camaras', component: CamarasComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
