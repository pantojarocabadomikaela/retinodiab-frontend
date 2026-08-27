import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  url(endpoint: string): string {
    return `${this.base}${endpoint}`;
  }
}
