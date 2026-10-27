import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
