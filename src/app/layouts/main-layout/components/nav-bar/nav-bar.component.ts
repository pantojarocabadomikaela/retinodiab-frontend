import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { MenuItem } from '../../models/menu-item.model';
import { HOME_MENU_ITEM } from '../../../../core/config/role-access.config';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {

  // Menús del rol en sesión (padres con hijos o ítems directos).
  @Input() menuItems: MenuItem[] = [];

  // Ítem fijo de inicio, presente para todos los roles.
  homeItem: MenuItem = HOME_MENU_ITEM;

  constructor(private router: Router) {}

  // La barra muestra siempre "Inicio" + los menús del rol.
  get items(): MenuItem[] {
    return [this.homeItem, ...this.menuItems];
  }

  // Marca como activo un menú padre si la URL actual coincide con alguno de sus hijos.
  isActive(item: MenuItem): boolean {
    const currentUrl = this.router.url.split('?')[0];
    return !!item.children?.some(child => currentUrl.startsWith(child.path ?? ''));
  }
}
