import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
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
  selector: 'app-diagnostic-dialog',
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
  templateUrl: './diagnostic-dialog.component.html',
  styleUrl: './diagnostic-dialog.component.scss'
})
export class DiagnosticDialogComponent implements OnInit, OnDestroy {

  diagnosticoForm!: FormGroup;
  usuarios: Usuario[] = [];
  pacientesFiltrados: Usuario[] = [];
  mostrarErrorImagen: boolean = false;
  isLoadingUsers = false;
  isProcessing = false;

  @ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;
  @ViewChild('pacienteInput') pacienteInput!: ElementRef<HTMLInputElement>;

  private selectedFile: File | null = null;
  private suscripcionUsers: Subscription;
  private suscripcion: Subscription;
  private apiUrl = '';

  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<DiagnosticDialogComponent>,
    private api: ApiService,
    private snackBarService: SnackBarService
  ) {
    this.suscripcionUsers = new Subscription();
    this.suscripcion = new Subscription();
    this.apiUrl = this.api.url('/validate-image/');
  }

  ngOnInit(): void {
    this.diagnosticoForm = this.formBuilder.group({
      usuario: ['', [Validators.required]],
      observaciones: ['', [Validators.required]]
    });

    this.isLoadingUsers = true;
    this.suscripcionUsers = this.http.get<any>(this.api.url('/users')).subscribe(response => {
      this.usuarios = response.filter((usuario: Usuario) => usuario.rol === 'paciente');
      this.pacientesFiltrados = this.usuarios;
      this.isLoadingUsers = false;
    });
  }

  filtrarPacientes(texto: string): void {
    const termino = texto?.trim().toLowerCase() ?? '';
    this.pacientesFiltrados = this.usuarios.filter(usuario =>
      !termino || usuario.nombre.toLowerCase().includes(termino) || usuario.email.toLowerCase().includes(termino));
  }

  mostrarPaciente(email: string): string {
    const paciente = this.usuarios.find(usuario => usuario.email === email);
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
    if (file) {
      this.mostrarErrorImagen = false;
    }
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

    if (!this.selectedFile) {
      this.mostrarErrorImagen = true;
      return;
    }

    const formData = new FormData();
    formData.append('imageFile', this.selectedFile);
    formData.append('email', this.diagnosticoForm.get('usuario')?.value);
    formData.append('observaciones', this.diagnosticoForm.get('observaciones')?.value);

    this.isProcessing = true;
    this.suscripcion = this.http.post<any>(this.apiUrl, formData).subscribe(
      response => {
        this.isProcessing = false;
        this.snackBarService.openSnackBar(response.mensaje ?? 'Diagnóstico guardado', () => {}, SnackBarType.success);
        this.dialogRef.close(true);
      },
      error => {
        this.isProcessing = false;
        this.snackBarService.openSnackBar('Error al crear diagnóstico: ' + (error?.error?.mensaje ?? error), () => {}, SnackBarType.error);
      });
  }
}
