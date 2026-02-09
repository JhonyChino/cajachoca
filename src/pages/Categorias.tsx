import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { invoke } from '@tauri-apps/api/core';
import { Plus, Edit2, Trash2, X, Tag, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from 'lucide-solid';

interface Category {
  id: number;
  name: string;
  category_type: string;
  is_active: boolean;
}

const Categorias: Component = () => {
  const [incomeCategories, setIncomeCategories] = createSignal<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = createSignal<Category[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [showCreateModal, setShowCreateModal] = createSignal(false);
  const [newCategoryName, setNewCategoryName] = createSignal('');
  const [newCategoryType, setNewCategoryType] = createSignal<'income' | 'expense'>('income');
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [editingCategory, setEditingCategory] = createSignal<Category | null>(null);
  const [editName, setEditName] = createSignal('');
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [deletingCategory, setDeletingCategory] = createSignal<Category | null>(null);

  onMount(async () => {
    console.log('Categorias: onMount - iniciando carga de categorias');
    await loadCategories();
    console.log('Categorias: carga completada');
  });

  const loadCategories = async () => {
    console.log('Categorias: loadCategories iniciado');
    setIsLoading(true);
    try {
      console.log('Categorias: invocando get_categories_by_type para income');
      const incomeResponse = await invoke('get_categories_by_type', { categoryType: 'income' }) as { success: boolean; data: Category[] };
      console.log('Categorias: respuesta income:', incomeResponse);
      
      console.log('Categorias: invocando get_categories_by_type para expense');
      const expenseResponse = await invoke('get_categories_by_type', { categoryType: 'expense' }) as { success: boolean; data: Category[] };
      console.log('Categorias: respuesta expense:', expenseResponse);
      
      if (incomeResponse.success) {
        console.log('Categorias: estableciendo incomeCategories con', incomeResponse.data.length, 'elementos');
        setIncomeCategories(incomeResponse.data);
      } else {
        console.error('Categorias: error al cargar income:', incomeResponse);
      }
      
      if (expenseResponse.success) {
        console.log('Categorias: estableciendo expenseCategories con', expenseResponse.data.length, 'elementos');
        setExpenseCategories(expenseResponse.data);
      } else {
        console.error('Categorias: error al cargar expense:', expenseResponse);
      }
    } catch (error) {
      console.error('Categorias: error en loadCategories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategoryName().trim()) {
      alert('El nombre de la categoria es requerido');
      return;
    }
    
    try {
      const response = await invoke('create_category', { 
        name: newCategoryName().trim(),
        categoryType: newCategoryType()
      }) as { success: boolean; error?: string };
      
      if (response.success) {
        setShowCreateModal(false);
        setNewCategoryName('');
        setNewCategoryType('income');
        await loadCategories();
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (error) {
      alert('Error al crear la categoria');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory() || !editName().trim()) return;
    
    try {
      const response = await invoke('update_category', { 
        categoryId: editingCategory()!.id,
        name: editName().trim()
      }) as { success: boolean; error?: string };
      
      if (response.success) {
        setShowEditModal(false);
        setEditingCategory(null);
        setEditName('');
        await loadCategories();
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (error) {
      alert('Error al actualizar la categoria');
    }
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingCategory()) return;
    
    try {
      const response = await invoke('delete_category', { 
        categoryId: deletingCategory()!.id 
      }) as { success: boolean; error?: string };
      
      if (response.success) {
        setShowDeleteConfirm(false);
        setDeletingCategory(null);
        await loadCategories();
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (error) {
      alert('Error al eliminar la categoria');
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewCategoryName('');
    setNewCategoryType('income');
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingCategory(null);
    setEditName('');
  };

  return (
    <AppLayout title="Categorias" subtitle="Gestiona las categorias de ingresos y egresos">
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Categorias</h2>
            <p class="text-gray-500">Administra las categorias para clasificar tus transacciones</p>
          </div>
          <Button onClick={() => { setNewCategoryType('income'); setShowCreateModal(true); }} class="flex items-center gap-2">
            <Plus class="w-4 h-4" />
            Nueva Categoria
          </Button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loading State */}
          <Show when={isLoading()}>
            <div class="col-span-2 bg-white p-8 rounded-xl border border-gray-200 text-center">
              <div class="animate-spin text-4xl mb-4">⏳</div>
              <p class="text-gray-500">Cargando categorias...</p>
            </div>
          </Show>

          {/* Income Categories */}
          <Show when={!isLoading()}>
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="p-4 border-b border-gray-200 bg-green-50/50">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ArrowUpCircle class="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900">Categorias de Ingresos</h2>
                    <p class="text-sm text-gray-500">{incomeCategories().length} categorias</p>
                  </div>
                </div>
              </div>
              <div class="divide-y divide-gray-100">
                <Show when={incomeCategories().length > 0} fallback={
                  <div class="p-8 text-center text-gray-400">
                    <Tag class="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p class="text-sm">No hay categorias de ingresos</p>
                  </div>
                }>
                  <For each={incomeCategories()}>
                    {(category) => (
                      <div class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                        <div class="flex items-center gap-3">
                          <div class="w-2 h-2 rounded-full bg-green-500" />
                          <span class="font-medium text-gray-900">{category.name}</span>
                        </div>
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(category)} class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                            <Edit2 class="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(category)} class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </div>

            {/* Expense Categories */}
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="p-4 border-b border-gray-200 bg-red-50/50">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <ArrowDownCircle class="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900">Categorias de Egresos</h2>
                    <p class="text-sm text-gray-500">{expenseCategories().length} categorias</p>
                  </div>
                </div>
              </div>
              <div class="divide-y divide-gray-100">
                <Show when={expenseCategories().length > 0} fallback={
                  <div class="p-8 text-center text-gray-400">
                    <Tag class="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p class="text-sm">No hay categorias de egresos</p>
                  </div>
                }>
                  <For each={expenseCategories()}>
                    {(category) => (
                      <div class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                        <div class="flex items-center gap-3">
                          <div class="w-2 h-2 rounded-full bg-red-500" />
                          <span class="font-medium text-gray-900">{category.name}</span>
                        </div>
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(category)} class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                            <Edit2 class="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(category)} class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </div>
          </Show>
        </div>

        {/* Info Card */}
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div class="flex items-start gap-3">
            <Tag class="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 class="text-sm font-semibold text-blue-900">¿Para que sirven las categorias?</h3>
              <p class="text-sm text-blue-700 mt-1">
                Las categorias te permiten clasificar tus transacciones para obtener mejores reportes y analisis.
                Puedes crear tantas categorias como necesites para organizar tus ingresos y egresos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Show when={showCreateModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-gray-900">Nueva Categoria</h2>
              <button onClick={closeCreateModal} class="p-2 hover:bg-gray-100 rounded-lg">
                <X class="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Tipo de categoria</label>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewCategoryType('income')}
                    class={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      newCategoryType() === 'income'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div class={`w-12 h-12 rounded-full flex items-center justify-center ${
                      newCategoryType() === 'income' ? 'bg-green-500' : 'bg-green-100'
                    }`}>
                      <TrendingUp class={`w-6 h-6 ${newCategoryType() === 'income' ? 'text-white' : 'text-green-600'}`} />
                    </div>
                    <span class={`font-medium ${newCategoryType() === 'income' ? 'text-green-700' : 'text-gray-600'}`}>Ingreso</span>
                  </button>
                  
                  <button
                    onClick={() => setNewCategoryType('expense')}
                    class={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      newCategoryType() === 'expense'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div class={`w-12 h-12 rounded-full flex items-center justify-center ${
                      newCategoryType() === 'expense' ? 'bg-red-500' : 'bg-red-100'
                    }`}>
                      <TrendingDown class={`w-6 h-6 ${newCategoryType() === 'expense' ? 'text-white' : 'text-red-600'}`} />
                    </div>
                    <span class={`font-medium ${newCategoryType() === 'expense' ? 'text-red-700' : 'text-gray-600'}`}>Egreso</span>
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input 
                  type="text" 
                  value={newCategoryName()} 
                  onInput={(e) => setNewCategoryName(e.currentTarget.value)} 
                  placeholder="Ej: Ventas, Alquiler, etc." 
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                />
              </div>
              <div class="flex gap-3 pt-4">
                <Button onClick={handleCreate} class="flex-1">Crear Categoria</Button>
                <Button variant="outline" onClick={closeCreateModal} class="flex-1">Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Edit Modal */}
      <Show when={showEditModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-gray-900">Editar Categoria</h2>
              <button onClick={closeEditModal} class="p-2 hover:bg-gray-100 rounded-lg">
                <X class="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input 
                  type="text" 
                  value={editName()} 
                  onInput={(e) => setEditName(e.currentTarget.value)} 
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                />
              </div>
              <div class="flex gap-3 pt-4">
                <Button onClick={handleSaveEdit} class="flex-1">Guardar Cambios</Button>
                <Button variant="outline" onClick={closeEditModal} class="flex-1">Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Delete Confirm Modal */}
      <Show when={showDeleteConfirm()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-bold text-red-600 mb-4">Confirmar Eliminacion</h3>
            <p class="text-gray-600 mb-6">
              ¿Estas seguro de que deseas eliminar la categoria <strong>{deletingCategory()?.name}</strong>?
              Esta accion no se puede deshacer.
            </p>
            <div class="flex gap-3">
              <Button onClick={confirmDelete} class="flex-1 bg-red-600 hover:bg-red-700">Eliminar</Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} class="flex-1">Cancelar</Button>
            </div>
          </div>
        </div>
      </Show>
    </AppLayout>
  );
};

export default Categorias;
