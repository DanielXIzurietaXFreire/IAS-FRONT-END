import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NotificacionesComponent } from './components/notificaciones/notificaciones.component';
import { CamarasComponent } from './components/camaras/camaras.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

// Las fechas de las alertas salían en inglés («Wednesday, October 7, 2026») porque Angular
// usa en-US si no se registra otro idioma. El sistema lo usa personal de seguridad en
// Ecuador, así que se registra español y se fija como idioma de la aplicación (13/10/2026).
registerLocaleData(localeEs);

@NgModule({
  declarations: [AppComponent, LoginComponent, DashboardComponent, NotificacionesComponent, CamarasComponent, SidebarComponent],
  imports: [BrowserModule, HttpClientModule, ReactiveFormsModule, FormsModule, AppRoutingModule],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'es' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
