import { Component, Show } from 'solid-js';
import { User } from 'lucide-solid';
import { activeSession } from '@/stores/sessionStore';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header: Component<HeaderProps> = (props) => {
  return (
    <header class="bg-white border-b border-gray-200 px-8 py-4">
      <div class="flex items-center justify-between">
        {/* Left side - Title */}
        <div>
          {props.title && (
            <h1 class="text-2xl font-bold text-gray-900">{props.title}</h1>
          )}
          {props.subtitle && (
            <p class="text-sm text-gray-500 mt-1">{props.subtitle}</p>
          )}
        </div>

        {/* Right side - User info */}
        <div class="flex items-center gap-4">
          <div class="text-right">
            <Show 
              when={activeSession()} 
              fallback={
                <>
                  <p class="text-sm font-medium text-gray-900">Invitado</p>
                  <p class="text-xs text-gray-500">Sin sesión activa</p>
                </>
              }
            >
              {(session) => (
                <>
                  <p class="text-sm font-medium text-gray-900">{session().operator_name}</p>
                  <p class="text-xs text-gray-500">Sesión iniciada como</p>
                </>
              )}
            </Show>
          </div>
          <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User class="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;