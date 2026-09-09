# Previasis - Frontend (Next.js + React + TypeScript)

Esqueleto frontend moderno, modular y completamente compatible con el backend de Express + TypeScript del proyecto Previasis.

---

## 🚀 Tecnologías Principales

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Librería de UI**: [React 19](https://react.dev/)
- **Lenguaje**: TypeScript (con paths `@/*`)
- **Estilos**: Vanilla CSS Design System con tokens variables, Dark/Light mode y glassmorphism.
- **Tiempo Real**: `socket.io-client` integrado mediante Contexto y autenticación vía JWT handshake.
- **Iconografía**: `lucide-react`

---

## 📁 Estructura del Proyecto

```
frontend/
├── .env.example                # Variables de entorno modelo
├── .env.local                  # Variables de entorno locales
├── next.config.mjs             # Configuración de Next.js y rewrites
├── package.json                # Dependencias del frontend
├── tsconfig.json               # Configuración de TypeScript con alias @/*
└── src/
    ├── app/                    # Next.js App Router
    │   ├── layout.tsx          # Root Layout con AppProviders
    │   ├── page.tsx            # Landing interactiva con diagnóstico de conexión
    │   ├── loading.tsx         # Skeleton loader global
    │   ├── not-found.tsx       # Manejo de error 404
    │   ├── error.tsx           # Error Boundary
    │   ├── (auth)/             # Rutas de autenticación
    │   │   ├── login/          # Inicio de sesión
    │   │   └── register/       # Registro de usuario
    │   └── (dashboard)/        # Panel administrativo y módulos
    │       ├── layout.tsx      # Layout con Sidebar
    │       └── dashboard/      # Vista de métricas y CRUD
    │           └── users/      # Módulo CRUD de usuarios
    ├── components/
    │   ├── common/             # Navbar, Footer, Sidebar, StatusIndicator
    │   └── ui/                 # Button, Input, Card, Badge, Spinner
    ├── config/
    │   ├── api.config.ts       # Endpoints de API espejados del backend
    │   ├── env.config.ts       # Variables de entorno tipadas
    │   └── site.config.ts      # Metadatos del sitio
    ├── context/
    │   ├── AppProviders.tsx    # Proveedor global de contextos
    │   ├── AuthContext.tsx     # Estado y ciclo de vida de autenticación JWT
    │   ├── SocketContext.tsx   # Conexión persistente a Socket.IO
    │   └── ThemeContext.tsx    # Manejador de tema Claro/Oscuro
    ├── hooks/
    │   ├── useAuth.ts          # Hook para estado de sesión
    │   ├── useSocket.ts        # Hook para emitir y suscribirse a eventos socket
    │   ├── useFetch.ts         # Hook para llamadas a la API
    │   └── useLocalStorage.ts  # Hook para almacenamiento local reactivo
    ├── interfaces/
    │   ├── api.interfaces.ts   # Formato de respuesta { message, data }
    │   ├── auth.interfaces.ts  # Tipos de sesión y tokens
    │   ├── user.interfaces.ts  # Mapeo idéntico al UserInterface del backend
    │   └── socket.interfaces.ts# Eventos de tiempo real
    ├── services/
    │   ├── api.client.ts       # Cliente HTTP centralizado con token Bearer
    │   ├── auth.service.ts     # Servicio de login, register y perfil
    │   ├── user.service.ts     # Servicio de usuarios (CRUD completo)
    │   └── socket.service.ts   # Conector Socket.IO con handshake auth
    ├── styles/
    │   └── globals.css         # Sistema de diseño y estilos globales
    └── utils/
        ├── storage.utils.ts    # Manejador de LocalStorage para JWT
        ├── format.utils.ts     # Utilidades de formateo
        └── constants.ts        # Constantes de roles y configuración
```

---

## 🔌 Compatibilidad con el Backend

| Característica | Backend Express | Frontend Next.js |
| :--- | :--- | :--- |
| **Respuesta API** | `{ message: string, data?: T }` | `ApiResponse<T>` con parseo transparente en `api.client.ts` |
| **Autenticación** | JWT con payload `{ ci, role, user_id }` | `AuthContext` + `storage.utils.ts` inyectando `Bearer <token>` |
| **Socket.IO** | `socket.handshake.auth?.token` | `SocketService.getSocket()` enviando `auth: { token }` |
| **Rutas Base** | Prefijo `/api/*` (ej. `/api/users`, `/api/tournament`) | `API_ENDPOINTS` centralizado en `src/config/api.config.ts` |
| **Tipado Modelo** | `UserInterface` en `example.interfaces.ts` | `UserInterface` idéntico en `src/interfaces/user.interfaces.ts` |

---

## 🛠️ Instalación y Ejecución

1. **Instalar dependencias:**
   ```bash
   cd frontend
   npm install
   ```

2. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   El frontend se levantará en [http://localhost:3000](http://localhost:3000).

3. **Iniciar el backend:**
   En otra terminal:
   ```bash
   cd ../backend
   npm run dev
   ```
   El backend se levantará en [http://localhost:3004](http://localhost:3004) con Swagger en `/swagger`.
