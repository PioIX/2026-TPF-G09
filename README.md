# Argentillo

## 1. Descripción del proyecto

### Nombre de la aplicación

**Argentillo**

### Descripción general

Argentillo será un juego web inspirado en Pinturillo, pero con una temática argentina.

La idea es que varios jugadores puedan jugar una partida en la que uno dibuja una palabra y los demás tienen que adivinarla.

Las palabras estarán relacionadas con Argentina, por ejemplo comidas, lugares, deportes, animales y personajes.

### Problemática o necesidad

El proyecto busca crear un juego simple y entretenido para jugar con amigos desde una página web.

También busca adaptar el formato de Pinturillo a una temática argentina.

### Público objetivo

Está dirigido principalmente a adolescentes y jóvenes que quieran jugar con amigos.

### Objetivo general

Crear un juego web en el que los jugadores puedan dibujar y adivinar palabras relacionadas con Argentina.

### Principales funcionalidades

* Registro e inicio de sesión.
* Crear una sala.
* Unirse a una sala.
* Elegir una palabra para dibujar.
* Dibujar en un tablero.
* Escribir respuestas.
* Sistema de puntos.
* Turnos entre jugadores.
* Mostrar el ganador al finalizar.

---

# 2. Alcance

El proyecto incluirá las siguientes funcionalidades:

### Usuarios

Los jugadores podrán registrarse e iniciar sesión para ingresar al juego.

### Salas

Los jugadores podrán crear una sala y otros jugadores podrán unirse a ella.

### Juego

Durante la partida, un jugador será elegido para dibujar una palabra.

Los demás jugadores tendrán que intentar adivinar qué está dibujando.

Cuando un jugador adivine correctamente, recibirá puntos.

Después de un tiempo determinado, se pasará al siguiente turno.

### Tablero de dibujo

El jugador que tenga el turno podrá dibujar utilizando un tablero.

Para realizar el trazado del mouse se utilizará **HTML Canvas**, que permitirá detectar el movimiento y los clics del mouse para dibujar sobre la pantalla.

Contará con herramientas básicas como:

* Lápiz.
* Borrador.
* Colores.
* Limpiar dibujo.

### Respuestas

Los jugadores podrán escribir sus respuestas en un espacio destinado para eso.

### Puntuación

Cada respuesta correcta sumará puntos.

Durante la partida se podrá ver el puntaje de cada jugador.

### Final de la partida

Al terminar las rondas se mostrará una pantalla con los puntajes y el ganador.

---

# 3. Características del producto final

Al finalizar el proyecto, Argentillo deberá permitir:

* Registrarse e iniciar sesión.
* Crear una sala.
* Unirse a una sala.
* Jugar una partida.
* Dibujar utilizando Canvas.
* Adivinar palabras.
* Sumar puntos.
* Ver los puntajes.
* Ver quién ganó.

Las palabras utilizadas estarán relacionadas con Argentina.

---

# 4. Tecnologías

Para realizar el proyecto utilizaremos:

* **React**
* **Next.js**
* **JavaScript**
* **CSS**
* **HTML Canvas**, para realizar el tablero de dibujo y detectar el trazado del mouse.
* **Base de datos** (ej. Firebase o Supabase), para usuarios, salas y puntajes.
* **Servicio de comunicación en tiempo real** (ej. Socket.io, WebSockets o Firebase Realtime Database), para sincronizar el dibujo, los turnos y las respuestas entre todos los jugadores de una misma sala.
* **GitHub**

---

# 5. Diseño inicial

Se realizarán bocetos de las principales pantallas antes de comenzar a programar.

Las pantallas principales serán:

### Inicio de sesión

Permitirá ingresar con un usuario y contraseña o registrarse.

### Menú principal

Permitirá:

* Crear una sala.
* Unirse a una sala.

### Sala

Mostrará los jugadores que están dentro de la partida y permitirá comenzar el juego.

### Juego

Contará con:

* Tablero de dibujo realizado con **Canvas**.
* Palabra para el jugador que dibuja.
* Espacio para escribir respuestas.
* Puntajes.
* Temporizador.

### Resultados

Mostrará los puntajes finales y el ganador.

Los diseños se realizarán en **Figma o Canva** y mantendrán un estilo similar en todas las pantallas.

---

# 6. Resultado esperado

Esperamos desarrollar una página web funcional en la que varios jugadores puedan jugar una partida de dibujo y adivinanzas.

La idea principal es que sea un juego **simple, fácil de usar y divertido**, con una temática relacionada con Argentina.

---

# 7. Presupuesto

### 7.1 Nota técnica importante

En el documento de alcance original no figuraba ninguna tecnología para sincronizar el juego en tiempo real entre jugadores. Como Argentillo es multijugador (varios jugadores viendo el mismo dibujo y las mismas respuestas al mismo tiempo), se va a necesitar algo que transmita esa información de un jugador a otro mientras juegan — por ejemplo **Socket.io**, **WebSockets**, o la base de datos en tiempo real de **Firebase**. Ya se incorporó a la sección 4 (Tecnologías).

Sin esto, cada jugador vería su propia partida por separado y el juego no funcionaría como multijugador. Por eso se agregó como una etapa aparte en el presupuesto, ya que afecta directamente las horas estimadas.

### 7.2 Horas estimadas por etapa

| Etapa | Tareas incluidas | Horas (equipo) |
|---|---|---|
| Planificación y diseño | Definición de alcance, bocetos en Canva, identidad visual | 8 h |
| Configuración inicial | Setup de React/Next.js, repositorio en GitHub, conexión a base de datos | 6 h |
| Usuarios | Registro e inicio de sesión | 10 h |
| Salas | Crear sala y unirse a una sala existente | 10 h |
| Lógica de juego y turnos | Elegir palabra, orden de turnos, temporizador | 12 h |
| Comunicación en tiempo real | Sincronizar dibujo, turnos y respuestas entre jugadores (ver 7.1) | 14 h |
| Tablero de dibujo (Canvas) | Lápiz, borrador, colores, limpiar dibujo | 12 h |
| Respuestas y puntuación | Envío de respuestas y suma de puntos | 8 h |
| Pantalla de resultados | Puntajes finales y ganador | 4 h |
| Pruebas y correcciones | Testing general y corrección de errores | 10 h |
| Documentación y entrega | README, presupuesto, preparación de la entrega | 4 h |

**Total estimado: 98 horas de equipo ≈ 25 horas por integrante.**

### 7.3 Distribución sugerida del equipo

Propuesta orientativa de roles, pensada para repartir el trabajo de forma pareja. Puede ajustarse según las fortalezas de cada uno.

| Integrante | Rol principal | Tareas |
|---|---|---|
| Lucio Rosenthal | Frontend / UI | Maquetado de pantallas, estilos, identidad visual |
| Gabriel Benitez | Backend / Datos | Usuarios, salas y conexión con la base de datos |
| Santino Ratto | Lógica de juego | Turnos, puntuación y comunicación en tiempo real |
| Lorenzo Beccaria | Canvas / Diseño | Tablero de dibujo y bocetos en Canva |

### 7.4 Recursos y herramientas

| Herramienta | Uso | Costo |
|---|---|---|
| React / Next.js | Framework de frontend | Gratis (open source) |
| HTML Canvas | Tablero de dibujo | Gratis (nativo del navegador) |
| Base de datos (ej. Firebase o Supabase) | Usuarios, salas y puntajes | Gratis en plan free tier |
| Servicio de tiempo real (ej. Socket.io o Firebase Realtime DB) | Sincronizar dibujo y turnos | Gratis / incluido según la opción elegida |
| GitHub | Repositorio y control de versiones | Gratis |
| Canva / Figma | Bocetos y diseño visual | Gratis |
| Hosting (ej. Vercel) | Publicar la app | Gratis en plan free tier |

Costo monetario total estimado: **$0**. Al ser un proyecto académico, se usan planes gratuitos en todas las herramientas — el verdadero "costo" del proyecto es el tiempo de trabajo del equipo (ver 7.2).

### 7.5 Cronograma estimado

Planificado en 6 semanas de referencia. Ajustar según las fechas reales de entrega del curso.

| Período | Foco de trabajo |
|---|---|
| Semana 1 | Planificación, alcance y bocetos en Canva |
| Semana 2 | Configuración del proyecto + Usuarios y Salas |
| Semana 3 | Lógica de juego y turnos + inicio de comunicación en tiempo real |
| Semana 4 | Tablero de dibujo con Canvas + continuar comunicación en tiempo real |
| Semana 5 | Respuestas, puntuación y pantalla de resultados |
| Semana 6 | Pruebas, corrección de errores, documentación y entrega |

### 7.6 Supuestos

* Las horas son estimaciones de equipo completo (4 personas trabajando en paralelo en distintas tareas), no horas por persona en serie.
* Se asume una dedicación aproximada de 4 horas semanales por integrante.
* Los costos son $0 porque se usan planes gratuitos (free tier) de todas las herramientas listadas.
* La distribución de roles es una propuesta: el equipo puede reasignarla según intereses y conocimientos previos.
