import { Component, createSignal, Show, For } from 'solid-js';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  BarChart3,
  ArrowRight,
  FileText,
  Calendar,
  Download,
  X
} from 'lucide-solid';

interface ReportCardProps {
  title: string;
  description: string;
  icon: any;
  iconBgColor: string;
  iconColor: string;
  reportType: string;
  onGenerate: (type: string) => void;
}

const ReportCard: Component<ReportCardProps> = (props) => {
  const Icon = props.icon;
  
  return (
    <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-start gap-4">
        <div class={`w-14 h-14 ${props.iconBgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon class={`w-7 h-7 ${props.iconColor}`} />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{props.title}</h3>
          <p class="text-sm text-gray-500 leading-relaxed mb-4">{props.description}</p>
          <button
            onClick={() => props.onGenerate(props.reportType)}
            class="text-blue-600 hover:text-blue-700 text-sm font-semibold uppercase tracking-wide flex items-center gap-1 transition-colors"
          >
            Generar Reporte
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Reportes: Component = () => {
  const [showModal, setShowModal] = createSignal(false);
  const [selectedReport, setSelectedReport] = createSignal<string | null>(null);
  const [startDate, setStartDate] = createSignal('');
  const [endDate, setEndDate] = createSignal('');
  const [reportFormat, setReportFormat] = createSignal<'pdf' | 'excel'>('pdf');
  const [isGenerating, setIsGenerating] = createSignal(false);

  const reports = [
    {
      title: 'Reporte de Ingresos del Día',
      description: 'Detalle pormenorizado de todas las ventas, abonos y entradas de efectivo registradas durante la jornada actual.',
      icon: TrendingUp,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      reportType: 'income'
    },
    {
      title: 'Reporte de Egresos del Día',
      description: 'Resumen de gastos operativos, pagos a proveedores y retiros de caja chica efectuados en el día.',
      icon: TrendingDown,
      iconBgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      reportType: 'expense'
    },
    {
      title: 'Balance Diario Consolidado',
      description: 'Comparativa entre ingresos y egresos para determinar la utilidad neta y el saldo final de caja al cierre.',
      icon: Scale,
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      reportType: 'balance'
    },
    {
      title: 'Resumen Semanal de Comedor',
      description: 'Análisis de consumos semanales, platos más vendidos y flujo de clientes en el área de cafetería.',
      icon: BarChart3,
      iconBgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
      reportType: 'weekly'
    }
  ];

  const handleGenerate = (reportType: string) => {
    setSelectedReport(reportType);
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    setEndDate(today);
    setStartDate(reportType === 'weekly' ? weekAgo : today);
    setShowModal(true);
  };

  const handleConfirmGenerate = async () => {
    if (!selectedReport() || !startDate() || !endDate()) return;

    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert(`Reporte ${selectedReport()} generado en formato ${reportFormat().toUpperCase()}`);
    
    setIsGenerating(false);
    setShowModal(false);
  };

  const getReportTitle = () => {
    const report = reports.find(r => r.reportType === selectedReport());
    return report?.title || 'Reporte';
  };

  return (
    <AppLayout 
      title="Sección de Reportes" 
      subtitle="Estadísticas y análisis"
    >
      <div class="space-y-8">
        {/* Header Section */}
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Estadísticas y Análisis</h2>
          <p class="text-gray-500">Seleccione un reporte para visualizar el detalle de las operaciones.</p>
        </div>

        {/* Reports Grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <For each={reports}>
            {(report) => (
              <ReportCard
                title={report.title}
                description={report.description}
                icon={report.icon}
                iconBgColor={report.iconBgColor}
                iconColor={report.iconColor}
                reportType={report.reportType}
                onGenerate={handleGenerate}
              />
            )}
          </For>
        </div>

        {/* Info Alert */}
        <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-3">
          <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <FileText class="w-4 h-4 text-gray-600" />
          </div>
          <p class="text-sm text-gray-600">
            Todos los reportes se generan en formato PDF y Excel para su descarga. 
            Los datos se actualizan en tiempo real conforme se registran transacciones en la sección de Caja.
          </p>
        </div>
      </div>

      {/* Generate Report Modal */}
      <Show when={showModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-bold text-gray-900">Generar Reporte</h2>
                <p class="text-sm text-gray-500">{getReportTitle()}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X class="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div class="space-y-6">
              {/* Date Range */}
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <span class="flex items-center gap-2">
                      <Calendar class="w-4 h-4" />
                      Fecha Inicio
                    </span>
                  </label>
                  <input
                    type="date"
                    value={startDate()}
                    onInput={(e) => setStartDate(e.currentTarget.value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <span class="flex items-center gap-2">
                      <Calendar class="w-4 h-4" />
                      Fecha Fin
                    </span>
                  </label>
                  <input
                    type="date"
                    value={endDate()}
                    onInput={(e) => setEndDate(e.currentTarget.value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <span class="flex items-center gap-2">
                    <Download class="w-4 h-4" />
                    Formato de Exportación
                  </span>
                </label>
                <div class="flex gap-4">
                  <button
                    onClick={() => setReportFormat('pdf')}
                    class={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      reportFormat() === 'pdf'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => setReportFormat('excel')}
                    class={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      reportFormat() === 'excel'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Excel
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div class="space-y-3 pt-4">
                <Button
                  onClick={handleConfirmGenerate}
                  disabled={isGenerating() || !startDate() || !endDate()}
                  class="w-full py-3"
                >
                  {isGenerating() ? (
                    <span class="flex items-center gap-2">
                      <span class="animate-spin">⏳</span>
                      Generando...
                    </span>
                  ) : (
                    <span class="flex items-center gap-2">
                      <Download class="w-4 h-4" />
                      Descargar Reporte
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={isGenerating()}
                  class="w-full py-3"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </AppLayout>
  );
};

export default Reportes;