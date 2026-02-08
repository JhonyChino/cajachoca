import { Component } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { 
  LayoutDashboard, 
  Wallet, 
  History, 
  BarChart3, 
  Settings,
  Coffee
} from 'lucide-solid';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: Component<{ class?: string }>;
}

const mainNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { path: '/caja', label: 'Caja', icon: Wallet },
  { path: '/historial', label: 'Historial', icon: History },
  { path: '/reportes', label: 'Reportes', icon: BarChart3 },
];

const bottomNavItems: NavItem[] = [
  { path: '/configuracion', label: 'Configuración', icon: Settings },
];

const Sidebar: Component = () => {
  const location = useLocation();

  const NavItemComponent: Component<{ item: NavItem }> = (props) => {
    const Icon = props.item.icon;
    const isActive = () => location.pathname === props.item.path;

    return (
      <A
        href={props.item.path}
        class={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
          isActive() 
            ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-600' 
            : 'text-gray-600 hover:bg-gray-100'
        )}
      >
        <Icon class={cn('w-5 h-5', isActive() ? 'text-blue-600' : 'text-gray-500')} />
        <span class="font-medium">{props.item.label}</span>
      </A>
    );
  };

  return (
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Coffee class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="font-bold text-gray-900 text-lg leading-tight">Cafetería Hub</h1>
            <p class="text-xs text-gray-500">Control de Caja</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => (
          <NavItemComponent item={item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div class="p-4 border-t border-gray-200 space-y-1">
        {bottomNavItems.map((item) => (
          <NavItemComponent item={item} />
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;