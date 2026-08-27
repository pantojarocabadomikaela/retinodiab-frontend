import {Component, Inject, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {LoginConstants, LOGIN_FEATURES, LoginFeature} from "./constants/login.constants";
import {AuthService} from "../../../core/services/auth.service";
import {MatIconModule} from "@angular/material/icon";
import {CommonModule, isPlatformBrowser} from "@angular/common";
import {Router} from "@angular/router";
import {Observable, Subscription} from "rxjs";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {SnackBarService} from "../../../shared/snack-bar/services/snackbar.service";
import {SnackBarType} from "../../../shared/enums/snackbar-type.enum";
import {getHomePath} from "../../../core/config/role-access.config";
import {ApiService} from "../../../core/services/api.service";

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        MatIconModule,
        ReactiveFormsModule,
        CommonModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
    loginForm!: FormGroup;
    loginConstants = LoginConstants;
    loginFeatures: LoginFeature[] = LOGIN_FEATURES;
    hidePassword: boolean = true;
    private suscripcion: Subscription;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private http: HttpClient,
        private authService: AuthService,
        private snackBarService: SnackBarService,
        private api: ApiService,
        @Inject(PLATFORM_ID) private platformId: Object) {
        this.suscripcion = new Subscription();
    }

    onSubmit(): void {
        if (this.loginForm.valid) {
            this.suscripcion = this.authenticate(this.loginForm.value).subscribe(
                response => {
                    this.authService.login(response);
                    this.router.navigate([getHomePath()]);
                },
                error => {
                    this.snackBarService.openSnackBar(
                        'Error de login: ' + (error?.error?.mensaje ?? 'Credenciales incorrectas'),
                        () => {},
                        SnackBarType.error
                    );
                })
        }
    }

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId) && this.authService.isAuthenticated()) {
            this.router.navigate([getHomePath()]);
            return;
        }
        this.loginForm = this.formBuilder.group({
            email: ['', [Validators.required, Validators.minLength(4)]],
            password: ['', [Validators.required, Validators.minLength(4)]]
        })
    }

    authenticate(value: any): Observable<any> {
        const body = new URLSearchParams();
        body.set('email', value.email);
        body.set('password', value.password);

        const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded'
        });

        return this.http.post<any>(this.api.url('/validate-credentials/'), body.toString(), {headers});
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe();
    }
}
