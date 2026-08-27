import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { getHomePath } from '../../core/config/role-access.config';

@Component({
    selector: 'app-home-redirect',
    standalone: true,
    template: ''
})
export class HomeRedirectComponent {
    private router = inject(Router);

    constructor() {
        this.router.navigateByUrl(getHomePath());
    }
}
