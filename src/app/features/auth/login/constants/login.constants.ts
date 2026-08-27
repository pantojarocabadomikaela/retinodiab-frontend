export enum LoginConstants {
    BRAND_NAME = 'RETINODiAB',

    PRESENTATION_SUBTITLE = 'Sistema inteligente para la detección y gestión de retinopatía diabética',

    LOGIN_TITLE = 'Inicio de Sesión',
    LOGIN_SUBTITLE = 'Ingresa tus credenciales médicas para continuar',

    EMAIL_LABEL = 'Correo Electrónico',
    EMAIL_PLACEHOLDER = 'correo@ejemplo.com',

    PASSWORD_LABEL = 'Contraseña',
    PASSWORD_PLACEHOLDER = '*********',

    LOGIN_BUTTON = 'Ingresar',

    COPYRIGHT = '© 2026 RETINODiAB. Todos los derechos reservados.'
}

// Puntos destacados de la tarjeta de presentación (icono + texto).
export interface LoginFeature {
    icon: string;
    text: string;
}

export const LOGIN_FEATURES: LoginFeature[] = [
    { icon: 'visibility', text: 'Detección temprana de la retinopatía diabética' },
    { icon: 'hub', text: 'Modelos de inteligencia artificial para el diagnóstico' },
    { icon: 'monitor_heart', text: 'Seguimiento y evolución de cada paciente' },
    { icon: 'settings', text: 'Gestión integral de la atención médica' }
];
