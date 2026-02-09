import { Component, createSignal, createEffect, Show, For } from 'solid-js';
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
import { backupApi, type BackupInfo } from '@/lib/api';
import { open } from '@tauri-apps/plugin-dialog';
import { 
  DollarSign, 
  FolderOpen, 
  Check, 
  Save, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  Skull,
  Heart,
  Mail,
  Star,
  Code,
  Coffee
} from 'lucide-solid';

const Configuracion: Component = () => {
  const [selectedCurrency, setSelectedCurrency] = createSignal<Currency>(config().currency);
  const [downloadPathInput, setDownloadPathInput] = createSignal(config().downloadPath);
  const [showSaveSuccess, setShowSaveSuccess] = createSignal(false);
  
  // Backup states
  const [backups, setBackups] = createSignal<BackupInfo[]>([]);
  const [dbInfo, setDbInfo] = createSignal<{ size_formatted: string; last_modified: string } | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = createSignal(false);
  const [isRestoring, setIsRestoring] = createSignal(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = createSignal<string | null>(null);
  
  // New backup export path
  const [backupExportPath, setBackupExportPath] = createSignal('');
  
  // Delete all records confirmation
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = createSignal(false);
  const [isDeletingAll, setIsDeletingAll] = createSignal(false);

  const currencies: { value: Currency; label: string; symbol: string }[] = [
    { value: 'USD', label: 'Dólar estadounidense', symbol: '$' },
    { value: 'BOB', label: 'Bolivianos', symbol: 'Bs.' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
  ];

  // Load backups and database info on mount
  createEffect(() => {
    loadBackups();
    loadDatabaseInfo();
  });

  const loadBackups = async () => {
    const response = await backupApi.listBackups();
    if (response.success) {
      setBackups(response.data);
    }
  };

  const loadDatabaseInfo = async () => {
    const response = await backupApi.getDatabaseInfo();
    if (response.success && response.data) {
      setDbInfo(response.data);
    }
  };

  const handleSave = () => {
    setCurrency(selectedCurrency());
    setDownloadPath(downloadPathInput());

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: config().downloadPath || undefined,
        title: 'Seleccionar carpeta para reportes'
      });
      
      if (selected && typeof selected === 'string') {
        setDownloadPathInput(selected);
      }
    } catch (error) {
      console.error('Error al abrir diálogo:', error);
      alert('Error al abrir el selector de carpetas');
    }
  };

  const handleSelectBackupExportPath = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: backupExportPath() || undefined,
        title: 'Seleccionar carpeta para exportar backup'
      });
      
      if (selected && typeof selected === 'string') {
        setBackupExportPath(selected);
      }
    } catch (error) {
      console.error('Error al abrir diálogo:', error);
      alert('Error al abrir el selector de carpetas');
    }
  };

  const handleCreateBackup = async () => {
    if (!confirm('¿Deseas crear un backup de la base de datos?')) return;
    
    setIsCreatingBackup(true);
    try {
      // Use custom path if set, otherwise use default
      const customPath = backupExportPath() || undefined;
      const response = await backupApi.createBackup(customPath);
      if (response.success) {
        await loadBackups();
        // Clear the export path after successful backup
        setBackupExportPath('');
      } else {
        alert(`Error al crear backup: ${response.error}`);
      }
    } catch (error) {
      alert('Error al crear backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupPath: string) => {
    setIsRestoring(true);
    try {
      const response = await backupApi.restoreBackup(backupPath);
      if (response.success) {
        window.location.reload();
      } else {
        alert(`Error al restaurar: ${response.error}`);
      }
    } catch (error) {
      alert('Error al restaurar backup');
    } finally {
      setIsRestoring(false);
      setShowRestoreConfirm(null);
    }
  };

  const handleDeleteBackup = async (backupPath: string) => {
    try {
      const response = await backupApi.deleteBackup(backupPath);
      if (response.success) {
        await loadBackups();
      } else {
        alert(`Error al eliminar: ${response.error}`);
      }
    } catch (error) {
      alert('Error al eliminar backup');
    }
  };

  const handleImportBackup = async () => {
    try {
      const selected = await open({
        directory: false,
        multiple: false,
        filters: [{ name: 'Database', extensions: ['db'] }],
        title: 'Seleccionar archivo de backup para importar'
      });
      
      if (selected && typeof selected === 'string') {
        setShowRestoreConfirm(selected);
      }
    } catch (error) {
      console.error('Error al abrir diálogo:', error);
    }
  };

  const handleDeleteAllRecords = async () => {
    setIsDeletingAll(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const response = await invoke('delete_all_records') as { success: boolean; error?: string };
      
      if (response.success) {
        window.location.reload();
      } else {
        alert(`Error al eliminar registros: ${response.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar los registros');
    } finally {
      setIsDeletingAll(false);
      setShowDeleteAllConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppLayout title="Configuración" subtitle="Personaliza las opciones del sistema">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div class="space-y-6">
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
                    placeholder="C:/Users/Usuario/Documentos/cajachoca/Reportes"
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
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div class="flex items-center justify-between bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
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
                  {config().downloadPath || 'Predeterminada (Documentos/cajachoca/Reportes)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div class="space-y-6">
          {/* Backup & Restore Section */}
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Database class="w-5 h-5 text-purple-600" />
              </div>
              <div class="flex-1">
                <h2 class="text-lg font-semibold text-gray-900">Backup y Restauración</h2>
                <p class="text-sm text-gray-500">Gestiona los backups de la base de datos</p>
              </div>
              <Button
                variant="outline"
                onClick={loadBackups}
                class="px-3 flex items-center gap-2"
              >
                <RefreshCw class="w-4 h-4" />
                Actualizar
              </Button>
            </div>

            {/* Database Info */}
            <Show when={dbInfo()}>
              <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 class="text-sm font-medium text-blue-900 mb-2">Información de la Base de Datos</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-blue-600">Tamaño:</span>
                    <span class="ml-2 font-medium text-blue-900">{dbInfo()?.size_formatted}</span>
                  </div>
                  <div>
                    <span class="text-blue-600">Última modificación:</span>
                    <span class="ml-2 font-medium text-blue-900">
                      {dbInfo() && formatDate(dbInfo()!.last_modified)}
                    </span>
                  </div>
                </div>
              </div>
            </Show>

            {/* Backup Export Path */}
            <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 class="text-sm font-medium text-gray-900 mb-3">Ruta de Exportación de Backup</h3>
              <div class="flex gap-2">
                <input
                  type="text"
                  value={backupExportPath()}
                  onInput={(e) => setBackupExportPath(e.currentTarget.value)}
                  placeholder="Usar ruta predeterminada (Documentos/cajachoca/Backups)"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
                <Button
                  variant="outline"
                  onClick={handleSelectBackupExportPath}
                  class="px-4 flex items-center gap-2"
                >
                  <FolderOpen class="w-4 h-4" />
                  Examinar
                </Button>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Selecciona una carpeta personalizada donde se guardará el backup. Si no especificas una ruta, se usará la ubicación predeterminada.
              </p>
            </div>

            {/* Action Buttons */}
            <div class="flex gap-4 mb-6">
              <Button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup()}
                class="flex items-center gap-2"
              >
                <Download class="w-4 h-4" />
                {isCreatingBackup() ? 'Creando...' : 'Crear Backup'}
              </Button>
              <Button
                variant="outline"
                onClick={handleImportBackup}
                disabled={isRestoring()}
                class="flex items-center gap-2"
              >
                <Upload class="w-4 h-4" />
                Importar Backup
              </Button>
            </div>

            {/* Backups List */}
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <h3 class="px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700 border-b border-gray-200">
                Backups Disponibles ({backups().length})
              </h3>
              
              <Show when={backups().length > 0} fallback={
                <div class="px-4 py-8 text-center text-gray-500">
                  <Database class="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay backups disponibles</p>
                  <p class="text-sm">Crea tu primer backup usando el botón "Crear Backup"</p>
                </div>
              }>
                <div class="divide-y divide-gray-200">
                  <For each={backups()}>
                    {(backup) => (
                      <div class="px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900 truncate">{backup.filename}</p>
                          <p class="text-xs text-gray-500">
                            {formatDate(backup.created_at)} • {backup.size_formatted}
                          </p>
                        </div>
                        <div class="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRestoreConfirm(backup.filepath)}
                            disabled={isRestoring()}
                            class="flex items-center gap-1"
                          >
                            <Upload class="w-3 h-3" />
                            Restaurar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBackup(backup.filepath)}
                            class="flex items-center gap-1 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 class="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>

          {/* Danger Zone - Delete All Records */}
          <div class="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Skull class="w-5 h-5 text-red-600" />
              </div>
              <div class="flex-1">
                <h2 class="text-lg font-semibold text-red-900">Zona de Peligro</h2>
                <p class="text-sm text-red-600">Acciones destructivas que no se pueden deshacer</p>
              </div>
            </div>

            <div class="p-4 bg-white rounded-lg border border-red-200">
              <div class="flex items-start gap-4">
                <AlertTriangle class="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                <div class="flex-1">
                  <h3 class="text-sm font-semibold text-gray-900 mb-1">Eliminar Todos los Registros</h3>
                  <p class="text-sm text-gray-600 mb-4">
                    Esta acción eliminará permanentemente todas las transacciones, sesiones y datos de la base de datos. 
                    Se recomienda crear un backup antes de continuar.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteAllConfirm(true)}
                    class="text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 class="w-4 h-4" />
                    Eliminar Todos los Registros
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sobre el Sistema */}
          <div class="bg-gradient-to-br from-blue-600 to-purple-700 p-8 rounded-xl shadow-lg text-white">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Coffee class="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 class="text-xl font-bold">Sobre el Sistema</h2>
                <p class="text-blue-200 text-sm">Caja Choca v1.0</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Code class="w-4 h-4 text-blue-200" />
                  </div>
                  <div>
                    <p class="text-xs text-blue-200 uppercase tracking-wider">Desarrollado por</p>
                    <p class="font-semibold">Jhonny Ecl</p>
                  </div>
                </div>
              </div>
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Star class="w-4 h-4 text-yellow-300" />
                  </div>
                  <div>
                    <p class="text-xs text-blue-200 uppercase tracking-wider">Año de compilación</p>
                    <p class="font-semibold">2026</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white/10 rounded-xl p-4 text-center">
              <div class="flex items-center justify-center gap-2 mb-3">
                <Heart class="w-5 h-5 text-red-400" />
                <span class="font-medium text-lg">Te gustó el sistema?</span>
              </div>
              <p class="text-blue-100 text-sm mb-4">
                Si te gustó y quieres nuevas funcionalidades, contáctame. ¡Con gusto te ayudo!
              </p>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText('jhony.ecl@gmail.com');
                  alert('Correo copiado al portapapeles: jhony.ecl@gmail.com');
                }}
                class="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:from-green-500 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2 mx-auto"
              >
                <Mail class="w-5 h-5 animate-pulse" />
                jhony.ecl@gmail.com
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      <Show when={showRestoreConfirm()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div class="flex items-center gap-3 text-amber-600 mb-4">
              <AlertTriangle class="w-8 h-8" />
              <h3 class="text-lg font-bold">Confirmar Restauración</h3>
            </div>
            <p class="text-gray-600 mb-6">
              ¿Estás seguro de que deseas restaurar este backup? Esta acción reemplazará 
              la base de datos actual y no se puede deshacer. Se creará un backup automático 
              de la base de datos actual antes de restaurar.
            </p>
            <div class="flex gap-3">
              <Button
                onClick={() => handleRestoreBackup(showRestoreConfirm()!)}
                disabled={isRestoring()}
                class="flex-1"
              >
                {isRestoring() ? 'Restaurando...' : 'Sí, Restaurar'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRestoreConfirm(null)}
                disabled={isRestoring()}
                class="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </Show>

      {/* Delete All Records Confirmation Modal */}
      <Show when={showDeleteAllConfirm()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 border-2 border-red-200">
            <div class="flex items-center gap-3 text-red-600 mb-4">
              <Skull class="w-8 h-8" />
              <h3 class="text-lg font-bold">¡ADVERTENCIA EXTREMA!</h3>
            </div>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p class="text-red-800 font-semibold mb-2">Esta acción:</p>
              <ul class="text-red-700 text-sm list-disc list-inside space-y-1">
                <li>Eliminará TODAS las transacciones</li>
                <li>Eliminará TODAS las sesiones de caja</li>
                <li>Eliminará TODOS los datos históricos</li>
                <li>NO se puede deshacer</li>
              </ul>
            </div>
            <p class="text-gray-600 mb-6 text-sm">
              ¿Estás completamente seguro de que deseas eliminar todos los registros? 
              Esta acción es irreversible.
            </p>
            <div class="flex gap-3">
              <Button
                onClick={handleDeleteAllRecords}
                disabled={isDeletingAll()}
                class="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isDeletingAll() ? 'Eliminando...' : 'Sí, Eliminar Todo'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={isDeletingAll()}
                class="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </AppLayout>
  );
};

export default Configuracion;