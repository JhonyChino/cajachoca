import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Plus, Upload, Lock, TrendingUp, TrendingDown } from 'lucide-solid';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import TransactionModal from '@/components/modals/TransactionModal';
import { 
  activeSession, 
  sessionSummary, 
  isLoading, 
  loadActiveSession,
  refreshSessionData 
} from '@/stores/sessionStore';
import { transactionApi, type Transaction } from '@/lib/api';
import { formatCurrency } from '@/stores/configStore';

const Dashboard: Component = () => {
  const navigate = useNavigate();
  const [recentTransactions, setRecentTransactions] = createSignal<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = createSignal(false);
  const [showIncomeModal, setShowIncomeModal] = createSignal(false);
  const [showExpenseModal, setShowExpenseModal] = createSignal(false);
  const [showCloseModal, setShowCloseModal] = createSignal(false);
  const [closingAmount, setClosingAmount] = createSignal('');
  const [closeError, setCloseError] = createSignal<string | null>(null);

  // Check for active session
  createEffect(async () => {
    await loadActiveSession();
    if (!activeSession()) {
      navigate('/');
    } else {
      await loadRecentTransactions();
    }
  });

  const loadRecentTransactions = async () => {
    const session = activeSession();
    if (!session) return;

    setIsLoadingTransactions(true);
    try {
      const response = await transactionApi.getRecentTransactions(session.id, 5);
      if (response.success) {
        setRecentTransactions(response.data);
      }
    } catch (err) {
      console.error('Error loading recent transactions:', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleCreateTransaction = async (type: 'income' | 'expense', data: {
    amount: number;
    concept: string;
    categoryId: number | null;
  }) => {
    const session = activeSession();
    if (!session) return;

    try {
      const response = await transactionApi.createTransaction(
        session.id,
        type,
        data.amount,
        data.concept,
        data.categoryId,
        session.operator_name
      );

      if (response.success) {
        // Close modal
        if (type === 'income') {
          setShowIncomeModal(false);
        } else {
          setShowExpenseModal(false);
        }
        
        // Refresh data
        await refreshSessionData();
        await loadRecentTransactions();
      } else {
        alert(response.error || 'Error al crear la transacción');
      }
    } catch (err) {
      console.error('Error creating transaction:', err);
      alert('Error al crear la transacción');
    }
  };

  const handleCloseSession = async () => {
    setCloseError(null);
    const amount = parseFloat(closingAmount());
    
    if (isNaN(amount) || amount < 0) {
      setCloseError('El monto de cierre debe ser un número válido');
      return;
    }

    const session = activeSession();
    if (!session) return;

    try {
      const { closeCurrentSession } = await import('@/stores/sessionStore');
      const result = await closeCurrentSession(amount);
      
      if (result.success) {
        setShowCloseModal(false);
        navigate('/');
      } else {
        setCloseError(result.error || 'Error al cerrar la sesión');
      }
    } catch (err) {
      setCloseError('Error al cerrar la sesión');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-MX');
    }
  };

  return (
    <AppLayout title="Gestión de Caja" subtitle="Panel de control y operaciones">
      <Show when={!isLoading()} fallback={
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="animate-spin text-4xl mb-4">⏳</div>
            <p class="text-gray-500">Cargando...</p>
          </div>
        </div>
      }>
        <Show when={sessionSummary()}>
          {(summary) => (
            <div class="space-y-6">
              {/* Summary Cards */}
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Balance */}
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                  <p class="text-blue-100 text-sm font-medium">Saldo Actual</p>
                  <p class="text-4xl font-bold mt-2">
                    {formatCurrency(summary().current_balance)}
                  </p>
                  <div class="flex items-center gap-2 mt-4 text-blue-100">
                    <TrendingUp class="w-4 h-4" />
                    <span class="text-sm">Monto inicial: {formatCurrency(summary().session.opening_amount)}</span>
                  </div>
                </div>

                {/* Total Income */}
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-gray-500 text-sm">Total Ingresos del Día</p>
                      <p class="text-3xl font-bold text-gray-900 mt-1">
                        {formatCurrency(summary().total_income)}
                      </p>
                      <p class="text-green-600 text-sm mt-2 font-medium">
                        {summary().income_count} transacciones
                      </p>
                    </div>
                    <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp class="w-7 h-7 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Total Expense */}
                <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-gray-500 text-sm">Total Egresos del Día</p>
                      <p class="text-3xl font-bold text-gray-900 mt-1">
                        {formatCurrency(summary().total_expense)}
                      </p>
                      <p class="text-red-600 text-sm mt-2 font-medium">
                        {summary().expense_count} retiros
                      </p>
                    </div>
                    <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                      <TrendingDown class="w-7 h-7 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 class="text-lg font-semibold text-gray-900">Acciones de Caja</h2>
                <p class="text-gray-500 text-sm">Seleccione una operación para registrar movimientos de efectivo.</p>

                <div class="flex gap-4 mt-4">
                  <Button 
                    class="flex-1 py-4 text-base font-semibold flex items-center justify-center gap-2"
                    onClick={() => setShowIncomeModal(true)}
                  >
                    <Plus class="w-5 h-5" />
                    Registrar Ingreso
                  </Button>
                  <Button 
                    variant="outline"
                    class="flex-1 py-4 text-base font-semibold flex items-center justify-center gap-2 border-gray-300"
                    onClick={() => setShowExpenseModal(true)}
                  >
                    <Upload class="w-5 h-5" />
                    Registrar Egreso
                  </Button>
                </div>
              </div>

              {/* Close Session Button */}
              <div class="flex justify-end">
                <Button 
                  variant="outline"
                  class="px-6 py-3 flex items-center gap-2 border-gray-800 text-gray-800 hover:bg-gray-100"
                  onClick={() => setShowCloseModal(true)}
                >
                  <Lock class="w-4 h-4" />
                  Cierre de Caja Diario
                </Button>
              </div>

              {/* Recent Activity */}
              <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Actividad Reciente
                </h3>
                
                <Show when={!isLoadingTransactions()} fallback={
                  <div class="text-center py-8 text-gray-500">
                    Cargando transacciones...
                  </div>
                }>
                  <Show when={recentTransactions().length > 0} fallback={
                    <div class="text-center py-8 text-gray-400">
                      No hay transacciones recientes
                    </div>
                  }>
                    <div class="space-y-3">
                      <For each={recentTransactions()}>
                        {(transaction) => (
                          <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div class="flex items-center gap-3">
                              <div class={`w-10 h-10 rounded-full flex items-center justify-center ${
                                transaction.transaction_type === 'income' 
                                  ? 'bg-green-100' 
                                  : 'bg-red-100'
                              }`}>
                                <span class={transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                  {transaction.transaction_type === 'income' ? '↓' : '↑'}
                                </span>
                              </div>
                              <div>
                                <p class="font-medium text-gray-900">{transaction.concept}</p>
                                <p class="text-sm text-gray-500">
                                  {formatDate(transaction.created_at)} • Por {transaction.created_by}
                                </p>
                              </div>
                            </div>
                            <span class={`font-semibold ${
                              transaction.transaction_type === 'income' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {transaction.transaction_type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </span>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </Show>
              </div>
            </div>
          )}
        </Show>
      </Show>

      {/* Income Modal */}
      <TransactionModal
        isOpen={showIncomeModal()}
        onClose={() => setShowIncomeModal(false)}
        onSubmit={(data) => handleCreateTransaction('income', data)}
        type="income"
      />

      {/* Expense Modal */}
      <TransactionModal
        isOpen={showExpenseModal()}
        onClose={() => setShowExpenseModal(false)}
        onSubmit={(data) => handleCreateTransaction('expense', data)}
        type="expense"
        currentBalance={sessionSummary()?.current_balance}
      />

      {/* Close Session Modal */}
      <Show when={showCloseModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div class="text-center">
              <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock class="w-8 h-8 text-amber-600" />
              </div>
              <h2 class="text-xl font-bold text-gray-900 mb-2">Cierre de Caja Diaria</h2>
              
              <Show when={sessionSummary()}>
                {(summary) => (
                  <div class="mb-6">
                    <p class="text-sm text-gray-500">Saldo Actual</p>
                    <p class="text-3xl font-bold text-gray-900">{formatCurrency(summary().current_balance)}</p>
                  </div>
                )}
              </Show>

              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Monto de Cierre
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={closingAmount()}
                  onInput={(e) => setClosingAmount(e.currentTarget.value)}
                  placeholder="0.00"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-xl font-bold"
                />
              </div>

              <p class="text-gray-600 mb-2">
                ¿Está seguro de que desea cerrar la caja por hoy?
              </p>
              <p class="text-red-500 text-sm mb-6">
                Esta acción no se puede deshacer.
              </p>

              {closeError() && (
                <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {closeError()}
                </div>
              )}

              <div class="space-y-3">
                <Button 
                  class="w-full py-3 bg-gray-900 hover:bg-gray-800"
                  onClick={handleCloseSession}
                >
                  Confirmar Cierre
                </Button>
                <Button 
                  variant="outline"
                  class="w-full py-3"
                  onClick={() => setShowCloseModal(false)}
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

export default Dashboard;