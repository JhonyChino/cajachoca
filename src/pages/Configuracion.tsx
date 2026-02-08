import { Component } from 'solid-js';
import { AppLayout } from '@/components/layout';

const Configuracion: Component = () => {
  return (
    <AppLayout title="Configuración" subtitle="Ajustes del sistema">
      <div class="bg-white p-8 rounded-xl border border-gray-200 text-center">
        <h2 class="text-xl font-semibold text-gray-900">Configuración</h2>
        <p class="text-gray-500 mt-2">Aquí irán las opciones de configuración y backup.</p>
      </div>
    </AppLayout>
  );
};

export default Configuracion;