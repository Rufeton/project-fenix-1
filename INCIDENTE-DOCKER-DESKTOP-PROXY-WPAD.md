# Incidente: Docker Desktop no podía descargar imágenes

## Resumen

Docker Desktop tenía el Engine local operativo, pero cualquier descarga desde Docker Hub terminaba por timeout:

```text
Get "https://registry-1.docker.io/v2/":
context deadline exceeded
(Client.Timeout exceeded while awaiting headers)
```

La causa era la detección automática de proxy de Windows. Docker Desktop heredaba esa configuración e intentaba obtener un archivo PAC desde:

```text
http://34.80.59.191/win.pac
```

La petición al PAC expiraba. Esto retrasaba o interrumpía las conexiones HTTPS realizadas a través del proxy interno de Docker Desktop y provocaba los timeouts de `docker pull`, del inicio de sesión y de otros servicios de Docker.

La incidencia se resolvió desactivando en Windows la detección automática y las demás opciones de proxy que no se estaban utilizando. Después de reiniciar Docker Desktop, la descarga de imágenes volvió a funcionar.

## Impacto en el Proyecto Fénix 1

La aplicación FastAPI necesita PostgreSQL. La primera intención era levantar la base de datos con una imagen oficial:

```powershell
docker pull postgres
```

Sin embargo, Docker Desktop tampoco podía descargar una imagen mínima de prueba:

```powershell
docker pull hello-world
```

Esto bloqueó el arranque de PostgreSQL y, como consecuencia, el backend seguía fallando al intentar ejecutar `Base.metadata.create_all()` contra `localhost:5432` sin una base de datos disponible.

## Entorno afectado

- Windows 11.
- Docker Desktop 4.45.0.
- Backend WSL 2.
- Contexto Docker `desktop-linux`.
- Docker Engine 28.3.3.
- WSL actualizado de 2.3.26.0 a 2.7.10.

## Síntomas

El síntoma principal era:

```powershell
docker pull hello-world
```

```text
Using default tag: latest
Error response from daemon:
Get "https://registry-1.docker.io/v2/":
context deadline exceeded
(Client.Timeout exceeded while awaiting headers)
```

También fallaban o quedaban bloqueados:

- `docker pull postgres`;
- el inicio de sesión en Docker Desktop;
- las búsquedas y descargas desde la interfaz;
- la comprobación o descarga de actualizaciones;
- varias conexiones de la interfaz con servicios de Docker.

## Evidencia previa

Antes de encontrar la causa se habían comprobado los siguientes hechos:

1. `docker version` mostraba tanto Client como Server. El daemon estaba arrancado.
2. Docker Desktop utilizaba el contexto `desktop-linux`.
3. Windows llegaba a `https://registry-1.docker.io/v2/` y recibía `401 Unauthorized`, que es la respuesta esperada sin autenticación.
4. Ubuntu dentro de WSL resolvía DNS, conectaba por TCP 443 y completaba TLS.
5. La distribución interna `docker-desktop` también obtenía `401 Unauthorized` usando `wget`.
6. Una reinstalación normal de Docker Desktop no había corregido el timeout.

Estas pruebas demostraban conectividad directa básica, pero no demostraban que funcionase la ruta exacta empleada por `docker pull`.

En particular, una petición manual con `wget` desde `docker-desktop` no atraviesa necesariamente los mismos componentes que una descarga iniciada por el daemon. Docker Desktop utiliza un proxy HTTP interno para parte del tráfico del host, del Engine y de los contenedores.

## Cómo se llegó a la causa

### 1. Se priorizó el componente común

El problema no afectaba únicamente al Registry. También fallaban el login, Docker Hub, las actualizaciones y otros endpoints HTTPS de Docker Desktop.

Esto hacía menos probable un fallo exclusivo de:

- la imagen `postgres`;
- la autenticación del Registry;
- un repositorio concreto;
- la resolución DNS de `registry-1.docker.io`.

El patrón apuntaba a un componente compartido por las conexiones HTTPS internas de Docker Desktop.

### 2. Se revisó `httpproxy.log`

El archivo principal fue:

```text
%LOCALAPPDATA%\Docker\log\host\httpproxy.log
```

El log mostraba repetidamente mensajes equivalentes a:

```text
evaluating PAC file: getting PAC interpreter:
Get "http://34.80.59.191/win.pac":
dial tcp 34.80.59.191:80: connectex: A connection attempt failed
```

A continuación aparecían intentos como:

```text
HTTP CONNECT registry-1.docker.io:443:
container via direct connection because automatic system has no HTTPS proxy
```

seguidos de:

```text
writing OK response: io: read/write on closed pipe
failed ... with 0 bytes transferred
```

El mismo patrón aparecía para varios destinos:

- `registry-1.docker.io`;
- `hub.docker.com`;
- `api.docker.com`;
- `desktop.docker.com`;
- `mcp.docker.com`.

### 3. Se correlacionó con `dockerd.log`

En:

```text
%LOCALAPPDATA%\Docker\log\vm\dockerd.log
```

los intentos de descarga terminaban con:

```text
context deadline exceeded
Client.Timeout exceeded while awaiting headers
```

La correlación era coherente:

```text
Docker Engine solicita la imagen
        ↓
El tráfico pasa por el proxy interno de Docker Desktop
        ↓
Docker Desktop intenta evaluar el PAC automático
        ↓
La descarga de win.pac expira
        ↓
La petición original agota su tiempo o cierra el pipe
        ↓
docker pull devuelve context deadline exceeded
```

### 4. Se comprobó la alternativa de containerd

En la configuración de Docker Desktop figuraba:

```json
"UseContainerdSnapshotter": false
```

Los pulls seguían fallando después de desactivar el almacén de imágenes de containerd. Los errores aparecían en `dockerd.log`, por lo que cambiar entre containerd y la ruta clásica no eliminaba el problema.

Esto redujo considerablemente la probabilidad de que containerd fuese la causa principal.

## Hipótesis confirmada

Docker Desktop estaba en modo de proxy del sistema. Aunque el proxy manual de Docker Desktop estuviese desactivado y sus campos apareciesen vacíos, eso no significaba que funcionase sin proxy.

En modo de sistema, Docker Desktop puede heredar de Windows:

- un proxy estático;
- un script PAC configurado explícitamente;
- un PAC descubierto automáticamente mediante WPAD.

En este caso, Docker Desktop había descubierto o conservaba como configuración automática la URL `http://34.80.59.191/win.pac`. La imposibilidad de descargarla afectaba al proxy interno.

No se determinó durante esta incidencia qué elemento de la red anunciaba esa dirección. La evidencia permite afirmar que Docker Desktop la estaba utilizando, pero no que el servidor PAC fuese malicioso ni cuál era su origen exacto.

## Prueba controlada

Se modificó una única variable: la detección automática de proxy de Windows.

Ruta utilizada:

```text
Configuración de Windows
→ Red e Internet
→ Proxy
```

Se dejaron desactivadas:

```text
Detectar la configuración automáticamente
Usar script de configuración
Usar servidor proxy
```

Después se reinició Docker Desktop y se repitió:

```powershell
docker pull hello-world
```

## Resultado

La imagen se descargó correctamente. No fue necesario cambiar:

- DNS;
- MTU;
- IPv6;
- contexto Docker;
- versión de WSL;
- daemon JSON;
- almacén de containerd;
- instalación de Docker Desktop.

El resultado confirma la relación causal, no solo una correlación:

```text
Antes: autodetección de proxy activada → docker pull falla
Después: autodetección desactivada     → docker pull funciona
```

## Solución aplicada

La solución fue mantener desactivada la configuración automática de proxy de Windows, dado que en este entorno no se utiliza conscientemente VPN, proxy corporativo ni servidor proxy manual.

La validación final debe incluir:

```powershell
docker pull hello-world
docker pull postgres
docker image ls
```

Una vez descargado PostgreSQL, el Proyecto Fénix 1 puede continuar levantando la base de datos y validando la conexión del backend.

## Por qué no funcionó la reinstalación

Una reinstalación normal de Docker Desktop reemplaza archivos de la aplicación, pero no elimina necesariamente:

- la configuración de proxy de Windows;
- la autodetección WPAD de la red;
- políticas de usuario o de equipo;
- configuración anunciada mediante DHCP o DNS;
- todo el estado almacenado fuera del directorio de instalación.

Por eso reinstalar Docker Desktop no afectó a la causa original.

## Lecciones de troubleshooting

1. Probar `/v2/` con `curl` o `wget` demuestra conectividad básica, no el flujo completo de `docker pull`.
2. Una prueba debe reproducir la misma ruta del componente que falla.
3. Si fallan varios servicios externos a la vez, conviene buscar primero el componente común.
4. “Proxy manual desactivado” no equivale a “sin proxy” cuando existe un modo de proxy del sistema.
5. Los logs con mayor valor para este caso fueron `httpproxy.log` y `dockerd.log`.
6. Una prueba A/B cambiando una sola variable proporciona evidencia más fuerte que aplicar varios arreglos simultáneos.
7. Reinstalar no resuelve configuraciones externas a la aplicación.

## Si el problema reaparece

Revisar primero las líneas más recientes de:

```text
%LOCALAPPDATA%\Docker\log\host\httpproxy.log
```

Buscar:

```powershell
rg -i "pac|proxy|registry-1\.docker\.io|deadline|closed pipe" `
  "$env:LOCALAPPDATA\Docker\log\host\httpproxy.log"
```

El estado esperado cuando Docker Desktop no usa ningún proxy es equivalente a:

```text
host will use proxy: disabled
Linux will use proxy: disabled
```

Si vuelve a aparecer `win.pac`, habría que investigar el origen de WPAD o de la configuración automática en Windows antes de modificar DNS, MTU o reinstalar Docker Desktop.

