# Corevix

Corevix es una plataforma de administración y monitoreo de redes locales, diseñada para proporcionar a los administradores de red una visión centralizada del estado de los dispositivos conectados en tiempo real.

Su objetivo es descubrir automáticamente los equipos presentes en una red privada, recopilar información relevante de cada uno y notificar los cambios que ocurran durante su funcionamiento, permitiendo un monitoreo continuo desde una interfaz web y una consola administrativa.

---

# Objetivo

Desarrollar una herramienta capaz de observar una red local y proporcionar información en tiempo real sobre los dispositivos conectados, facilitando la supervisión, el diagnóstico y la administración de la infraestructura de red sin necesidad de instalar software en los equipos monitoreados.

---

# Funcionalidades

- Descubrimiento automático de dispositivos.
- Monitoreo en tiempo real.
- Detección de conexiones y desconexiones.
- Identificación de direcciones IP y MAC.
- Obtención del nombre del dispositivo (Hostname) cuando sea posible.
- Identificación del fabricante mediante la dirección MAC.
- Registro de eventos del sistema.
- Dashboard web en tiempo real.
- API REST para integración con otros sistemas.
- Consola administrativa (CLI).

---

# Tecnologías

## Backend

- Python
- FastAPI
- Uvicorn

## Comunicación

- REST API
- WebSockets

## Descubrimiento de red

- Scapy
- Psutil
- Socket
- Netifaces

## Base de datos

- SQLite
- SQLAlchemy

## Frontend

- HTML
- Tailwind CSS
- JavaScript

## Herramientas

- Git
- GitHub
- Visual Studio Code

---

# Arquitectura

```
Administrador
      │
      ▼
CLI / Dashboard Web
      │
      ▼
Corevix Server
      │
 ┌───────────────┐
 │ API REST      │
 │ WebSockets    │
 │ Scanner       │
 │ Database      │
 └───────────────┘
      │
      ▼
Red Local
```

---

# Instalación

Clonar el repositorio

```bash
git clone https://github.com/USUARIO/corevix.git
```

Ingresar al proyecto

```bash
cd corevix
```

Crear el entorno virtual

```bash
python3 -m venv .venv
```

Activar el entorno

```bash
source .venv/bin/activate
```

Instalar dependencias

```bash
pip install -r requirements.txt
```

Ejecutar el servidor

```bash
uvicorn app.main:app --reload
```

---

# Documentación

Una vez iniciado el servidor:

Swagger UI

```
http://127.0.0.1:8000/docs
```

ReDoc

```
http://127.0.0.1:8000/redoc
```

---

# Estado del proyecto

🚧 En desarrollo.

Actualmente Corevix se encuentra en la construcción de su núcleo de monitoreo de red y administración de dispositivos.

---

# Licencia

Proyecto desarrollado con fines educativos, investigación y administración de redes locales.