import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { transactionApi, type Transaction } from '@/lib/api';
import { Search, Filter, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-solid';

const Historial: Component = () => {
  const [transactions, setTransactions] = createSignal<Transaction[]>([]);
  const [totalCount, setTotalCount] = createSignal(0);
  const [isLoading, setIsLoading] = createSignal(false);
  const [currentPage, setCurrentPage] = createSignal(1);
  
  // Filters
  const [transactionNumber, setTransactionNumber] = createSignal('');
  const [concept, setConcept] = createSignal('');
  const [amountFilter, setAmountFilter] = createSignal('');
  
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
                          <td class="px-6 py-4 whitespace-nowrap text-right">
                            <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical class="w-4 h-4 text-gray-400" />
                            </button>
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
    </AppLayout>
  );
};

export default Historial;