import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder, FormGroup, FormsModule, Validators,
  ReactiveFormsModule,
  ɵFormGroupValue,
  ɵTypedOrUntyped
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RegistryConstants } from './constants/registry.constants';
import { CommonModule } from '@angular/common';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatIcon } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SnackBarService } from '../../shared/snack-bar/services/snackbar.service';
import { SnackBarType } from '../../shared/enums/snackbar-type.enum';

@Component({
  selector: 'app-update-user',
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
    MatDialogClose,
    ReactiveFormsModule,
    MatCheckbox,
    MatRadioButton,
    MatRadioGroup,
    MatIcon,
    MatDatepickerModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './update-user.component.html',
  styleUrl: './update-user.component.scss'
})
export class UpdateUserComponent implements OnInit {

  registryForm!: FormGroup;
  registryConstants = RegistryConstants;
  hidePassword: boolean = true;
  private suscripcion: Subscription;
  isSaving = false;

  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<UpdateUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private api: ApiService,
    private snackBarService: SnackBarService
  ) {
    this.suscripcion = new Subscription();
  }

  ngOnInit(): void {
    this.registryForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.minLength(4)]],
      rol: ['', [Validators.required]],
      diabetes: [false],
      fecha_nacimiento: ['', [Validators.required]]
    })
    this.registryForm.patchValue({
      nombre: this.data.nombre,
      email: this.data.email,
      rol: this.data.rol,
      diabetes: this.data.diabetes,
      fecha_nacimiento: this.data.fecha_nacimiento
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.registryForm.invalid) {
      this.registryForm.markAllAsTouched();
      return;
    }
    const value = { ...this.registryForm.value };
    if (value.rol !== 'paciente') {
      value.diabetes = false;
    }
    this.isSaving = true;
    this.suscripcion = this.actualizar(value).subscribe(
      response => {
        this.isSaving = false;
        this.snackBarService.openSnackBar('Usuario actualizado exitosamente', () => {}, SnackBarType.success);
        this.dialogRef.close(true);
      },
      error => {
        this.isSaving = false;
        this.snackBarService.openSnackBar('Error al actualizar: ' + JSON.stringify(error?.error ?? error), () => {}, SnackBarType.error);
      });
  }

  actualizar(value: any): Observable<any> {
    const payload = { ...value };
    if (!payload.password) {
      delete payload.password;
    }
    return this.http.patch<any>(this.api.url('/users/' + this.data.id + '/'), payload);
  }
}
