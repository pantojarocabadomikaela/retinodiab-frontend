import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, FormsModule, ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SnackBarService } from '../../shared/snack-bar/services/snackbar.service';
import { SnackBarType } from '../../shared/enums/snackbar-type.enum';

// La contraseña nueva y su confirmación deben coincidir.
function passwordsCoinciden(form: FormGroup) {
    const nueva = form.get('nuevaPassword')?.value;
    const confirmar = form.get('confirmarPassword')?.value;
    return nueva === confirmar ? null : { noCoinciden: true };
}

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        ReactiveFormsModule,
        MatIcon
    ],
    templateUrl: './change-password.component.html',
    styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
    changePasswordForm!: FormGroup;
    hidePasswordActual = true;
    hidePasswordNueva = true;
    hidePasswordConfirmar = true;
    private suscripcion: Subscription;
    isSaving = false;

    constructor(
        private http: HttpClient,
        private formBuilder: FormBuilder,
        public dialogRef: MatDialogRef<ChangePasswordComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private api: ApiService,
        private snackBarService: SnackBarService
    ) {
        this.suscripcion = new Subscription();
    }

    ngOnInit(): void {
        this.changePasswordForm = this.formBuilder.group(
            {
                passwordActual: ['', [Validators.required, Validators.minLength(4)]],
                nuevaPassword: ['', [Validators.required, Validators.minLength(4)]],
                confirmarPassword: ['', [Validators.required, Validators.minLength(4)]]
            },
            { validators: passwordsCoinciden }
        );
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        if (this.changePasswordForm.invalid) {
            this.changePasswordForm.markAllAsTouched();
            return;
        }
        const { passwordActual, nuevaPassword } = this.changePasswordForm.value;
        this.isSaving = true;
        this.suscripcion = this.verificarPasswordActual(passwordActual).subscribe(
            () => this.actualizarPassword(nuevaPassword),
            error => {
                this.isSaving = false;
                this.snackBarService.openSnackBar('La contraseña actual es incorrecta: ' + (error?.error?.mensaje ?? 'verifícala e intenta de nuevo'), () => {}, SnackBarType.warning);
            });
    }

    // Valida la contraseña actual contra el backend (mismo flujo que el login).
    private verificarPasswordActual(password: string): Observable<any> {
        const body = new URLSearchParams();
        body.set('email', this.data.email);
        body.set('password', password);
        const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
        return this.http.post<any>(this.api.url('/validate-credentials/'), body.toString(), { headers });
    }

    // Guarda la nueva contraseña (actualización parcial del usuario).
    private actualizarPassword(nuevaPassword: string): void {
        this.suscripcion = this.http.patch<any>(this.api.url('/users/' + this.data.id + '/'), { password: nuevaPassword }).subscribe(
            () => {
                this.isSaving = false;
                this.snackBarService.openSnackBar('Contraseña actualizada exitosamente', () => {}, SnackBarType.success);
                this.dialogRef.close();
            },
            error => {
                this.isSaving = false;
                this.snackBarService.openSnackBar('Error al actualizar la contraseña: ' + (error?.error?.mensaje ?? 'intenta de nuevo'), () => {}, SnackBarType.error);
            });
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
    }
}
