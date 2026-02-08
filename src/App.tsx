import { Route } from '@solidjs/router';

function App() {
  return (
    <div class="min-h-screen bg-background text-foreground">
      <Route path="/" component={() => (
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-primary mb-4">
              Cafetería Hub
            </h1>
            <p class="text-muted-foreground">
              Sistema de Caja Chica
            </p>
            <p class="text-sm text-muted-foreground mt-4">
              Proyecto inicializado correctamente ✓
            </p>
          </div>
        </div>
      )} />
    </div>
  );
}

export default App;