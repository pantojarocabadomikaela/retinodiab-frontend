import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-table">
      <div class="skeleton-table__row" *ngFor="let r of rows(count)">
        <div class="skeleton-table__cell" *ngFor="let c of rows(cols)" [style.width]="widths[c] || '15%'">
          <div class="skeleton-table__bar"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-table { padding: 0; }
    .skeleton-table__row {
      display: flex;
      gap: 16px;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .skeleton-table__cell { flex: 1; display: flex; align-items: center; }
    .skeleton-table__bar {
      height: 16px;
      border-radius: 4px;
      background: linear-gradient(90deg, #e0e0e0 25%, #ececec 50%, #e0e0e0 75%);
      background-size: 200% 100%;
      animation: skeleton-pulse 1.5s ease-in-out infinite;
      width: 80%;
    }
    @keyframes skeleton-pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SkeletonTableComponent {
  @Input() count = 5;
  @Input() cols = 6;
  @Input() widths: string[] = [];

  rows(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}
