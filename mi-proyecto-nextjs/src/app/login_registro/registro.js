"use client";

import Link from "next/link";
import "./registro.css";

export default function Registro() {
function handleSubmit(event) {
event.preventDefault();
alert("El registro todavía no está conectado a la base de datos.");
}

return ( <div className="registro-container"> <div className="registro-header"> <h1>Pinturillo</h1> </div>

```
  <form className="registro-form" onSubmit={handleSubmit}>
    <h3>Crear cuenta</h3>

    <label htmlFor="usuario">Usuario</label>
    <input type="text" id="usuario" required />

    <label htmlFor="email">Email</label>
    <input type="email" id="email" required />

    <label htmlFor="contrasena">Contraseña</label>
    <input type="password" id="contrasena" required />

    <button type="submit">Registrarme</button>

    <p>
      ¿Ya tenés cuenta? <Link href="/login">Ingresá</Link>
    </p>
  </form>
</div>

);
}
