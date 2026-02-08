import { Component } from 'solid-js';
import { AppLayout } from '@/components/layout';

const Caja: Component = () => {
  return (
    <AppLayout title="Caja" subtitle="Gestión de operaciones de caja">
      <div class="bg-white p-8 rounded-xl border border-gray-200 text-center">
        <h2 class="text-xl font-semibold text-gray-900">Página de Caja</h2>
        <p class="text-gray-500 mt-2">Aquí irán las operaciones de registro de ingresos y egresos.</p>
      </div>
    </AppLayout>
  );
};

export default Caja;