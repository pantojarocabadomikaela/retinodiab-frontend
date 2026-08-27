import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
import { ROLE_LABELS } from '../../layouts/main-layout/components/header/header.constants';

@Component({
    selector: 'app-view-user',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatFormFieldModule,
        MatInputModule,
        MatIcon,
        MatRadioButton,
        MatRadioGroup,
        MatCheckbox
    ],
    templateUrl: './view-user.component.html',
    styleUrl: './view-user.component.scss'
})
export class ViewUserComponent {
    roleLabels = ROLE_LABELS;

    constructor(
        public dialogRef: MatDialogRef<ViewUserComponent>,
        @Inject(MAT_DIALOG_DATA) public usuario: any
    ) {
    }

    // Muestra solo la parte de fecha (YYYY-MM-DD), sin la hora que trae el backend.
    get fechaNacimiento(): string {
        return String(this.usuario?.fecha_nacimiento ?? '').slice(0, 10);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}
