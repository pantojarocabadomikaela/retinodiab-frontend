import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CodigoManuales } from '../manual-editor/manual-editor.component';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { getRoleAccess } from '../../../core/config/role-access.config';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-user-guide',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './user-guide.component.html',
  styleUrl: './user-guide.component.scss'
})
export class UserGuideComponent implements OnInit, OnDestroy {

  tipoUsuario = '';
  htmlContentAdmin: string = '';
  codigoManuales!: CodigoManuales[];
  suscripcionManuales: Subscription;

  constructor(private http: HttpClient, private authService: AuthService, private api: ApiService) {
    this.suscripcionManuales = new Subscription();
  }

  ngOnInit(): void {
    const usuario = this.authService.getUser();
    if (usuario !== null) {
      this.tipoUsuario = usuario.rol;
    }

    this.suscripcionManuales = this.http.get<CodigoManuales[]>(this.api.url('/manuals/')).subscribe(response => {
      this.codigoManuales = response;
      const manualIndex = getRoleAccess(this.tipoUsuario).manualIndex;
      this.htmlContentAdmin = this.codigoManuales[manualIndex].fuente;
    });

  }

  ngOnDestroy(): void {
    this.suscripcionManuales.unsubscribe();
  }
}
