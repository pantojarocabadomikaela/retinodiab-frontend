import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../../../../core/services/auth.service';
import { HeaderConstants, ROLE_LABELS } from './header.constants';
import { ViewUserComponent } from '../../../../features/users/view-user.component';
import { ChangePasswordComponent } from '../../../../features/users/change-password.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule, MatDividerModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  headerConstants = HeaderConstants;

  // Nombre del usuario en sesión (se lee al construir el header).
  username: string = '';

  // Etiqueta legible del rol (Administrador, Servicio, Paciente).
  roleLabel: string = '';

  // Iniciales del nombre para el avatar del menú.
  initials: string = '';

  // Usuario en sesión (se lee al construir el header).
  private usuario: any = null;

  constructor(private router: Router, private authService: AuthService, private dialog: MatDialog) {
    const usuario = this.authService.getUser();
    this.usuario = usuario;
    this.username = usuario?.nombre ?? '';
    this.roleLabel = usuario ? (ROLE_LABELS[usuario.rol] ?? usuario.rol) : '';
    this.initials = this.buildInitials(this.username);
  }

  // Abre el perfil del usuario en modo vista (solo lectura).
  openVerPerfil(): void {
    if (!this.usuario) {
      return;
    }
    this.dialog.open(ViewUserComponent, { data: this.usuario, panelClass: 'app-dialog' });
  }

  // Abre el diálogo para cambiar la contraseña del usuario en sesión.
  openCambiarPassword(): void {
    if (!this.usuario) {
      return;
    }
    this.dialog.open(ChangePasswordComponent, { data: this.usuario, panelClass: 'app-dialog' });
  }

  // Cierra la sesión y vuelve a la pantalla de login.
  goToLogin(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Calcula las iniciales a partir del nombre (máx. 2 letras).
  private buildInitials(nombre: string): string {
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 0 || partes[0] === '') {
      return '';
    }
    const primera = partes[0].charAt(0);
    const segunda = partes.length > 1 ? partes[1].charAt(0) : '';
    return (primera + segunda).toUpperCase();
  }
}
