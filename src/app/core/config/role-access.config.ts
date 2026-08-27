import { MenuItem } from '../../layouts/main-layout/models/menu-item.model';

export interface RoleAccess {
    menus: MenuItem[];
    canViewAllHistory: boolean;
    canManageUsers: boolean;
    manualIndex: number;
}

// Ítems hoja (con ruta navegable).
const MENU: {
    HISTORIAL: MenuItem;
    DIAGNOSTICO: MenuItem;
    USUARIOS: MenuItem;
    MANUAL: MenuItem;
    CREAR_MANUAL: MenuItem;
} = {
    HISTORIAL: { title: 'Historial', path: '/admin/historial', icon: 'history' },
    DIAGNOSTICO: { title: 'Diagnostico', path: '/admin/diagnostico', icon: 'biotech' },
    USUARIOS: { title: 'Usuarios', path: '/admin/users', icon: 'group' },
    MANUAL: { title: 'Manual', path: '/admin/manual', icon: 'menu_book' },
    CREAR_MANUAL: { title: 'Crear manual', path: '/admin/editor', icon: 'edit_note' }
};

// Menús padre que desglosan en submenús.
const PACIENTES: MenuItem = {
    title: 'Pacientes',
    icon: 'people',
    children: [MENU.HISTORIAL, MENU.DIAGNOSTICO]
};

const AYUDA: MenuItem = {
    title: 'Ayuda',
    icon: 'help',
    children: [MENU.MANUAL, MENU.CREAR_MANUAL]
};

export const HOME_PATH = '/admin/dashboard';

export const HOME_MENU_ITEM: MenuItem = { title: 'Inicio', path: HOME_PATH, icon: 'home' };

export const ROLE_ACCESS: Record<string, RoleAccess> = {
    administrador: {
        menus: [
            PACIENTES,
            MENU.USUARIOS,
            AYUDA
        ],
        canViewAllHistory: true,
        canManageUsers: true,
        manualIndex: 1
    },
    servicio: {
        menus: [
            PACIENTES,
            { ...AYUDA, children: [MENU.MANUAL] }
        ],
        canViewAllHistory: true,
        canManageUsers: false,
        manualIndex: 0
    },
    paciente: {
        menus: [
            { ...PACIENTES, children: [MENU.HISTORIAL] },
            { ...AYUDA, children: [MENU.MANUAL] }
        ],
        canViewAllHistory: false,
        canManageUsers: false,
        manualIndex: 2
    }
};

export function getRoleAccess(rol: string | null | undefined): RoleAccess {
    return ROLE_ACCESS[rol ?? ''] ?? ROLE_ACCESS['paciente'];
}

export function getHomePath(): string {
    return HOME_PATH;
}

// Devuelve todos los ítems navegables (hojas con ruta) de una lista de menús.
export function flattenMenuItems(menus: MenuItem[]): MenuItem[] {
    return menus.flatMap(menu => menu.children?.length ? flattenMenuItems(menu.children) : [menu]);
}

export function hasMenuPath(rol: string | null | undefined, routePath: string): boolean {
    const menus = flattenMenuItems(getRoleAccess(rol).menus);
    return menus.some(menu => menu.path === '/admin/' + routePath);
}

// Breadcrumb de la ContextBar: "Inicio" + ancestros hasta el ítem hoja de la URL actual.
// Si la URL no coincide con ningún menú, devuelve solo "Inicio".
export function getBreadcrumbs(rol: string | null | undefined, url: string): MenuItem[] {
    const currentPath = url.split('?')[0];
    const crumbs: MenuItem[] = [];
    const menus = getRoleAccess(rol).menus;

    const find = (items: MenuItem[], ancestors: MenuItem[]): boolean => {
        for (const item of items) {
            if (item.path === currentPath) {
                crumbs.push(...ancestors, item);
                return true;
            }
            if (item.children?.length && find(item.children, [...ancestors, item])) {
                return true;
            }
        }
        return false;
    };

    find(menus, []);
    return [HOME_MENU_ITEM, ...crumbs];
}
