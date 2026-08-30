# Documentación de la lógica de la aplicación

Este documento resume la arquitectura, los flujos principales y la lógica de negocio de la aplicación Angular + Django.

## 1) Arquitectura general

```mermaid
flowchart LR
    A[Usuario / navegador] --> B[Frontend Angular]
    B --> C[Componentes y rutas]
    C --> D[AuthService / localStorage]
    C --> E[ApiService]
    E --> F[Backend Django REST]
    F --> G[Tasks API Views]
    G --> H[Modelos: User, Diagnostico, Manual]
    G --> I[AI Inference]
    I --> J[Predicción de retinografía]
    H --> K[SQLite]

    B --> L[Guards: authGuard, roleGuard]
    L --> M[Roles: administrador, servicio, paciente]
```

## 2) Flujo principal de autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend Angular
    participant A as AuthService
    participant API as Backend Django
    participant DB as SQLite

    U->>F: Ingresa email y password
    F->>API: POST /api/v1/validate-credentials/
    API->>DB: Busca usuario por email
    DB-->>API: Usuario o no encontrado
    API-->>F: Datos del usuario autenticado
    F->>A: login(usuario)
    A->>A: Guarda usuario en localStorage
    F->>F: Navega a /admin/dashboard
```

## 3) Lógica de permisos y roles

```mermaid
flowchart TD
    R[Router Angular] --> G1[authGuard]
    G1 -->|si existe sesión| G2[roleGuard]
    G1 -->|no existe sesión| L[login]

    G2 --> C1{rol?}
    C1 -->|administrador| P1[Acceso a dashboard, users, diagnostico, historial, manual, editor]
    C1 -->|servicio| P2[Acceso a dashboard, diagnostico, historial, manual]
    C1 -->|paciente| P3[Acceso a dashboard, historial, manual]

    P1 --> A[Permite gestión completa]
    P2 --> B[Sin gestionar usuarios]
    P3 --> C[Acceso al historial propio]
```

## 4) Flujo de creación de diagnóstico

```mermaid
sequenceDiagram
    participant U as Usuario / Servicio
    participant F as Angular
    participant D as DiagnosticDialogComponent
    participant API as Django
    participant IA as AI Inference
    participant DB as SQLite

    U->>F: Abre “Crear diagnóstico”
    F->>D: Abre modal de diagnóstico
    D->>API: GET /api/v1/users
    API-->>D: Lista de pacientes
    U->>D: Selecciona paciente + sube imagen + observaciones
    D->>API: POST /api/v1/validate-image/
    API->>IA: Preprocesa imagen y ejecuta modelo
    IA-->>API: Resultado + probabilidades
    API->>DB: Guarda Diagnostico
    API-->>D: mensaje, nombre, prediction, probabilities
    D-->>F: Cierra modal y actualiza tabla
```

## 5) Flujo de edición de diagnóstico

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Angular
    participant E as UpdateDiagnosticComponent
    participant API as Django
    participant DB as SQLite

    U->>F: Click en editar diagnóstico
    F->>E: Abre modal con datos del diagnóstico
    E->>API: GET /api/v1/users
    API-->>E: Pacientes disponibles
    U->>E: Cambia paciente/observaciones y opcionalmente imagen
    E->>API: PUT /api/v1/diagnosticos/{id}/
    API->>DB: Actualiza registro
    API-->>E: Respuesta exitosa
    E-->>F: Cierra modal y recarga listado
```

## 6) Flujo detallado del backend para generar un diagnóstico

```mermaid
sequenceDiagram
    participant U as Usuario / Servicio
    participant F as Frontend Angular
    participant V as UserView
    participant P as tasks.ai.preprocessing
    participant IA as tasks.ai.inference
    participant M as Modelo PyTorch
    participant D as Base de datos (SQLite)

    U->>F: Selecciona paciente y agrega imagen
    F->>V: POST /api/v1/validate-image/
    V->>V: Lee request.FILES['imageFile']
    V->>V: Obtiene email y observaciones
    V->>P: Preprocesa la imagen recibida
    P->>P: Normaliza resolución, RGB y tensor de entrada
    P-->>V: Imagen lista para inferencia
    V->>IA: predict_image(image_bytes)
    IA->>M: Ejecuta EfficientNetB0 Fold 4
    M-->>IA: logits + probabilidades
    IA-->>V: Objeto con class_id, label, probabilities, model_id, device
    V->>V: Genera nombre único para la imagen
    V->>V: Codifica la imagen a base64
    V->>D: Crea registro Diagnostico(email, nombre, resultado, observaciones, imagen)
    D-->>V: Guardado exitoso
    V-->>F: JSON con mensaje, nombre, prediction y probabilities
    F->>F: Muestra resultado en la interfaz y recarga la tabla
```

## 6.1) Lógica de preprocesado e inferencia

- El backend recibe la imagen desde el frontend como `request.FILES['imageFile']`.
- La imagen se lee una sola vez para evitar duplicar el flujo de datos.
- Se ejecuta `predict_image(image_bytes)` desde el módulo de IA.
- El preprocesado prepara la retinografía para el formato requerido por el modelo, incluyendo conversiones y normalización necesarias para la entrada del modelo de PyTorch.
- El modelo devuelve la clase predictiva y las probabilidades por clase.
- El sistema guarda la imagen codificada en base64 dentro del modelo `Diagnostico` para poder visualizarla luego en la vista de detalle/imagen.
- Además, se guarda el resultado textual del diagnóstico y las observaciones del usuario.

## 7) Flujo de visualización de imagen

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Angular
    participant V as ImageViewComponent
    participant D as Dialog

    U->>F: Click en botón ver imagen
    F->>V: Abre modal con base64 de la imagen
    V->>D: Crea Dialog con imagen en una ventana redimensionable
    D-->>U: Muestra imagen y permite mover/redimensionar la ventana
    U->>D: Cierra modal
    D-->>V: Cierra componente
```

## 8) Lógica de datos / modelos

```mermaid
erDiagram
    USER ||--o{ DIAGNOSTICO : tiene
    USER {
        int id
        string email
        string nombre
        string password
        string rol
        bool diabetes
        datetime fecha_nacimiento
    }

    DIAGNOSTICO {
        int id
        string email
        string nombre
        string imagen
        string resultado
        string observaciones
    }

    MANUAL {
        int id
        string tipo
        text fuente
    }
```

## 9) Endpoints principales del backend

```text
/api/v1/users
  - GET: listar usuarios
  - POST: crear usuario
  - PUT/PATCH/DELETE: gestión por id

/api/v1/diagnosticos
  - GET: listar diagnósticos
  - POST: crear diagnóstico (si se usa en alguna ruta de servicio)
  - PUT/PATCH/DELETE: edición y eliminación por id

/api/v1/manuals
  - GET/POST/PUT/DELETE: CRUD de manuales

/api/v1/validate-credentials/
  - POST: login

/api/v1/validate-image/
  - POST: subir imagen para inferencia y guardar diagnóstico
```

## 10) Lógica de negocio resumida

### Frontend
- El usuario inicia sesión con credenciales.
- Los guards validan si hay sesión activa y el tipo de rol.
- El `AuthService` guarda los datos del usuario en `localStorage`.
- `role-access.config.ts` define qué pantallas puede abrir cada rol.
- Los componentes de historial, diagnóstico y usuarios consumen endpoints del backend.
- La imagen del diagnóstico se maneja como base64 y se presenta en un modal especial.

### Backend
- Django REST Framework expone CRUD para usuarios, diagnósticos y manuales.
- `User.authenticate()` valida contraseña local.
- `UserView.evaluateImage()` recibe la imagen, la procesa con IA, obtiene la predicción y la guarda en la base de datos.
- `DiagnosticoSerializer` agrega `paciente_nombre` buscándolo por el email del paciente.
- Los modelos quedan en SQLite por defecto (`db.sqlite3`).

## 11) Mapa de rutas principales

```mermaid
flowchart LR
    A["/login"] --> B[LoginComponent]
    B --> C[AuthService]
    C --> D["/admin/dashboard"]

    D --> E[Dashboard]
    D --> F[UsersComponent]
    D --> G[DiagnosticComponent]
    D --> H[HistoryComponent]
    D --> I[UserGuideComponent]
    D --> J[ManualEditorComponent]
```

## 12) Resumen ejecutivo

La aplicación sigue un patrón clásico de frontend Angular + backend Django REST:

1. El usuario inicia sesión.
2. El frontend usa guards para controlar acceso según el rol.
3. El backend valida credenciales y procesa imágenes con IA.
4. Los diagnósticos se persisten en SQLite.
5. El frontend presenta tablas, formularios, historiales y la visualización de imágenes.

Este diseño permite poner la lógica de IA en el backend y mantener el frontend orientado a interfaz y experiencia de usuario.
