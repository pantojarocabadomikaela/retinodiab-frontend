import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { SnackBarType } from '../../enums/snackbar-type.enum';

import { SnackBarComponent } from '../snack-bar.component';

@Injectable({
  providedIn: 'root',
})
export class SnackBarService {
  constructor(private snackBar: MatSnackBar) { }

  openSnackBar(message: string, actionCallback: () => void, type: SnackBarType): MatSnackBarRef<SnackBarComponent> {
    const snackBarRef = this.snackBar.openFromComponent(SnackBarComponent, {
      data: {
        message: message,
        type: type,
      },
      duration: 5000,
      verticalPosition: 'top',
      horizontalPosition: 'end',
      panelClass: [`snackbar--${type}`],
    });

    snackBarRef.onAction().subscribe(() => {
      actionCallback();
    });

    return snackBarRef;
  }
}
