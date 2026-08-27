import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { ApiService } from '../../../core/services/api.service';
import { SnackBarService } from '../../../shared/snack-bar/services/snackbar.service';
import { SnackBarType } from '../../../shared/enums/snackbar-type.enum';

export interface Manuales {
  value: string;
  viewValue: string;
}

export interface CodigoManuales {
  id: string;
  tipo: string;
  fuente: string;
}

@Component({
  selector: 'app-manual-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    NgxEditorModule
  ],
  templateUrl: './manual-editor.component.html',
  styleUrl: './manual-editor.component.scss'
})
export class ManualEditorComponent implements OnInit, OnDestroy {

  manuales: Manuales[] = [
    { value: 'servicio', viewValue: 'Servicio' },
    { value: 'admin', viewValue: 'Admin' },
    { value: 'paciente', viewValue: 'Paciente' },
  ];

  dataModel = '';
  codigoManuales!: CodigoManuales[];
  manualActual = 0;
  manualTipo = '';
  manualSeleccionado = false;

  // Editor NGXEditor (solo se crea en el navegador; en SSR la ruta está
  // protegida por authGuard y nunca se llega a instanciar).
  editor: Editor | null = null;

  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
    ['horizontal_rule', 'format_clear', 'indent', 'outdent'],
    ['superscript', 'subscript'],
    ['undo', 'redo']
  ];

  suscripcionManuales: Subscription;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object, private api: ApiService, private snackBarService: SnackBarService) {
    this.suscripcionManuales = new Subscription();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.editor = new Editor();
    }
    this.suscripcionManuales = this.http.get<CodigoManuales[]>(this.api.url('/manuals/')).subscribe(response => {
      this.codigoManuales = response;
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.suscripcionManuales.unsubscribe();
  }

  onManualSelectionChange(event: any) {
    this.manualSeleccionado = true;
    if (event.value === 'servicio') {
      this.dataModel = this.codigoManuales[0].fuente;
      this.manualActual = 1;
      this.manualTipo = 'servicio';
    } else if (event.value === 'admin') {
      this.dataModel = this.codigoManuales[1].fuente;
      this.manualTipo = 'admin';
      this.manualActual = 2;
    } else {
      this.dataModel = this.codigoManuales[2].fuente;
      this.manualTipo = 'paciente';
      this.manualActual = 3;
    }
  }

  guardarManual() {
    this.http.put<any>(this.api.url('/manuals/' + this.manualActual + '/'), {tipo: this.manualTipo, fuente: this.dataModel}).subscribe(response => {
      this.snackBarService.openSnackBar('Manual guardado exitosamente', () => {}, SnackBarType.success);
    });
    this.codigoManuales[this.manualActual - 1].fuente = this.dataModel;
  }
}
