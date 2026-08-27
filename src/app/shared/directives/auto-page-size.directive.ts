import { AfterViewInit, Directive, ElementRef, Inject, Input, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';

const FILA_MINIMA = 1;
const MARGEN_SUPERIOR = 4;
const ALTURA_FILA_FALLBACK = 34;

@Directive({
    selector: '[appAutoPageSize]',
    standalone: true
})
export class AutoPageSizeDirective implements AfterViewInit, OnDestroy {
    @Input() appPaginator!: MatPaginator;

    private observer?: ResizeObserver;
    private readonly esNavegador: boolean;

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        private ngZone: NgZone,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.esNavegador = isPlatformBrowser(this.platformId);
    }

    ngAfterViewInit(): void {
        if (!this.esNavegador) {
            return;
        }

        this.ajustar();

        this.observer = new ResizeObserver(() => this.ngZone.run(() => this.ajustar()));
        this.observer.observe(this.elementRef.nativeElement);
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }

    private ajustar(): void {
        const contenedor = this.elementRef.nativeElement;
        const alturaDisponible = contenedor.clientHeight;

        if (alturaDisponible <= 0 || !this.appPaginator) {
            return;
        }

        const alturaFila = this.obtenerAlturaFila(contenedor);
        const filas = Math.max(FILA_MINIMA, Math.floor((alturaDisponible - alturaFila - MARGEN_SUPERIOR) / alturaFila));

        if (this.appPaginator.pageSize !== filas) {
            this.appPaginator.pageSize = filas;
        }
    }

    private obtenerAlturaFila(elemento: HTMLElement): number {
        const valor = getComputedStyle(elemento).getPropertyValue('--table-row-height').trim();
        const px = parseFloat(valor);
        return Number.isFinite(px) && px > 0 ? px : ALTURA_FILA_FALLBACK;
    }
}
