import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { HistoryElement } from './history-element';
import { Usuario } from '../diagnostic/diagnostic.component';
import { ImageViewComponent } from '../../shared/image-view/image-view.component';
import { AutoPageSizeDirective } from '../../shared/directives/auto-page-size.directive';
import { AuthService } from '../../core/services/auth.service';
import { getRoleAccess } from '../../core/config/role-access.config';
import { ApiService } from '../../core/services/api.service';
import { SnackBarService } from '../../shared/snack-bar/services/snackbar.service';
import { SnackBarType } from '../../shared/enums/snackbar-type.enum';
import { SkeletonTableComponent } from '../../shared/skeleton/skeleton-table.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSortModule,
    MatPaginatorModule,
    AutoPageSizeDirective,
    SkeletonTableComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit, AfterViewInit, OnDestroy {

  verTodos: boolean = false;
  tipoDeUsuario: any;

  suscripcionDiagnosticos: Subscription;
  suscripcionUsuarios: Subscription;
  displayedColumns: string[] = ['nombre', 'email', 'observaciones', 'resultado', 'imagen'];
  dataSource = new MatTableDataSource<HistoryElement>([]);
  allTableData: HistoryElement[] = [];
  usuarios: Usuario[] = [];
  searchFilter = '';
  userFilter: string | null = null;
  isLoading = false;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient, public dialog: MatDialog, private authService: AuthService, private api: ApiService, private snackBarService: SnackBarService) {
    this.suscripcionDiagnosticos = new Subscription();
    this.suscripcionUsuarios = new Subscription();
  }

  ngOnInit(): void {
    const usuario = this.authService.getUser();
    if (usuario === null) {
      return;
    }

    this.tipoDeUsuario = usuario.rol;
    this.verTodos = getRoleAccess(usuario.rol).canViewAllHistory;
    if (this.verTodos) {
      this.isLoading = true;
      this.suscripcionDiagnosticos = this.getTableData().subscribe(response => {
        this.allTableData = response;
        this.dataSource.data = response;
        this.dataSource.paginator = this.paginator;
        this.paginator.pageSize = 25;
        this.paginator.firstPage();
        this.isLoading = false;
      },
        error => {
          this.isLoading = false;
          this.snackBarService.openSnackBar('Error al cargar diagnósticos', () => {}, SnackBarType.error);
        });
      this.suscripcionUsuarios = this.http.get<any>(this.api.url('/users')).subscribe(response => {
        this.usuarios = response.filter((usuario: Usuario) => usuario.rol === 'paciente');
      });

    } else {
      this.isLoading = true;
      this.suscripcionDiagnosticos = this.getTableData().subscribe(response => {
        this.allTableData = response;
        this.dataSource.data = this.allTableData.filter(fila => fila.email === usuario.email);
        this.dataSource.paginator = this.paginator;
        this.paginator.pageSize = 25;
        this.paginator.firstPage();
        this.isLoading = false;
      },
        error => {
          this.isLoading = false;
          this.snackBarService.openSnackBar('Error al cargar diagnósticos', () => {}, SnackBarType.error);
        })
    }

  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.filterPredicate = (data: HistoryElement, filter: string) => {
      const termino = filter.trim().toLowerCase();
      const texto = `${data.id} ${data.nombre} ${data.email} ${data.observaciones} ${data.resultado}`.toLowerCase();
      const coincideTexto = texto.includes(termino);
      const coincideUsuario = this.userFilter === null || data.email === this.userFilter;
      return coincideTexto && coincideUsuario;
    };
  }

  // Filtro por texto (id/nombre/email/observaciones/resultado) en el cliente.
  applySearch(value: string): void {
    this.searchFilter = value;
    this.refrescarFiltro();
  }

  // Filtro por usuario desde el combobox (solo admin).
  cambioDeUsuario(event: any): void {
    const emailSeleccionado = event.value;
    this.userFilter = !emailSeleccionado || emailSeleccionado === 'all' ? null : emailSeleccionado;
    this.refrescarFiltro();
  }

  // Reaplica el filtro del dataSource. Se usa un espacio cuando el buscador está
  // vacío porque MatTableDataSource ignora el filtro si la cadena es vacía, y así
  // el combobox de usuario sigue filtrando por sí solo.
  private refrescarFiltro(): void {
    this.dataSource.filter = this.searchFilter.trim() || ' ';
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  getTableData() {
    return this.http.get<any>(this.api.url('/diagnosticos'));
  }

  verImagen(imagen: string) {
    this.dialog.open(ImageViewComponent, {
      data: { valor: imagen },
      panelClass: ['app-dialog', 'image-view-dialog'],
      width: 'min(80vw, 900px)',
      maxWidth: '95vw',
      height: 'min(80vh, 700px)',
      maxHeight: '95vh',
    });
  }

  ngOnDestroy(): void {
    this.suscripcionDiagnosticos.unsubscribe();
    this.suscripcionUsuarios.unsubscribe();
  }
}
