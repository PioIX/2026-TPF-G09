# Argentillo

## Descripción del proyecto

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



# 6. Resultado esperado

Esperamos desarrollar una página web funcional en la que varios jugadores puedan jugar una partida de dibujo y adivinanzas.

La idea principal es que sea un juego **simple, fácil de usar y divertido**, con una temática relacionada con Argentina.



# 7. Presupuesto



### Distribución sugerida del equipo



| Integrante | Rol principal | Tareas |
|---|---|---|
| Lucio Rosenthal | Frontend / UI | Maquetado de pantallas, estilos, identidad visual |
| Gabriel Benitez | Backend / Datos | Usuarios, salas y conexión con la base de datos |
| Santino Ratto | Lógica de juego | Turnos, puntuación y comunicación en tiempo real |
| Lorenzo Beccaria | Canvas / Diseño | Tablero de dibujo y bocetos en Canva |

### Recursos y herramientas

| Herramienta | Uso 
|---|---|---|
| React / Next.js | Framework de frontend 
| HTML Canvas | Tablero de dibujo 
| Base de datos (ej. Firebase o Supabase) | Usuarios, salas y puntajes 
| Servicio de tiempo real  | Sincronizar dibujo y turnos 
| GitHub | Repositorio y control de versiones 
| Canva / Figma | Bocetos y diseño visual 



