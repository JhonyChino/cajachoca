import { Component, lazy } from 'solid-js';
import { Router, Route } from '@solidjs/router';

// Lazy load pages for better performance
const StartSession = lazy(() => import('./pages/StartSession'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Caja = lazy(() => import('./pages/Caja'));
const Historial = lazy(() => import('./pages/Historial'));
const Reportes = lazy(() => import('./pages/Reportes'));
const Configuracion = lazy(() => import('./pages/Configuracion'));

const App: Component = () => {
  return (
    <Router>
      <Route path="/" component={StartSession} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/caja" component={Caja} />
      <Route path="/historial" component={Historial} />
      <Route path="/reportes" component={Reportes} />
      <Route path="/configuracion" component={Configuracion} />
    </Router>
  );
};

export default App;