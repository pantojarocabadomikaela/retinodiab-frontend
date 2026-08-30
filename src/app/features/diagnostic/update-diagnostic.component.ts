import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Usuario } from './diagnostic.component';
import { ApiService } from '../../core/services/api.service';
import { SnackBarService } from '../../shared/snack-bar/services/snackbar.service';
import { SnackBarType } from '../../shared/enums/snackbar-type.enum';

@Component({
  selector: 'app-update-diagnostic',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule],
  templateUrl: './update-diagnostic.component.html',
  styleUrl: './update-diagnostic.component.scss'
})
export class UpdateDiagnosticComponent implements OnInit, OnDestroy {

  diagnosticoForm!: FormGroup;
  usuarios: Usuario[] = [];
  pacientesFiltrados: Usuario[] = [];
  isLoadingUsers = true;
  isProcessing = false;

  @ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;
  @ViewChild('pacienteInput') pacienteInput!: ElementRef<HTMLInputElement>;

  private selectedFile: File | null = null;
  private suscripcionUsers: Subscription;
  private suscripcion: Subscription;
  private suscripcionEliminar: Subscription;
  private apiUrl = '';
  private apiUrlUpdate = '';

  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<UpdateDiagnosticComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private api: ApiService,
    private snackBarService: SnackBarService
  ) {
    this.suscripcionUsers = new Subscription();
    this.suscripcion = new Subscription();
    this.suscripcionEliminar = new Subscription();
    this.apiUrl = this.api.url('/diagnosticos');
    this.apiUrlUpdate = this.api.url('/validate-image/');
  }

  ngOnInit(): void {
    this.diagnosticoForm = this.formBuilder.group({
      usuario: [this.data.email, [Validators.required]],
      observaciones: [this.data.observaciones, [Validators.required]]
    });

    this.isLoadingUsers = true;
    this.suscripcionUsers = this.http.get<any>(this.api.url('/users')).subscribe(response => {
      const pacientes = response.filter((usuario: Usuario) => usuario.rol === 'paciente');
      const actual = pacientes.find((usuario: Usuario) => usuario.email === this.data.email);
      if (!actual && this.data.email) {
        pacientes.push({ id: 0, email: this.data.email, nombre: this.data.paciente_nombre, rol: 'paciente', diabetes: false, fecha_nacimiento: new Date() });
      }
      this.usuarios = pacientes;
      this.pacientesFiltrados = this.usuarios;
      this.isLoadingUsers = false;
      setTimeout(() => {
        this.diagnosticoForm.get('usuario')?.setValue(this.data.email);
        if (this.pacienteInput) {
          this.pacienteInput.nativeElement.value = this.mostrarPaciente(this.data.email);
        }
      });
    });
  }

  filtrarPacientes(texto: string): void {
    const termino = texto?.trim().toLowerCase() ?? '';
    this.pacientesFiltrados = this.usuarios.filter(usuario =>
      !termino || usuario.nombre.toLowerCase().includes(termino) || usuario.email.toLowerCase().includes(termino));
  }

  mostrarPaciente(email: string): string {
    const usuarios = this.usuarios ?? [];
    const paciente = usuarios.find(usuario => usuario?.email === email);
    if (!email) {
      return '';
    }
    return paciente ? `${paciente.nombre} (${paciente.email})` : email;
  }

  onPacienteSeleccionado(paciente?: Usuario): void {
    if (paciente) {
      this.diagnosticoForm.get('usuario')?.setValue(paciente.email);
      if (this.pacienteInput) {
        this.pacienteInput.nativeElement.value = this.mostrarPaciente(paciente.email);
      }
    }
    const email = this.diagnosticoForm.get('usuario')?.value;
    const elegido = this.autoTrigger?.autocomplete?.options?.find(opcion => opcion.value === email);
    this.autoTrigger?.autocomplete?.options?.forEach(opcion => {
      if (opcion !== elegido) {
        opcion.deselect(false);
      }
    });
    this.pacientesFiltrados = this.usuarios;
    this.autoTrigger?.closePanel();
  }

  ngOnDestroy(): void {
    this.suscripcionUsers.unsubscribe();
    this.suscripcion.unsubscribe();
    this.suscripcionEliminar.unsubscribe();
  }

  onNoClick(): void {
    if (this.isProcessing) {
      return;
    }
    this.dialogRef.close();
  }

  handleImageChange(event: any): void {
    const file = event.target.files[0];
    this.selectedFile = file || null;
  }

  onSave(): void {
    if (this.isProcessing) {
      return;
    }

    if (this.diagnosticoForm.invalid) {
      this.diagnosticoForm.markAllAsTouched();
      return;
    }

    const email = this.diagnosticoForm.get('usuario')?.value;
    if (!this.usuarios.some(usuario => usuario.email === email)) {
      this.diagnosticoForm.get('usuario')?.setErrors({ noExiste: true });
      this.diagnosticoForm.get('usuario')?.markAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('email', this.diagnosticoForm.get('usuario')?.value);
    formData.append('observaciones', this.diagnosticoForm.get('observaciones')?.value);
    if (this.selectedFile) {
      formData.append('imageFile', this.selectedFile);
    }

    this.isProcessing = true;
    this.suscripcion = this.http.post<any>(this.apiUrlUpdate, formData).subscribe(
      response => {
        this.snackBarService.openSnackBar(response.mensaje ?? 'Diagnóstico guardado', () => {}, SnackBarType.success);

        this.suscripcionEliminar = this.doEliminar(this.data.id).subscribe(
          () => {
            this.isProcessing = false;
            this.dialogRef.close(true);
          },
          error => {
            this.isProcessing = false;
            this.snackBarService.openSnackBar('Error al eliminar diagnóstico', () => {}, SnackBarType.error);
          }
        );
      },
      error => {
        this.isProcessing = false;
        this.snackBarService.openSnackBar('Error al crear diagnóstico: ' + (error?.error?.mensaje ?? error), () => {}, SnackBarType.error);
      }
    );
  }

  doEliminar(id: any) {
    return this.http.delete<any>(this.apiUrl + '/' + id + '/');
  }
}
