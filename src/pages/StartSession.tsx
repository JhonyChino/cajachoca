import { Component, createSignal, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { User, DollarSign, Lock, ArrowRight, Coffee } from 'lucide-solid';
import { Button } from '@/components/ui';
import { createNewSession, loadActiveSession, activeSession } from '@/stores/sessionStore';

const StartSession: Component = () => {
  const navigate = useNavigate();
  const [operatorName, setOperatorName] = createSignal('');
  const [openingAmount, setOpeningAmount] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Check if there's already an active session
  createEffect(async () => {
    await loadActiveSession();
    if (activeSession()) {
      navigate('/dashboard');
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const amount = parseFloat(openingAmount());
    
    if (!operatorName().trim()) {
      setError('El nombre del responsable es requerido');
      setIsLoading(false);
      return;
    }

    if (isNaN(amount) || amount < 0) {
      setError('El monto de apertura debe ser un número válido mayor o igual a cero');
      setIsLoading(false);
      return;
    }

    const result = await createNewSession(operatorName(), amount);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Error al crear la sesión');
    }
    
    setIsLoading(false);
  };

  return (
    <div class="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header class="bg-white border-b border-gray-200 px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Coffee class="w-8 h-8 text-blue-600" />
            <h1 class="font-bold text-gray-900 text-xl">Caja Choca</h1>
          </div>
          <button class="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <span class="text-sm">Ayuda</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main class="flex-1 flex items-center justify-center p-4">
        <div class="w-full max-w-md">
          {/* Card */}
          <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Blue Header */}
            <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-center">
              <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock class="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {/* Form */}
            <div class="p-8">
              <h2 class="text-2xl font-bold text-center text-gray-900 mb-2">
                Iniciar Jornada
              </h2>
              <p class="text-center text-gray-500 mb-8">
                Ingrese los datos para la apertura de caja hoy.
              </p>

              {error() && (
                <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error()}
                </div>
              )}

              <form onSubmit={handleSubmit} class="space-y-6">
                {/* Operator Name */}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable
                  </label>
                  <div class="relative">
                    <User class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={operatorName()}
                      onInput={(e) => setOperatorName(e.currentTarget.value)}
                      placeholder="Ej. Juan Pérez"
                      class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Opening Amount */}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Monto de Apertura de Caja
                  </label>
                  <div class="relative">
                    <DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={openingAmount()}
                      onInput={(e) => setOpeningAmount(e.currentTarget.value)}
                      placeholder="0.00"
                      class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <p class="text-xs text-gray-500 mt-2">
                    ℹ️ Este monto será el saldo base para el arqueo final.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  class="w-full py-4 text-lg font-semibold flex items-center justify-center gap-2"
                  disabled={isLoading()}
                >
                  {isLoading() ? (
                    <>
                      <span class="animate-spin">⏳</span>
                      Abriendo...
                    </>
                  ) : (
                    <>
                      Abrir Caja e Iniciar
                      <ArrowRight class="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Change User Link */}
              <div class="mt-6 text-center">
                <button class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  ¿No es su turno? Cambiar de usuario
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer class="text-center mt-8 text-gray-400 text-sm">
            <div class="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Coffee class="w-8 h-8 text-gray-400" />
            </div>
            <p>© 2026 Sistema Caja Choca. Todos los derechos reservados.</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default StartSession;