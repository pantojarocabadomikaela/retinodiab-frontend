import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { MenuItem } from '../../models/menu-item.model';

@Component({
  selector: 'app-context-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './context-bar.component.html',
  styleUrl: './context-bar.component.scss'
})
export class ContextBarComponent {

  // Ruta de navegación actual ("Inicio" + ancestros + ítem actual).
  @Input() breadcrumbs: MenuItem[] = [];
}
