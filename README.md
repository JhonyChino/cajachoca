# Caja Choca - Sistema de Gestión de Caja Chica

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Descripción

**Caja Choca** es una aplicación de escritorio diseñada específicamente para la gestión eficiente de caja chica para pequeños negocios. El sistema permite llevar un control completo de ingresos y egresos, generando reportes detallados y facilitando la toma de decisiones financieras.

## 🎯 Problema que Resuelve

Las pequeñas empresas enfrentan dificultades para:

- **Controlar el efectivo diario** - Sin un registro formal, el dinero se mezcla y se pierde el control
- **Identificar gastos innecesarios** - No se sabe en qué se está gastando el dinero
- **Generar reportes** - Para calcular balances manualmente
- **Mantener historial** - Se pierde el registro histórico de transacciones
- **Justificar el uso del dinero** - Sin comprobantes ni categorías claras

**Caja Choca** resuelve estos problemas proporcionando:
- ✅ Registro simple y rápido de ingresos/egresos
- ✅ Categorización automática de transacciones
- ✅ Reportes en PDF y Excel
- ✅ Respaldo automático de datos
- ✅ Balance en tiempo real

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Frontend** | SolidJS + TypeScript |
| **Estilos** | Tailwind CSS + shadcn/ui |
| **Backend** | Rust + Tauri v2 |
| **Base de Datos** | SQLite |
| **Sistema de ventanas** | Windows API (nativo) |
| **Generación de PDFs** | printpdf |
| **Generación de Excel** | rust_xlsxwriter |

## 🚀 Características

- 📊 **Dashboard en tiempo real** - Visualiza ingresos, egresos y balance actual
- 💰 **Registro de transacciones** - Ingresos y egresos con categorías
- 📂 **Gestión de categorías** - Crea, edita y elimina categorías personalizadas
- 📈 **Reportes** - Genera reportes por período, tipo y categoría
- 💾 **Respaldo y restauración** - Guarda copias de seguridad de la base de datos
- 📅 **Historial completo** - Consulta todas las transacciones realizadas
- 🔒 **Datos locales** - Toda la información se guarda localmente (sin nube)

## 📦 Dependencias

### Frontend
```json
{
  "solid-js": "^1.8.0",
  "@tauri-apps/api": "^2.0.0",
  "tailwindcss": "^3.4.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0",
  "lucide-solid": "^0.300.0"
}
```

### Backend (Rust)
```toml
[dependencies]
tauri = "2.0.0"
rusqlite = "0.31.0"
chrono = "0.4.0"
printpdf = "0.7.0"
rust_xlsxwriter = "0.83.0"
serde = "1.0"
serde_json = "1.0"
```

## 🖥️ Requisitos del Sistema

- **Sistema Operativo:** Windows 11 (64-bit)
- **Memoria RAM:** 4 GB mínimo (8 GB recomendado)
- **Almacenamiento:** 100 MB libres
- **Procesador:** x86_64 compatible

## 📥 Instalación

### Opción 1: Instalador MSI (Recomendado)

1. Descarga el archivo `CajaChoca.msi` de la sección de releases
2. Ejecuta el instalador como administrador
3. Sigue las instrucciones del asistente de instalación
4. Inicia "Caja Choca" desde el menú inicio

### Opción 2: Código Fuente

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/cajachoca.git
cd cajachoca

# Instalar dependencias
npm install

# Desarrollo (para probar)
npm run tauri dev

# Producción (generar instalador)
npm run tauri build
```

El instalador se generará en:
```
src-tauri/target/release/bundle/msi/CajaChoca.msi
```

## 📁 Estructura del Proyecto

```
cajachoca/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── layout/         # Layout principal y sidebar
│   │   ├── modals/         # Modales de transacciones
│   │   └── ui/             # Componentes UI base
│   ├── pages/               # Páginas de la aplicación
│   │   ├── Dashboard.tsx    # Panel principal
│   │   ├── Caja.tsx         # Registro de transacciones
│   │   ├── Historial.tsx    # Lista de transacciones
│   │   ├── Reportes.tsx      # Generación de reportes
│   │   ├── Categorias.tsx   # Gestión de categorías
│   │   └── Configuracion.tsx # Configuración del sistema
│   ├── stores/              # Estados globales (SolidJS)
│   │   ├── sessionStore.ts
│   │   └── configStore.ts
│   └── lib/                 # Utilidades y API
├── src-tauri/
│   ├── src/
│   │   ├── commands.rs      # Comandos Tauri
│   │   ├── db.rs            # Base de datos SQLite
│   │   ├── models.rs        # Modelos de datos
│   │   └── services/        # Lógica de negocio
│   │       ├── transaction_service.rs
│   │       ├── report_service.rs
│   │       └── backup_service.rs
│   └── Cargo.toml
└── package.json
```

## 🔧 Configuración

### Moneda
El sistema soporta múltiples monedas:
- USD - Dólar estadounidense ($)
- BOB - Bolivianos (Bs.)
- EUR - Euro (€)

### Ruta de Reportes
Por defecto: `Documentos/CajaChoca/Reportes`

### Ruta de Backups
Por defecto: `Documentos/CajaChoca/Backups`

## 👨‍💻 Desarrollador

**Jhonny Ecl**

📧 **Correo:** jhony.ecl@gmail.com


---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios mayores, por favor abre un issue primero para discutir lo que te gustaría cambiar.

---

**¿Te gustó el sistema? Si quieres nuevas funcionalidades, contáctame. ¡Con gusto te ayudo!**
