import { Component, OnInit } from '@angular/core';
import {
  FormBuilder, FormGroup, FormsModule, Validators,
  ReactiveFormsModule,
  ɵFormGroupValue,
  ɵTypedOrUntyped
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
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
import emailjs, { type EmailJSResponseStatus } from '@emailjs/browser'

@Component({
  selector: 'app-create-user',
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
    MatCheckbox,
    MatRadioButton,
    MatRadioGroup,
    MatIcon,
    MatDatepickerModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.scss'
})
export class CreateUserComponent implements OnInit {

  registryForm!: FormGroup;
  registryConstants = RegistryConstants;
  hidePassword: boolean = true;
  private suscripcion: Subscription;
  isSaving = false;
  

  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<CreateUserComponent>,
    private api: ApiService,
    private snackBarService: SnackBarService
  ) {
    this.suscripcion = new Subscription();
  }

  ngOnInit(): void {
    this.registryForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.minLength(4), Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      rol: ['', [Validators.required]],
      diabetes: [false],
      fecha_nacimiento: ['', [Validators.required]]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.registryForm.valid) {
      this.isSaving = true;
      const templateParams = {
        name: this.registryForm.value.nombre,
        email: this.registryForm.value.email,
      };

      emailjs.send(
        'service_jywqptx',     // Reemplaza con tu Service ID
        'template_q9h4rzo',    // Reemplaza con tu Template ID
        templateParams,
        'kTysvucWb8D4cP03V'      // Reemplaza con tu Public Key
      )
      .then((response: EmailJSResponseStatus) => {
        console.log('¡Correo enviado con éxito!', response.status, response.text);
      })
      .catch((error) => {
        console.error('Error al enviar el correo:', error);
      });

      this.suscripcion = this.crear(this.registryForm.value).subscribe(
        response => {
          this.isSaving = false;
          this.snackBarService.openSnackBar('Usuario creado exitosamente', () => {}, SnackBarType.success);
          this.dialogRef.close(true);
        },
        error => {
          this.isSaving = false;
          const emailError = error?.error?.email;
          const backendMessage = (Array.isArray(emailError) ? emailError[0] : emailError)
            ?? error?.error?.mensaje
            ?? error?.error?.message
            ?? error?.error?.detail
            ?? error?.error?.error
            ?? (typeof error?.error === 'string' ? error.error : undefined)
            ?? error?.message
            ?? 'Error inesperado';
          this.snackBarService.openSnackBar('Error al crear usuario: ' + backendMessage, () => {}, SnackBarType.error);
        });
    }
  }

  crear(value: any): Observable<any> {
    return this.http.post<any>(this.api.url('/users/'), value);
  }
}
