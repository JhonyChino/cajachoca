import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { transactionApi, categoryApi, type Transaction, type Category } from '@/lib/api';
import { getCurrencySymbol, config } from '@/stores/configStore';
import { refreshSessionData } from '@/stores/sessionStore';
import { Search, Filter, ChevronLeft, ChevronRight, MoreVertical, Edit2, Trash2, X, AlertTriangle } from 'lucide-solid';

const Historial: Component = () => {
  const [transactions, setTransactions] = createSignal<Transaction[]>([]);
  const [totalCount, setTotalCount] = createSignal(0);
  const [isLoading, setIsLoading] = createSignal(false);
  const [currentPage, setCurrentPage] = createSignal(1);
  
  // Filters
  const [transactionNumber, setTransactionNumber] = createSignal('');
  const [concept, setConcept] = createSignal('');
  const [amountFilter, setAmountFilter] = createSignal('');
  
  // Action menu state
  const [openMenuId, setOpenMenuId] = createSignal<number | null>(null);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [editingTransaction, setEditingTransaction] = createSignal<Transaction | null>(null);
  const [editAmount, setEditAmount] = createSignal('');
  const [editConcept, setEditConcept] = createSignal('');
  const [editCategoryId, setEditCategoryId] = createSignal<number | null>(null);
  const [editCategories, setEditCategories] = createSignal<Category[]>([]);
  const [isSaving, setIsSaving] = createSignal(false);
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [deletingTransaction, setDeletingTransaction] = createSignal<Transaction | null>(null);
  
  const itemsPerPage = 10;

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage() - 1) * itemsPerPage;
      
      let response;
      
      // If searching by transaction number or concept, use search endpoint
      if (transactionNumber() || concept()) {
        const searchQuery = transactionNumber() || concept();
        response = await transactionApi.searchTransactions(searchQuery, itemsPerPage, offset);
      } else {
        // Otherwise use regular get transactions
        response = await transactionApi.getTransactions({
          limit: itemsPerPage,
          offset: offset
        });
      }
      
      if (response.success) {
        setTransactions(response.data);
        setTotalCount(response.total_count);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  createEffect(() => {
    loadTransactions();
  });

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadTransactions();
  };

  const handleClearFilters = () => {
    setTransactionNumber('');
    setConcept('');
    setAmountFilter('');
    setCurrentPage(1);
    loadTransactions();
  };

  const totalPages = () => Math.ceil(totalCount() / itemsPerPage);
  const showingFrom = () => (currentPage() - 1) * itemsPerPage + 1;
  const showingTo = () => Math.min(currentPage() * itemsPerPage, totalCount());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPageNumbers = () => {
    const total = totalPages();
    const current = currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, '...', total);
      } else if (current >= total - 2) {
        pages.push(1, '...', total - 2, total - 1, total);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', total);
      }
    }

    return pages;
  };

  const handleEdit = async (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditConcept(transaction.concept);
    setEditCategoryId(transaction.category_id);
    setOpenMenuId(null);
    
    // Load categories for the transaction type
    try {
      const response = await categoryApi.getCategoriesByType(transaction.transaction_type as 'income' | 'expense');
      if (response.success) {
        setEditCategories(response.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
    
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction()) return;
    
    setIsSaving(true);
    console.log('Iniciando edición de transacción:', editingTransaction()!.id);
    
    try {
      const requestData = {
        amount: parseFloat(editAmount()),
        concept: editConcept(),
        category_id: editCategoryId()
      };
      console.log('Datos a enviar:', requestData);
      
      const response = await transactionApi.updateTransaction(
        editingTransaction()!.id,
        requestData
      );
      
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        setShowEditModal(false);
        await loadTransactions();
        await refreshSessionData();
        console.log('Transacción actualizada exitosamente');
      } else {
        console.error('Error del servidor:', response.error);
        alert(`Error al actualizar: ${response.error}`);
      }
    } catch (error) {
      console.error('Error en handleSaveEdit:', error);
      alert('Error al actualizar la transacción: ' + String(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setOpenMenuId(null);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingTransaction()) return;
    
    console.log('Iniciando eliminación de transacción:', deletingTransaction()!.id);
    
    try {
      const response = await transactionApi.deleteTransaction(deletingTransaction()!.id);
      
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        setShowDeleteConfirm(false);
        await loadTransactions();
        await refreshSessionData();
        console.log('Transacción eliminada exitosamente');
      } else {
        console.error('Error del servidor:', response.error);
        alert(`Error al eliminar: ${response.error}`);
      }
    } catch (error) {
      console.error('Error en confirmDelete:', error);
      alert('Error al eliminar la transacción: ' + String(error));
    }
  };

  const toggleMenu = (id: number) => {
    setOpenMenuId(openMenuId() === id ? null : id);
  };

  return (
    <AppLayout 
      title="Historial de Transacciones" 
      subtitle="Consulta y filtra los movimientos detallados de la caja"
    >
      <div class="space-y-6">
        {/* Filters */}
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Transaction Number */}
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Nro. de Transacción
              </label>
              <div class="relative">
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={transactionNumber()}
                  onInput={(e) => setTransactionNumber(e.currentTarget.value)}
                  placeholder="Ej: 00123"
                  class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            {/* Concept */}
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Detalle/Concepto
              </label>
              <input
                type="text"
                value={concept()}
                onInput={(e) => setConcept(e.currentTarget.value)}
                placeholder="Ej: Reposición café"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            {/* Amount Filter */}
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Monto
              </label>
              <select
                value={amountFilter()}
                onChange={(e) => setAmountFilter(e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
              >
                <option value="">Todos los montos</option>
                <option value="high">Mayor a $100</option>
                <option value="low">Menor a $100</option>
              </select>
            </div>

            {/* Apply Filters Button */}
            <div class="flex gap-2">
              <Button 
                onClick={handleApplyFilters}
                class="flex-1 flex items-center justify-center gap-2"
              >
                <Filter class="w-4 h-4" />
                Aplicar Filtros
              </Button>
              <Button 
                variant="outline"
                onClick={handleClearFilters}
                class="px-4"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Show when={!isLoading()} fallback={
            <div class="flex items-center justify-center py-16">
              <div class="text-center">
                <div class="animate-spin text-4xl mb-4">⏳</div>
                <p class="text-gray-500">Cargando transacciones...</p>
              </div>
            </div>
          }>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Concepto
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th class="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <Show when={transactions().length > 0} fallback={
                    <tr>
                      <td colspan="6" class="px-6 py-16 text-center text-gray-500">
                        No se encontraron transacciones
                      </td>
                    </tr>
                  }>
                    <For each={transactions()}>
                      {(transaction) => (
                        <tr class="hover:bg-gray-50 transition-colors">
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{transaction.transaction_number}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(transaction.created_at)}
                          </td>
                          <td class="px-6 py-4 text-sm text-gray-900">
                            {transaction.concept}
                          </td>
                          <td class={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                            transaction.transaction_type === 'income' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.transaction_type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              transaction.transaction_type === 'income'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {transaction.transaction_type === 'income' ? 'Ingreso' : 'Egreso'}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-right relative">
                            <div class="relative inline-block">
                              <button
                                onClick={() => toggleMenu(transaction.id)}
                                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <MoreVertical class="w-4 h-4 text-gray-400" />
                              </button>
                              
                              <Show when={openMenuId() === transaction.id}>
                                <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                  <button
                                    onClick={() => handleEdit(transaction)}
                                    class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 first:rounded-t-lg"
                                  >
                                    <Edit2 class="w-4 h-4" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDelete(transaction)}
                                    class="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 last:rounded-b-lg border-t border-gray-100"
                                  >
                                    <Trash2 class="w-4 h-4" />
                                    Eliminar
                                  </button>
                                </div>
                              </Show>
                            </div>
                          </td>
                        </tr>
                      )}
                    </For>
                  </Show>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Show when={totalCount() > 0}>
              <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p class="text-sm text-gray-600">
                  Mostrando {showingFrom()} a {showingTo()} de {totalCount()} transacciones
                </p>
                
                <div class="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage() === 1}
                    class="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft class="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <For each={getPageNumbers()}>
                    {(page) => (
                      <Show 
                        when={page !== '...'} 
                        fallback={<span class="px-3 py-2 text-gray-400">...</span>}
                      >
                        <button
                          onClick={() => setCurrentPage(page as number)}
                          class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage() === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      </Show>
                    )}
                  </For>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages(), p + 1))}
                    disabled={currentPage() === totalPages()}
                    class="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight class="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </Show>
          </Show>
        </div>
      </div>

      {/* Edit Modal */}
      <Show when={showEditModal() && editingTransaction()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-bold text-gray-900">Editar Transacción</h2>
                <p class="text-sm text-gray-500">{editingTransaction()?.transaction_number}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X class="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div class="space-y-6">
              {/* Amount */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Monto ({getCurrencySymbol(config().currency)})
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">
                    {getCurrencySymbol(config().currency)}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editAmount()}
                    onInput={(e) => setEditAmount(e.currentTarget.value)}
                    class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-semibold"
                  />
                </div>
              </div>

              {/* Concept */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Concepto/Detalle
                </label>
                <textarea
                  value={editConcept()}
                  onInput={(e) => setEditConcept(e.currentTarget.value)}
                  rows={3}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={editCategoryId() || ''}
                  onChange={(e) => setEditCategoryId(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">Seleccione una categoría</option>
                  <For each={editCategories()}>
                    {(category) => (
                      <option value={category.id}>{category.name}</option>
                    )}
                  </For>
                </select>
              </div>

              {/* Action Buttons */}
              <div class="space-y-3 pt-4">
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSaving()}
                  class="w-full py-3"
                >
                  {isSaving() ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSaving()}
                  class="w-full py-3"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Delete Confirmation Modal */}
      <Show when={showDeleteConfirm() && deletingTransaction()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div class="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle class="w-8 h-8" />
              <h3 class="text-lg font-bold">Caja Choca - Confirmar Eliminación</h3>
            </div>
            <p class="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar la transacción 
              <span class="font-semibold">{deletingTransaction()?.transaction_number}</span>?
              <br /><br />
              Esta acción no se puede deshacer.
            </p>
            <div class="flex gap-3">
              <Button
                onClick={confirmDelete}
                class="flex-1 bg-red-600 hover:bg-red-700"
              >
                Sí, Eliminar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
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

export default Historial;