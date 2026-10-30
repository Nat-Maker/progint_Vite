import { useState } from "react";

export default function App() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState("");

  const enviar = (e) => {
    e.preventDefault();
    if (!correo || !clave || !telefono || !nombre) {
      setMensaje("Escribe tu correo, tu contraseña, tu numero de telefono y nombre.");
      return;
    }
    setMensaje(`Bienvenido, ${correo}`);
  };

  return (
    <main style={{ maxWidth: 360, margin: "40px auto", padding: 16 }}>
      <h1>Iniciar sesión</h1>
      <form onSubmit={enviar} style={{ display: "grid", gap: 12 }}>
        <input type="email" placeholder="Correo" value={correo}
          onChange={(e) => setCorreo(e.target.value)} />
        <input type="password" placeholder="Contraseña" value={clave}
          onChange={(e) => setClave(e.target.value)} />
        <input type="text" placeholder="Telefono" value={telefono}
          onChange={(e) => setTelefono(e.target.value)} />
        <input type="text" placeholder="Nombre" value={nombre}
          onChange={(e) => setNombre(e.target.value)} />
        <button type="submit">Entrar</button>
      </form>
      <p>{mensaje}</p>
    </main>
  );
}
