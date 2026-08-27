import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { flattenMenuItems, getRoleAccess } from '../../core/config/role-access.config';
import { MenuItem } from '../../layouts/main-layout/models/menu-item.model';
import { ROLE_LABELS } from '../../layouts/main-layout/components/header/header.constants';
import { ApiService } from '../../core/services/api.service';
import { SkeletonCardComponent } from '../../shared/skeleton/skeleton-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, SkeletonCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {

  nombre: string = '';
  rolLabel: string = '';
  menus: MenuItem[] = [];
  canViewAllHistory: boolean = false;
  tieneUsuarios: boolean = false;

  totalUsuarios: number | null = null;
  totalDiagnosticos: number | null = null;
  misDiagnosticos: number | null = null;
  isLoadingUsuarios = false;
  isLoadingDiagnosticos = false;

  private suscripcionUsuarios: Subscription = new Subscription();
  private suscripcionDiagnosticos: Subscription = new Subscription();

  constructor(private http: HttpClient, private authService: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    const usuario = this.authService.getUser();
    if (usuario === null) {
      return;
    }

    this.nombre = usuario.nombre ?? usuario.email ?? '';
    this.rolLabel = ROLE_LABELS[usuario.rol] ?? usuario.rol;

    const access = getRoleAccess(usuario.rol);
    this.menus = flattenMenuItems(access.menus);
    this.canViewAllHistory = access.canViewAllHistory;
    this.tieneUsuarios = this.menus.some(menu => menu.path === '/admin/users');

    if (this.tieneUsuarios) {
      this.isLoadingUsuarios = true;
      this.suscripcionUsuarios = this.http.get<any[]>(this.api.url('/users')).subscribe(
        response => {
          this.totalUsuarios = response.length;
          this.isLoadingUsuarios = false;
        });
    }

    this.isLoadingDiagnosticos = true;
    this.suscripcionDiagnosticos = this.http.get<any[]>(this.api.url('/diagnosticos')).subscribe(
      response => {
        this.totalDiagnosticos = response.length;
        this.isLoadingDiagnosticos = false;
        if (!this.canViewAllHistory) {
          this.misDiagnosticos = response.filter(diagnostico => diagnostico.email === usuario.email).length;
        }
      });
  }

  ngOnDestroy(): void {
    this.suscripcionUsuarios.unsubscribe();
    this.suscripcionDiagnosticos.unsubscribe();
  }
}
