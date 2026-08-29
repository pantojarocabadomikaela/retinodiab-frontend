import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { DiagnosticDialogComponent } from './diagnostic-dialog.component';
import { UpdateDiagnosticComponent } from './update-diagnostic.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ImageViewComponent } from '../../shared/image-view/image-view.component';
import { AutoPageSizeDirective } from '../../shared/directives/auto-page-size.directive';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { SnackBarService } from '../../shared/snack-bar/services/snackbar.service';
import { SnackBarType } from '../../shared/enums/snackbar-type.enum';
import { SkeletonTableComponent } from '../../shared/skeleton/skeleton-table.component';

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  diabetes: boolean;
  fecha_nacimiento: Date;
}

export interface DiagnosticoElement {
  id: string;
  email: string;
  nombre: string;
  paciente_nombre: string;
  imagen: string;
  resultado: string;
  observaciones: string;
}

@Component({
  selector: 'app-diagnostic',
  standalone: true,
    imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    MatPaginatorModule,
    AutoPageSizeDirective,
    SkeletonTableComponent],
  templateUrl: './diagnostic.component.html',
  styleUrl: './diagnostic.component.scss'
})
export class DiagnosticComponent implements OnInit, AfterViewInit, OnDestroy {

  displayedColumns: string[] = ['paciente_nombre', 'email', 'observaciones', 'resultado', 'nombre', 'acciones'];
  apiUrl = '';
  suscripcion: Subscription;
  suscripcionEliminar: Subscription;
  dataSource = new MatTableDataSource<DiagnosticoElement>([]);
  searchFilter = '';
  esServicio: boolean = false;
  isLoading = false;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient, public dialog: MatDialog, private authService: AuthService, private api: ApiService, private snackBarService: SnackBarService) {
    this.suscripcion = new Subscription();
    this.suscripcionEliminar = new Subscription();
    this.apiUrl = this.api.url('/diagnosticos');
  }

  ngOnInit(): void {
    this.esServicio = this.authService.getRole() === 'servicio';
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.filterPredicate = (data: DiagnosticoElement, filter: string) => {
      const termino = filter.trim().toLowerCase();
      const texto = `${data.id} ${data.paciente_nombre} ${data.nombre} ${data.email} ${data.observaciones} ${data.resultado}`.toLowerCase();
      return texto.includes(termino);
    };
  }

  // Filtro por texto (id/nombre/email/observaciones/resultado) en el cliente.
  applySearch(value: string): void {
    this.searchFilter = value;
    this.refrescarFiltro();
  }

  // Reaplica el filtro del dataSource. Se usa un espacio cuando el buscador está
  // vacío porque MatTableDataSource ignora el filtro si la cadena es vacía.
  private refrescarFiltro(): void {
    this.dataSource.filter = this.searchFilter.trim() || ' ';
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  cargarDatos(): void {
    this.isLoading = true;
    this.suscripcion = this.getTableData().subscribe(response => {
      this.dataSource.data = response;
      this.isLoading = false;
    },
      error => {
        this.isLoading = false;
        this.snackBarService.openSnackBar('Error al cargar diagnósticos', () => {}, SnackBarType.error);
      });
  }

  getTableData() {
    return this.http.get<any>(this.apiUrl);
  }

  // Abre el diálogo de creación de diagnóstico en este mismo modal.
  crear(): void {
    const dialogRef = this.dialog.open(DiagnosticDialogComponent, {
      panelClass: 'app-dialog',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) { this.cargarDatos(); }
    });
  }

  verImagen(imagen: string) {
    this.dialog.open(ImageViewComponent, {
      data: { valor: imagen },
      panelClass: 'app-dialog',
    });
  }

  // Abre el diálogo de edición del diagnóstico (usuario, observaciones e imagen).
  modificar(element: DiagnosticoElement): void {
    const dialogRef = this.dialog.open(UpdateDiagnosticComponent, {
      data: element,
      panelClass: 'app-dialog',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) { this.cargarDatos(); }
    });
  }

  // Pide confirmación antes de eliminar el diagnóstico.
  eliminar(element: DiagnosticoElement): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: 'Eliminar Diagnóstico',
        mensaje: `¿Deseas eliminar el diagnóstico #${element.id} de ${element.email}? Esta acción no se puede deshacer.`,
      },
      panelClass: 'app-dialog',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.suscripcionEliminar = this.doEliminar(element.id).subscribe(() => {
          this.cargarDatos();
        },
          error => {
            this.snackBarService.openSnackBar('Error al eliminar diagnóstico', () => {}, SnackBarType.error);
          });
      }
    });
  }

  doEliminar(id: any) {
    return this.http.delete<any>(this.apiUrl + '/' + id + '/');
  }

  ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
    this.suscripcionEliminar.unsubscribe();
  }
}
