import { Component } from 'solid-js';
import { AppLayout } from '@/components/layout';

const Historial: Component = () => {
  return (
    <AppLayout title="Historial de Transacciones" subtitle="Consulta y filtra los movimientos detallados de la caja">
      <div class="bg-white p-8 rounded-xl border border-gray-200 text-center">
        <h2 class="text-xl font-semibold text-gray-900">Historial de Transacciones</h2>
        <p class="text-gray-500 mt-2">Aquí irá la tabla con el historial completo de transacciones.</p>
      </div>
    </AppLayout>
  );
};

export default Historial;