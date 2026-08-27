import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-card">
      <div class="skeleton-card__icon"></div>
      <div class="skeleton-card__text">
        <div class="skeleton-card__label"></div>
        <div class="skeleton-card__value"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      border-radius: 12px;
      background: #fff;
      border: 1px solid rgba(0,0,0,0.06);
    }
    .skeleton-card__icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: linear-gradient(90deg, #e0e0e0 25%, #ececec 50%, #e0e0e0 75%);
      background-size: 200% 100%;
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }
    .skeleton-card__text { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .skeleton-card__label {
      height: 12px;
      width: 80px;
      border-radius: 4px;
      background: linear-gradient(90deg, #e0e0e0 25%, #ececec 50%, #e0e0e0 75%);
      background-size: 200% 100%;
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }
    .skeleton-card__value {
      height: 24px;
      width: 60px;
      border-radius: 4px;
      background: linear-gradient(90deg, #e0e0e0 25%, #ececec 50%, #e0e0e0 75%);
      background-size: 200% 100%;
      animation: skeleton-pulse 1.5s ease-in-out infinite 0.15s;
    }
    @keyframes skeleton-pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SkeletonCardComponent {}
