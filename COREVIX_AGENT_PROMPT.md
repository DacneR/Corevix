# Prompt de Contexto para Agente — Proyecto Corevix

## 1) Objetivo general
Migrar la aplicación Corevix de una base en Python/FastAPI hacia una arquitectura moderna en Node.js + React, manteniendo la funcionalidad principal de monitoreo local de red, detección de dispositivos, registro de eventos y visualización en dashboard.

El proyecto debe operar como un monitor local de red con:
- backend API REST
- WebSocket para eventos en tiempo real
- detección de dispositivos conectados a la LAN
- historial de eventos
- frontend React con vista de dispositivos y actividad

---

## 2) Estado real del proyecto
Actualmente el proyecto está estructurado como monorepo:

- root: gestión de workspaces
- apps/server: backend Node.js + Fastify + Prisma + WebSocket
- apps/web: frontend React + Vite

Arquitectura base esperada:
- backend responsable de escaneo de red y almacenamiento
- frontend responsable de consultar API y mostrar estado en tiempo real
- base de datos SQLite local para persistencia de dispositivos y eventos

---

## 3) Plan que hemos seguido

### Fase 1 — Contexto y diagnóstico inicial
Se revisó el objetivo del proyecto, el tipo de entorno y la intención de mantener un sistema de monitoreo local.

Se confirmó que la aplicación original tenía un enfoque de:
- escaneo de red local
- detección de hosts activos
- persistencia de información de dispositivos
- eventos/app logs
- dashboard operativo

Se identificó que para la migración se necesitaba reemplazar:
- Python/FastAPI
- lógica de red vieja o insuficiente
- posible mock data o placeholders en frontend

---

### Fase 2 — Implementación del monorepo moderno
Se creó la estructura del proyecto con workspaces de npm:

- package.json raíz
- apps/server
- apps/web

Se configuraron scripts de desarrollo, build y arranque.

Se preparó el backend con:
- Fastify
- Prisma
- WebSocket Server
- Zod para validación
- dotenv para configuración

Se preparó el frontend con:
- React
- Vite
- consumo de API REST
- conexión WebSocket

---

### Fase 3 — Corrección de la lógica real de red
Se detectó un problema serio en la lógica de escaneo:
- se estaban generando direcciones de red incorrectas o inválidas
- la lógica de red no estaba usando la interfaz real del sistema correctamente
- el sistema no estaba resolviendo dispositivos reales de la LAN de forma consistente

Se revisó y corrigió el comportamiento en:
- apps/server/src/network.ts

La lógica correcta:
- detecta la interfaz IPv4 no interna del sistema
- obtiene la máscara y calcula la base de red
- consulta la tabla ARP del sistema
- si hay hosts reales en ARP, los devuelve primero
- si no los hay, realiza ping a rangos locales como fallback

Esto es la fuente de verdad para la detección de dispositivos.

---

### Fase 4 — Eliminación de datos falsos hardcodeados
Se encontró un problema crítico en la UI:
- había un payload de prueba con IP fija 192.168.1.0
- ese dato estaba siendo enviado desde el cliente al hacer escaneo
- era una entrada falsa que se veía como si fuese un dispositivo real

Se confirmó que la fuente era la interfaz en:
- apps/web/src/App.tsx

Se eliminó el valor hardcodeado y se dejó la llamada al backend sin payload mock:
- body: JSON.stringify({})

Esto evita que el frontend inyecte una IP inventada al escaneo.

---

### Fase 5 — Validación real del sistema
Se realizaron checks reales de ejecución, no solo análisis estático.

#### Verificación 1: build del proyecto
Comando ejecutado:

```bash
cd /home/depp/workspace/Corevix && npm run build
```

Resultado verificado:
- backend compila
- Prisma genera cliente
- frontend compila con Vite
- salida final: build correcto sin errores

#### Verificación 2: salud de la API
Comando ejecutado:

```bash
curl -sS http://127.0.0.1:8000/api/health
```

Respuesta verificada:

```json
{"status":"healthy","project":"Corevix","version":"2.0.0","timestamp":"2026-09-01T12:44:49.342Z"}
```

#### Verificación 3: escaneo de red real
Comando ejecutado:

```bash
curl -sS -X POST http://127.0.0.1:8000/api/devices/scan -H 'Content-Type: application/json' -d '{}'
```

Respuesta verificada:

```json
{"ok":true,"devices":[{"ip":"192.168.1.252"},{"ip":"192.168.1.254"},{"ip":"192.168.1.3"},{"ip":"192.168.1.4"}]}
```

Estos IPs corresponden a dispositivos reales detectados en la red local.

---

## 4) Problemas reales encontrados y corregidos

### Problema A — Puerto 8000 ocupado
Se detectó que otro proceso estaba ocupando 127.0.0.1:8000.

Se confirmó con el sistema operativo y se liberó el puerto antes de reiniciar el backend.

Esto fue necesario para que la API pudiera arrancar correctamente.

---

### Problema B — WebSocket con tipo incorrecto en TypeScript
El backend usaba un tipo `WebSocket` del navegador creyéndolo del paquete `ws` de Node.

Se corrigió por aliasing explícito:

```ts
import { WebSocketServer, type WebSocket as ServerWebSocket } from 'ws';
```

Esto eliminó el conflicto de tipos y permitió compilar correctamente.

---

### Problema C — Mock data hardcodeado en el cliente
Se encontró la IP falsa 192.168.1.0 dentro de la llamada de escaneo desde la interfaz.

Esto era un dato de prueba que quedaba insertado en frontend y podría engañar al usuario haciéndole pensar que había un dispositivo real.

Se eliminó antes de declarar el proyecto listo.

---

## 5) Archivos clave del proyecto

### Backend
- apps/server/src/index.ts
  - API REST
  - endpoints de salud, dispositivos y eventos
  - WebSocket server
  - lógica de scan

- apps/server/src/network.ts
  - detección real de red local
  - ARP + fallback por ping
  - lógica central del escaneo

- apps/server/prisma/schema.prisma
  - modelos Device y EventLog
  - persistencia local de datos

- apps/server/.env
  - configuración local del entorno

### Frontend
- apps/web/src/App.tsx
  - conexión a la API
  - consumo de WebSocket
  - tabla de dispositivos
  - panel de eventos
  - botón de escaneo

---

## 6) Regla de oro para continuar el trabajo
Nunca se debe declarar el proyecto como completamente listo si:
- hay datos mock o hardcodeados en la UI
- el escaneo no está mostrando dispositivos reales del entorno local
- la API no responde en vivo
- hay conflictos de puerto sin resolver
- el WebSocket no ha sido verificado con conexión real

La prioridad es:
1. detectar la verdad del entorno
2. evitar placeholders o mocks
3. validar con comandos reales
4. confirmar evidencia en terminal y navegador

---

## 7) Estado actual verificado
El proyecto está en un estado funcional comprobado:
- backend arrancado y respondiendo en http://127.0.0.1:8000
- frontend disponible en http://127.0.0.1:5173
- API devuelve salud correcta
- escaneo devuelve dispositivos reales detectados en LAN
- build del monorepo pasa correctamente
- se eliminó la fuente de datos fake en la UI

---

## 8) Comandos de arranque recomendados

### Backend
```bash
cd /home/depp/workspace/Corevix
npm run dev --workspace @corevix/server
```

### Frontend
```bash
cd /home/depp/workspace/Corevix
npm run dev --workspace @corevix/web -- --host 127.0.0.1
```

### Build completo
```bash
cd /home/depp/workspace/Corevix
npm run build
```

---

## 9) Prompt listo para reutilizar por un agente

"Continuamos con el proyecto Corevix, una migración de Python/FastAPI a Node.js + React con foco en monitoreo local de red.

Contexto del proyecto:
- monorepo con apps/server y apps/web
- backend en Fastify + Prisma + WebSocket
- frontend en React + Vite
- objetivo: detectar dispositivos activos en LAN, registrar eventos y mostrar dashboard en tiempo real

Requisitos para actuar:
- no introducir data mock ni placeholders
- priorizar detección real de dispositivos usando la lógica de red del backend
- usar la API real como fuente de verdad
- verificar con comandos reales y no suponer que el sistema está conectado solo porque compila

Estado verificado hasta ahora:
- build del proyecto pasa correctamente
- API responde en http://127.0.0.1:8000
- escaneo real devuelve dispositivos reales del entorno local
- se corrigió la lógica de red en apps/server/src/network.ts
- se eliminó el payload falso con IP 192.168.1.0 desde apps/web/src/App.tsx
- se corrigió el problema de tipos de WebSocket en apps/server/src/index.ts

Importante:
- no volver a usar IPs inventadas ni datos demo en UI
- no declarar la app como lista sin evidencia real de ejecución
- si aparece un puerto ocupado, resolverlo antes de arrancar
- si aparece un registro extraño, rastrearlo hasta la fuente exacta en código antes de darlo por válido

Objetivo actual:
Mantener el proyecto en funcionamiento real, validar cambios con pruebas de ejecución y dejar la aplicación lista para uso local de monitoreo de red con datos reales del entorno."

---

## 10) Resumen ejecutivo final
El trabajo no fue solo “crear un proyecto”, sino corregir la migración de un sistema real de monitoreo de red y asegurar que el datos que ven los usuarios provengan del entorno local y no de placeholders. La validación se hizo con evidencia real del sistema operativo, la API y el build del monorepo. El proyecto se encuentra en un estado funcional comprobado y listo para seguir evolucionando sin volver a introducir valores falsos.
