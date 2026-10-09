```jsx
"use client";

import Link from "next/link";
import "./login.css";

export default function Login() {
  function handleSubmit(event) {
    event.preventDefault();
    alert("El inicio de sesión todavía no está conectado a la base de datos.");
  }

  return (
    <div className="login-container">
      <h1>Pinturillo</h1>

      <form className="login-form" onSubmit={handleSubmit}>
        <h3>Iniciar sesión</h3>

        <label htmlFor="usuario">Usuario</label>
        <input
          type="text"
          id="usuario"
          required
        />

        <label htmlFor="contrasena">Contraseña</label>
        <input
          type="password"
          id="contrasena"
          required
        />

        <button type="submit">Entrar</button>

        <p>
          ¿No tenés cuenta? <Link href="/registro">Registrate</Link>
        </p>
      </form>
    </div>
  );
}
```
