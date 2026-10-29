// Obtener palabra aleatoria según la categoría elegida
app.get("/api/palabra", async (req, res) => {
  const { id_categoria } = req.query;

  try {
    let query = "SELECT p.palabra FROM Palabra p";
    let params = [];

    // Si viene una categoría válida (distinta de TODAS / indefinida)
    if (
      id_categoria &&
      id_categoria !== "TODAS" &&
      id_categoria !== "null" &&
      id_categoria !== "undefined"
    ) {
      if (!isNaN(id_categoria)) {
        // Filtrar por ID de la categoría (ej: 1, 2, 3)
        query += " WHERE p.id_categoria = ?";
        params.push(Number(id_categoria));
      } else {
        // Filtrar por Nombre de la categoría (ej: "futbol", "deportes")
        query += " INNER JOIN categoria c ON p.id_categoria = c.id_categoria WHERE LOWER(c.nombre) LIKE LOWER(?)";
        params.push(`%${id_categoria}%`);
      }
    }

    query += " ORDER BY RAND() LIMIT 1";

    const [rows] = await db.query(query, params);

    if (rows && rows.length > 0) {
      return res.json({ palabra: rows[0].palabra.trim().toUpperCase() });
    }
  } catch (error) {
    console.error("🔴 Error al filtrar palabra:", error.message);
  }

  // Fallback si la categoría elegida no tiene palabras cargadas en la BD
  const palabrasRespaldo = ["MATE", "EMPANADA", "OBELISCO", "ASADO", "CARPINCHO", "MESSI"];
  const palabraAzar = palabrasRespaldo[Math.floor(Math.random() * palabrasRespaldo.length)];

  return res.json({ palabra: palabraAzar });
});