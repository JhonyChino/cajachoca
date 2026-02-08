import { Component, createSignal, Show } from 'solid-js';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { 
  config, 
  setCurrency, 
  setDownloadPath, 
  getCurrencySymbol,
  getCurrencyName,
  type Currency 
} from '@/stores/configStore';
import { DollarSign, FolderOpen, Check, Save } from 'lucide-solid';

const Configuracion: Component = () => {
  const [selectedCurrency, setSelectedCurrency] = createSignal<Currency>(config().currency);
  const [downloadPathInput, setDownloadPathInput] = createSignal(config().downloadPath);
  const [showSaveSuccess, setShowSaveSuccess] = createSignal(false);

  const currencies: { value: Currency; label: string; symbol: string }[] = [
    { value: 'USD', label: 'Dólar estadounidense', symbol: '$' },
    { value: 'BOB', label: 'Bolivianos', symbol: 'Bs.' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
  ];

  const handleSave = () => {
    setCurrency(selectedCurrency());
    setDownloadPath(downloadPathInput());

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleSelectFolder = async () => {
    // In a real Tauri app, this would open a folder dialog
    // For now, we'll just set a default path or allow manual input
    const defaultPath = config().downloadPath || 'C:/Users/Usuario/Documentos/CafeteriaHub/Reportes';
    setDownloadPathInput(defaultPath);
  };

  return (
    <AppLayout title="Configuración" subtitle="Personaliza las opciones del sistema">
      <div class="max-w-2xl space-y-6">
        {/* Currency Configuration */}
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Moneda</h2>
              <p class="text-sm text-gray-500">Selecciona la moneda para mostrar los montos</p>
            </div>
          </div>

          <div class="space-y-3">
            {currencies.map((currency) => (
              <label
                class={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCurrency() === currency.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div class="flex items-center gap-3">
                  <input
                    type="radio"
                    name="currency"
                    value={currency.value}
                    checked={selectedCurrency() === currency.value}
                    onChange={() => setSelectedCurrency(currency.value)}
                    class="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p class="font-medium text-gray-900">{currency.label}</p>
                    <p class="text-sm text-gray-500">Símbolo: {currency.symbol}</p>
                  </div>
                </div>
                <Show when={selectedCurrency() === currency.value}>
                  <Check class="w-5 h-5 text-blue-600" />
                </Show>
              </label>
            ))}
          </div>

          {/* Preview */}
          <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-500 mb-2">Vista previa:</p>
            <p class="text-2xl font-bold text-gray-900">
              {getCurrencySymbol(selectedCurrency())} 1,250.00
            </p>
          </div>
        </div>

        {/* Download Path Configuration */}
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FolderOpen class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Ruta de Descarga</h2>
              <p class="text-sm text-gray-500">Carpeta donde se guardarán los reportes generados</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Ruta de descarga de reportes
              </label>
              <div class="flex gap-2">
                <input
                  type="text"
                  value={downloadPathInput()}
                  onInput={(e) => setDownloadPathInput(e.currentTarget.value)}
                  placeholder="C:/Users/Usuario/Documentos/CafeteriaHub/Reportes"
                  class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <Button
                  variant="outline"
                  onClick={handleSelectFolder}
                  class="px-4 flex items-center gap-2"
                >
                  <FolderOpen class="w-4 h-4" />
                  Examinar
                </Button>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Si no especificas una ruta, los reportes se guardarán en la carpeta Documentos/CafeteriaHub/Reportes
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div class="flex items-center justify-between">
          <Show when={showSaveSuccess()}>
            <div class="flex items-center gap-2 text-green-600">
              <Check class="w-5 h-5" />
              <span class="font-medium">Configuración guardada correctamente</span>
            </div>
          </Show>
          
          <Button
            onClick={handleSave}
            class="flex items-center gap-2 px-8"
          >
            <Save class="w-4 h-4" />
            Guardar Cambios
          </Button>
        </div>

        {/* Current Settings Summary */}
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Configuración Actual
          </h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Moneda seleccionada:</span>
              <span class="font-medium text-gray-900">
                {getCurrencyName(config().currency)} ({getCurrencySymbol(config().currency)})
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Ruta de descarga:</span>
              <span class="font-medium text-gray-900">
                {config().downloadPath || 'Predeterminada (Documentos/CafeteriaHub/Reportes)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Configuracion;