# Taller Automotriz "El Pistón"

Sistema web para la gestión integral de un taller mecánico, desarrollado con **PocketBase** (como Backend as a Service) y **HTML, CSS y JavaScript** puro (como cliente).

## Estructura del Proyecto

El repositorio está dividido en dos carpetas principales:
- **`/servidor`**: Contiene el binario de PocketBase, las migraciones de la base de datos (`pb_migrations`) y la lógica del servidor (`pb_hooks`).
- **`/cliente`**: Contiene la interfaz de usuario (`index.html`, `styles.css` y `app.js`) que consume la API a través del SDK oficial de PocketBase.

## Decisiones de Diseño

1. **Base de Datos Relacional:** Se diseñó un esquema relacional (Clientes → Vehículos → Órdenes) para garantizar la integridad de los datos y evitar la duplicación de información. Cada orden está vinculada a un vehículo y este, a su vez, a un cliente.
2. **Lógica de Negocio en el Servidor (Hooks):** Para garantizar la seguridad y la consistencia, el descuento de inventario se maneja del lado del servidor mediante un *hook* en `pb_hooks/main.pb.js`. Cuando se registra el uso de un repuesto en una orden, el servidor valida el stock y resta las existencias automáticamente, sin depender de lo que haga el cliente.
3. **Separación de Responsabilidades:** El cliente (HTML/JS) no contiene reglas de negocio complejas; su única función es capturar datos del usuario, enviarlos a la API y renderizar la información que recibe del servidor.
4. **Diseño de Interfaz (UI/UX):** 
   - Se optó por una paleta de colores sobria y profesional (tonos tierra, arena y marrón) que transmite seriedad, con soporte completo para **modo claro y oscuro**.
   - **Modales Propios:** Se implementaron ventanas modales para la confirmación de préstamos y eliminación, evitando el uso de `alert`, `prompt` o `confirm` del navegador, mejorando así la experiencia de usuario.
   - **Feedback Visual:** Se incluyen alertas visuales (como un indicador rojo en el menú de inventario cuando hay repuestos por agotarse) y bloqueo de edición en órdenes que ya han sido entregadas o canceladas.
5. **Arquitectura SPA (Single Page Application):** La aplicación carga una sola vez y cambia dinámicamente entre las 4 vistas (Órdenes, Inventario, Nuevo Ingreso y Reportes) sin recargar la página.

## Cómo ejecutar el proyecto

Sigue estos pasos para levantar el sistema en tu computadora:

### 1. Iniciar el servidor (PocketBase)
1. Abre una terminal o consola de comandos.
2. Navega hasta la carpeta `servidor`.
3. Ejecuta el siguiente comando para iniciar PocketBase y permitir conexiones desde el cliente local:
   ```bash
   pocketbase.exe serve --origins="http://127.0.0.1:5500,http://localhost:5500,http://localhost:8090"