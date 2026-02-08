import { Component } from 'solid-js';
import { AppLayout } from '@/components/layout';

const Reportes: Component = () => {
  return (
    <AppLayout title="Sección de Reportes" subtitle="Estadísticas y análisis de operaciones">
      <div class="bg-white p-8 rounded-xl border border-gray-200 text-center">
        <h2 class="text-xl font-semibold text-gray-900">Reportes</h2>
        <p class="text-gray-500 mt-2">Aquí irán las opciones para generar reportes en PDF y Excel.</p>
      </div>
    </AppLayout>
  );
};

export default Reportes;