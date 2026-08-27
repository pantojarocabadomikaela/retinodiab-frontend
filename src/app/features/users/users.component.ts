import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Subscription } from "rxjs";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatDialog } from '@angular/material/dialog';
import { UserElement } from "./user-element";
import { UpdateUserComponent } from './update-user.component';
import { CreateUserComponent } from './create-user.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ROLE_LABELS } from '../../layouts/main-layout/components/header/header.constants';
import { AutoPageSizeDirective } from '../../shared/directives/auto-page-size.directive';
import { ApiService } from '../../core/services/api.service';
import { SnackBarService } from '../../shared/snack-bar/services/snackbar.service';
import { SnackBarType } from '../../shared/enums/snackbar-type.enum';
import { SkeletonTableComponent } from '../../shared/skeleton/skeleton-table.component';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatSortModule, MatPaginatorModule, AutoPageSizeDirective, SkeletonTableComponent],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss'
})

export class UsersComponent implements OnInit, AfterViewInit, OnDestroy {
    displayedColumns: string[] = ['id', 'nombre', 'email', 'rol', 'diabetes', 'acciones'];
    apiUrl = '';
    suscripcion: Subscription;
    suscripcionEliminar: Subscription;
    dataSource = new MatTableDataSource<UserElement>([]);
    searchFilter = '';
    roleFilter = 'paciente';
    roleOptions: { key: string; label: string }[] = [];
    isLoading = false;

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    constructor(private http: HttpClient, public dialog: MatDialog, private api: ApiService, private snackBarService: SnackBarService) {
        this.suscripcion = new Subscription();
        this.suscripcionEliminar = new Subscription();
        this.roleOptions = Object.entries(ROLE_LABELS).map(([key, label]) => ({ key, label }));
        this.apiUrl = this.api.url('/users');
    }

    ngOnInit(): void {
        this.isLoading = true;
        this.suscripcion = this.getTableData().subscribe(response => {
            this.dataSource.data = response;
            this.isLoading = false;
        },
            error => {
                this.isLoading = false;
                this.snackBarService.openSnackBar('Error al cargar usuarios', () => {}, SnackBarType.error);
            });
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.dataSource.filterPredicate = (data: UserElement, filter: string) => {
            const termino = filter.trim().toLowerCase();
            const texto = `${data.nombre} ${data.email} ${this.getRoleLabel(data.rol)}`.toLowerCase();
            const coincideTexto = texto.includes(termino);
            const coincideRol = data.rol === this.roleFilter;
            return coincideTexto && coincideRol;
        };
        this.refrescarFiltro();
    }

    // Filtro por texto (nombre/email/rol) en el cliente, sobre los datos ya cargados.
    applySearch(value: string): void {
        this.searchFilter = value;
        this.refrescarFiltro();
    }

    // Filtro por tipo de usuario desde el combobox. Además, la columna "Diabético"
    // solo se muestra cuando el rol seleccionado es paciente.
    applyRole(value: string): void {
        this.roleFilter = value;
        this.actualizarColumnas();
        this.refrescarFiltro();
    }

    private actualizarColumnas(): void {
        this.displayedColumns = this.roleFilter === 'paciente'
            ? ['id', 'nombre', 'email', 'rol', 'diabetes', 'acciones']
            : ['id', 'nombre', 'email', 'rol', 'acciones'];
    }

    // Reaplica el filtro del dataSource. Se usa un espacio cuando el buscador está
    // vacío porque MatTableDataSource ignora el filtro si la cadena es vacía, y así
    // el combobox de rol sigue filtrando por sí solo.
    private refrescarFiltro(): void {
        this.dataSource.filter = this.searchFilter.trim() || ' ';
        if (this.paginator) {
            this.paginator.firstPage();
        }
    }

    getRoleLabel(rol: string): string {
        return ROLE_LABELS[rol] ?? rol;
    }

    // Normaliza los posibles valores de "diabetes" (Si/true/1) para el badge.
    isDiabetico(user: UserElement): boolean {
        return ['si', 'sí', 'true', '1', 'yes'].includes(String(user.diabetes).trim().toLowerCase());
    }

    getTableData() {
        return this.http.get<any>(this.apiUrl);
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
        this.suscripcionEliminar.unsubscribe();
    }

    // Abre el diálogo de creación de usuario en este mismo modal.
    crear(): void {
        const dialogRef = this.dialog.open(CreateUserComponent, {
            panelClass: 'app-dialog',
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.suscripcion = this.getTableData().subscribe(response => {
                    this.dataSource.data = response;
                },
                    error => {
                        this.snackBarService.openSnackBar('Error al cargar usuarios', () => {}, SnackBarType.error);
                    });
            }
        });
    }

    eliminar(element: UserElement) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                titulo: 'Eliminar Usuario',
                mensaje: `¿Deseas eliminar al usuario ${element.nombre} (${element.email})? Esta acción no se puede deshacer.`,
            },
            panelClass: 'app-dialog',
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.suscripcionEliminar = this.doEliminar(element.id).subscribe(() => {
                    this.dataSource.data = this.dataSource.data.filter(user => user.id !== element.id);
                },
                    error => {
                        this.snackBarService.openSnackBar('Error al eliminar usuario', () => {}, SnackBarType.error);
                    });
            }
        });
    }

    actualizar(user: any) {
        const dialogRef = this.dialog.open(UpdateUserComponent, {
            data: user,
            panelClass: 'app-dialog',
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.suscripcion = this.getTableData().subscribe(response => {
                    this.dataSource.data = response;
                },
                    error => {
                        this.snackBarService.openSnackBar('Error al cargar usuarios', () => {}, SnackBarType.error);
                    });
            }
        });
    }

    doEliminar(id: any) {
        return this.http.delete<any>(this.apiUrl + '/' + id + '/');
    }
}
