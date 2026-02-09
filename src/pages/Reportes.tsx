import { Component, createSignal, Show, For, createEffect } from 'solid-js';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { reportApi } from '@/lib/api';
import { config } from '@/stores/configStore';
import { invoke } from '@tauri-apps/api/core';
import type { Category } from '@/lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Scale,
  Tags,
  ArrowRight,
  FileText,
  Calendar,
  Download,
  X,
  ChevronDown,
  Filter
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
  const [showCategoryModal, setShowCategoryModal] = createSignal(false);
  const [selectedReport, setSelectedReport] = createSignal<string | null>(null);
  const [startDate, setStartDate] = createSignal('');
  const [endDate, setEndDate] = createSignal('');
  const [reportFormat, setReportFormat] = createSignal<'pdf' | 'excel'>('pdf');
  const [isGenerating, setIsGenerating] = createSignal(false);
  
  // Category report states
  const [incomeCategories, setIncomeCategories] = createSignal<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = createSignal<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = createSignal<number | null>(null);
  const [selectedCategoryType, setSelectedCategoryType] = createSignal<'income' | 'expense'>('income');
  const [categoryReportFormat, setCategoryReportFormat] = createSignal<'pdf' | 'excel'>('pdf');
  const [categoryStartDate, setCategoryStartDate] = createSignal('');
  const [categoryEndDate, setCategoryEndDate] = createSignal('');
  const [isGeneratingCategory, setIsGeneratingCategory] = createSignal(false);

  const reports = [
    {
      title: 'Reporte de Ingresos del Dia',
      description: 'Detalle pormenorizado de todas las ventas, abonos y entradas de efectivo registradas durante la jornada actual.',
      icon: TrendingUp,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      reportType: 'income'
    },
    {
      title: 'Reporte de Egresos del Dia',
      description: 'Resumen de gastos operativos, pagos a proveedores y retiros de caja chica efectuados en el dia.',
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
    }
  ];

  // Load categories when category modal opens
  createEffect(() => {
    if (showCategoryModal()) {
      loadCategories();
      // Set default dates
      const today = new Date().toISOString().split('T')[0];
      setCategoryStartDate(today);
      setCategoryEndDate(today);
    }
  });

  const loadCategories = async () => {
    try {
      const incomeResponse = await invoke('get_categories_by_type', { categoryType: 'income' }) as { success: boolean; data: Category[] };
      const expenseResponse = await invoke('get_categories_by_type', { categoryType: 'expense' }) as { success: boolean; data: Category[] };
      
      if (incomeResponse.success) setIncomeCategories(incomeResponse.data);
      if (expenseResponse.success) setExpenseCategories(expenseResponse.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleGenerate = (reportType: string) => {
    setSelectedReport(reportType);
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    
    setEndDate(today);
    setStartDate(today);
    setShowModal(true);
  };

  const handleConfirmGenerate = async () => {
    if (!selectedReport() || !startDate() || !endDate()) return;

    setIsGenerating(true);
    
    try {
      const response = await reportApi.generateReport(
        selectedReport()!,
        startDate(),
        endDate(),
        reportFormat(),
        config().downloadPath || undefined
      );
      
      if (response.success && response.file_path) {
        alert(`Reporte generado exitosamente!\n\nArchivo guardado en:\n${response.file_path}`);
        setShowModal(false);
      } else {
        alert(`Error al generar reporte: ${response.error || 'Error desconocido'}`);
      }
    } catch (err) {
      alert(`Error al generar reporte: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCategoryReportClick = () => {
    setShowCategoryModal(true);
  };

  const handleGenerateCategoryReport = async () => {
    if (!selectedCategoryId() || !categoryStartDate() || !categoryEndDate()) {
      alert('Por favor selecciona una categoria y el rango de fechas');
      return;
    }

    setIsGeneratingCategory(true);
    
    try {
      // Format: category_{id}_{type}
      const reportType = `category_${selectedCategoryId()}_${selectedCategoryType()}`;
      
      const response = await reportApi.generateReport(
        reportType,
        categoryStartDate(),
        categoryEndDate(),
        categoryReportFormat(),
        config().downloadPath || undefined
      );
      
      if (response.success && response.file_path) {
        alert(`Reporte generado exitosamente!\n\nArchivo guardado en:\n${response.file_path}`);
        setShowCategoryModal(false);
        // Reset state
        setSelectedCategoryId(null);
        setSelectedCategoryType('income');
      } else {
        alert(`Error al generar reporte: ${response.error || 'Error desconocido'}`);
      }
    } catch (err) {
      alert(`Error al generar reporte: ${err}`);
    } finally {
      setIsGeneratingCategory(false);
    }
  };

  const getReportTitle = () => {
    const report = reports.find(r => r.reportType === selectedReport());
    return report?.title || 'Reporte';
  };

  const getSelectedCategoryName = () => {
    const categories = selectedCategoryType() === 'income' ? incomeCategories() : expenseCategories();
    const category = categories.find(c => c.id === selectedCategoryId());
    return category?.name || 'Seleccionar categoria';
  };

  return (
    <AppLayout 
      title="Seccion de Reportes" 
      subtitle="Estadisticas y analisis"
    >
      <div class="space-y-8">
        {/* Header Section */}
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Estadisticas y Analisis</h2>
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
          
          {/* Category Report Card */}
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Tags class="w-7 h-7 text-purple-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Reporte por Categoria</h3>
                <p class="text-sm text-gray-500 leading-relaxed mb-4">
                  Genera reportes detallados filtrados por categoria especifica de ingresos o egresos.
                </p>
                <button
                  onClick={handleCategoryReportClick}
                  class="text-blue-600 hover:text-blue-700 text-sm font-semibold uppercase tracking-wide flex items-center gap-1 transition-colors"
                >
                  Generar Reporte
                  <ArrowRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-3">
          <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <FileText class="w-4 h-4 text-gray-600" />
          </div>
          <p class="text-sm text-gray-600">
            Todos los reportes se generan en formato PDF y Excel para su descarga. 
            Los datos se actualizan en tiempo real conforme se registran transacciones en la seccion de Caja.
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
                    Formato de Exportacion
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

      {/* Category Report Modal */}
      <Show when={showCategoryModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-bold text-gray-900">Reporte por Categoria</h2>
                <p class="text-sm text-gray-500">Selecciona una categoria y el rango de fechas</p>
              </div>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setSelectedCategoryId(null);
                }}
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X class="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div class="space-y-6">
              {/* Type Selection */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Tipo de Transaccion</label>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setSelectedCategoryType('income');
                      setSelectedCategoryId(null);
                    }}
                    class={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      selectedCategoryType() === 'income'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <TrendingUp class={`w-5 h-5 ${selectedCategoryType() === 'income' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span class={selectedCategoryType() === 'income' ? 'font-medium text-green-700' : 'text-gray-600'}>Ingresos</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategoryType('expense');
                      setSelectedCategoryId(null);
                    }}
                    class={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      selectedCategoryType() === 'expense'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <TrendingDown class={`w-5 h-5 ${selectedCategoryType() === 'expense' ? 'text-red-600' : 'text-gray-400'}`} />
                    <span class={selectedCategoryType() === 'expense' ? 'font-medium text-red-700' : 'text-gray-600'}>Egresos</span>
                  </button>
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <span class="flex items-center gap-2">
                    <Tags class="w-4 h-4" />
                    Categoria
                  </span>
                </label>
                <div class="relative">
                  <select
                    value={selectedCategoryId() || ''}
                    onChange={(e) => setSelectedCategoryId(Number(e.currentTarget.value) || null)}
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                  >
                    <option value="">Selecciona una categoria</option>
                    <For each={selectedCategoryType() === 'income' ? incomeCategories() : expenseCategories()}>
                      {(category) => (
                        <option value={category.id}>{category.name}</option>
                      )}
                    </For>
                  </select>
                  <ChevronDown class="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
                <Show when={selectedCategoryId()}>
                  <p class="text-sm text-gray-500 mt-2">
                    Categoria seleccionada: <span class="font-medium text-gray-700">{getSelectedCategoryName()}</span>
                  </p>
                </Show>
              </div>

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
                    value={categoryStartDate()}
                    onInput={(e) => setCategoryStartDate(e.currentTarget.value)}
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
                    value={categoryEndDate()}
                    onInput={(e) => setCategoryEndDate(e.currentTarget.value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <span class="flex items-center gap-2">
                    <Download class="w-4 h-4" />
                    Formato de Exportacion
                  </span>
                </label>
                <div class="flex gap-4">
                  <button
                    onClick={() => setCategoryReportFormat('pdf')}
                    class={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      categoryReportFormat() === 'pdf'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => setCategoryReportFormat('excel')}
                    class={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      categoryReportFormat() === 'excel'
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
                  onClick={handleGenerateCategoryReport}
                  disabled={isGeneratingCategory() || !selectedCategoryId() || !categoryStartDate() || !categoryEndDate()}
                  class="w-full py-3"
                >
                  {isGeneratingCategory() ? (
                    <span class="flex items-center gap-2">
                      <span class="animate-spin">⏳</span>
                      Generando...
                    </span>
                  ) : (
                    <span class="flex items-center gap-2">
                      <Filter class="w-4 h-4" />
                      Generar Reporte por Categoria
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setSelectedCategoryId(null);
                  }}
                  disabled={isGeneratingCategory()}
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
