import { Component, JSX } from 'solid-js';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: JSX.Element;
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
}

const AppLayout: Component<AppLayoutProps> = (props) => {
  const showSidebar = props.showSidebar !== false;

  if (!showSidebar) {
    return <>{props.children}</>;
  }

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div class="ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <Header title={props.title} subtitle={props.subtitle} />

        {/* Page Content */}
        <main class="flex-1 p-8 overflow-auto">
          {props.children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;