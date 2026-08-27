import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

export interface UsuarioSesion {
    id?: number;
    nombre?: string;
    email?: string;
    rol: string;
    [key: string]: any;
}

const USUARIO_KEY = 'usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {

    constructor(
        private http: HttpClient,
        private api: ApiService,
    ) {}

    login(usuario: any): void {
        localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
    }

    logout(): void {
        localStorage.removeItem(USUARIO_KEY);
    }

    getUser(): UsuarioSesion | null {
        const raw = localStorage.getItem(USUARIO_KEY);
        if (raw !== undefined && raw !== null && raw !== '') {
            try {
                return JSON.parse(raw) as UsuarioSesion;
            } catch {
                return null;
            }
        }
        return null;
    }

    isAuthenticated(): boolean {
        return this.getUser() !== null;
    }

    getRole(): string | null {
        return this.getUser()?.rol ?? null;
    }
}
