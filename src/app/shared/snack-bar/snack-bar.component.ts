import { Component, Inject } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { SnackBarType } from '../enums/snackbar-type.enum';

@Component({
  selector: 'app-snack-bar',
  templateUrl: './snack-bar.component.html',
  styleUrls: ['./snack-bar.component.scss'],
  standalone: true,
  imports: [MatIconModule, CommonModule]
})
export class SnackBarComponent {

  public message: string;
  public type: SnackBarType;

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) data: any,
    private snackBarRef: MatSnackBarRef<any>,
  ) {
    this.message = data.message;
    this.type = data.type;
  }

  get iconName(): string {
    switch (this.type) {
      case SnackBarType.info:
        return 'info_outline';
      case SnackBarType.success:
        return 'check_circle_outline';
      case SnackBarType.warning:
        return 'warning_amber';
      case SnackBarType.error:
        return 'error_outline';
    }
  }

  close(): void {
    this.snackBarRef.dismiss();
  }

}
