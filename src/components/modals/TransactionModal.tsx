import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { X, DollarSign, AlertCircle } from 'lucide-solid';
import { Button } from '@/components/ui';
import { categoryApi, type Category } from '@/lib/api';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    concept: string;
    categoryId: number | null;
  }) => void;
  type: 'income' | 'expense';
  currentBalance?: number;
}

const TransactionModal: Component<TransactionModalProps> = (props) => {
  const [amount, setAmount] = createSignal('');
  const [concept, setConcept] = createSignal('');
  const [categoryId, setCategoryId] = createSignal<number | null>(null);
  const [categories, setCategories] = createSignal<Category[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Load categories when modal opens
  createEffect(() => {
    if (props.isOpen) {
      loadCategories();
    }
  });

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getCategoriesByType(props.type);
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setError(null);

    const amountValue = parseFloat(amount());

    // Validations
    if (!amount() || isNaN(amountValue) || amountValue <= 0) {
      setError('El monto debe ser un número mayor a cero');
      return;
    }

    if (!concept().trim()) {
      setError('El concepto es requerido');
      return;
    }

    if (!categoryId()) {
      setError('Debe seleccionar una categoría');
      return;
    }

    // For expenses, check balance
    if (props.type === 'expense' && props.currentBalance !== undefined) {
      if (amountValue > props.currentBalance) {
        setError(`Saldo insuficiente. Balance actual: $${props.currentBalance.toFixed(2)}`);
        return;
      }
    }

    setIsLoading(true);
    
    props.onSubmit({
      amount: amountValue,
      concept: concept().trim(),
      categoryId: categoryId(),
    });

    // Reset form
    setAmount('');
    setConcept('');
    setCategoryId(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    setAmount('');
    setConcept('');
    setCategoryId(null);
    setError(null);
    props.onClose();
  };

  const title = props.type === 'income' ? 'Registrar Ingreso' : 'Registrar Egreso';
  const subtitle = props.type === 'income' 
    ? 'Nuevo ingreso de caja' 
    : 'Nuevo egreso de caja';

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div 
          class="absolute inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Slide-over panel */}
        <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
          <div class="flex flex-col h-full">
            {/* Header */}
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 class="text-xl font-bold text-gray-900">{title}</h2>
                <p class="text-sm text-gray-500">{subtitle}</p>
              </div>
              <button
                onClick={handleClose}
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X class="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} class="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Amount */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Monto
                </label>
                <div class="relative">
                  <DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount()}
                    onInput={(e) => setAmount(e.currentTarget.value)}
                    placeholder="0.00"
                    class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Concept */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Concepto/Detalle
                </label>
                <textarea
                  value={concept()}
                  onInput={(e) => setConcept(e.currentTarget.value)}
                  placeholder="Descripción del movimiento..."
                  rows={3}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={categoryId() || ''}
                  onChange={(e) => setCategoryId(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  <For each={categories()}>
                    {(category) => (
                      <option value={category.id}>{category.name}</option>
                    )}
                  </For>
                </select>
              </div>

              {/* Error */}
              <Show when={error()}>
                <div class="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p class="text-sm text-red-700">{error()}</p>
                </div>
              </Show>

              {/* Info Alert */}
              <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <AlertCircle class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p class="text-sm text-blue-700">
                  Este registro se verá reflejado inmediatamente en el saldo actual y el historial de transacciones del día.
                </p>
              </div>
            </form>

            {/* Footer */}
            <div class="p-6 border-t border-gray-200 space-y-3">
              <Button
                onClick={handleSubmit}
                class="w-full py-3 text-base font-semibold"
                disabled={isLoading()}
              >
                {isLoading() ? 'Guardando...' : 'Confirmar Registro'}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                class="w-full py-3"
                disabled={isLoading()}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default TransactionModal;