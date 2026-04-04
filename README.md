# 🐑 Rancho Ovino — Sistema de Gestión Ganadera

Sistema web para gestión de ganado ovino con base de datos en tiempo real (Supabase).

## Estructura del proyecto

```
rancho-ovino/
├── index.html          ← Página principal (toda la UI)
├── css/
│   ├── base.css        ← Variables, layout, header, navegación
│   ├── auth.css        ← Pantalla de login y registro
│   └── components.css  ← Tablas, modales, formularios, dashboard
└── js/
    ├── config.js       ← Conexión con Supabase (URL y API key)
    ├── utils.js        ← Funciones compartidas (toast, formato, badges)
    ├── auth.js         ← Login, registro y cierre de sesión
    ├── animales.js     ← CRUD de animales
    ├── reproduccion.js ← CRUD de empadres y partos
    ├── produccion.js   ← CRUD de pesos
    ├── salud.js        ← CRUD de eventos de salud
    ├── ventas.js       ← CRUD de ventas y detalle de ventas
    ├── dashboard.js    ← Gráficas y estadísticas
    ├── realtime.js     ← Suscripciones en tiempo real
    └── app.js          ← Inicialización principal
```

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 / CSS3 / JavaScript | Frontend sin frameworks |
| [Supabase](https://supabase.com) | Base de datos PostgreSQL en la nube + Auth + Realtime |
| [Chart.js](https://chartjs.org) | Gráficas del dashboard |
| Google Fonts | Tipografías (Playfair Display + Lato) |

## Funcionalidades

- 🔐 **Autenticación** — Login y registro con correo y contraseña (Supabase Auth)
- 🐑 **Animales** — Registro con identificador, sexo, raza, estado, padre y madre
- 🐣 **Reproducción** — Empadres con cálculo automático de parto estimado (5 meses)
- ⚖️ **Producción** — Registro de pesos por animal y fecha
- 💉 **Salud** — Vacunas, enfermedades, tratamientos y desparasitaciones
- 💰 **Ventas** — Registro de ventas con cliente y total
- 🧾 **Detalle de ventas** — Animales incluidos en cada venta con precio y peso
- 📊 **Dashboard** — Estadísticas generales y 4 gráficas en tiempo real
- ⚡ **Tiempo real** — Todos los cambios se reflejan automáticamente en todos los dispositivos conectados

## Cómo ejecutar localmente

1. Clona o descarga este repositorio
2. Abre `index.html` directamente en tu navegador

> **Nota:** Por usar módulos JS separados, si abres el archivo directo desde el explorador
> de archivos (protocolo `file://`) algunos navegadores pueden bloquear los scripts.
> Para evitarlo, usa la extensión **Live Server** en VS Code o publica en GitHub Pages.

## Publicar en GitHub Pages

1. Sube la carpeta completa a un repositorio de GitHub
2. Ve a **Settings → Pages**
3. En *Branch* selecciona `main` y carpeta `/root`
4. Guarda — en 2 minutos tendrás tu link público

## Base de datos (Supabase)

El esquema SQL completo está en `database/schema.sql`.  
Para compartir el proyecto sin dar acceso a tu cuenta, exporta el esquema y
el receptor crea su propio proyecto gratuito en [supabase.com](https://supabase.com).

## Modificar la conexión

Edita el archivo `js/config.js`:

```js
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_KEY = 'eyJ...tu-anon-key...';
```
