import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from './components/header/header.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { ContextBarComponent } from './components/context-bar/context-bar.component';

import { MenuItem } from './models/menu-item.model';
import { getBreadcrumbs, getRoleAccess } from '../../core/config/role-access.config';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, NavBarComponent, ContextBarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  // Items de la NavBar según el rol del usuario en sesión.
  menuItems: MenuItem[] = [];

  // Breadcrumb de la ContextBar según la URL actual.
  breadcrumbs: MenuItem[] = [];

  private routerEventsSub: Subscription = new Subscription();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const usuario = this.authService.getUser();
    if (usuario !== null) {
      this.menuItems = getRoleAccess(usuario.rol).menus;
    }

    this.updateBreadcrumbs();
    this.routerEventsSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updateBreadcrumbs());
  }

  ngOnDestroy(): void {
    this.routerEventsSub.unsubscribe();
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbs = getBreadcrumbs(this.authService.getRole(), this.router.url);
  }
}
