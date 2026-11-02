// Obtener palabra aleatoria según la categoría elegida
app.get("/api/palabra", async (req, res) => {
  const { id_categoria } = req.query;

  try {
    // Aseguramos nombres de tabla en minúscula para evitar problemas en Linux/Windows
    let query = "SELECT p.palabra FROM palabra p";
    let params = [];

    // Limpieza de string del parámetro
    const cat = id_categoria ? String(id_categoria).trim() : null;

    if (cat && cat !== "TODAS" && cat !== "null" && cat !== "undefined") {
      // Validar si es un número real y no un string vacío
      if (!isNaN(cat) && cat.length > 0) {
        query += " WHERE p.id_categoria = ?";
        params.push(Number(cat));
      } else {
        query += " INNER JOIN categoria c ON p.id_categoria = c.id_categoria WHERE LOWER(c.nombre) LIKE LOWER(?)";
        params.push(`%${cat}%`);
      }
    }

    query += " ORDER BY RAND() LIMIT 1";

    const [rows] = await db.query(query, params);

    if (rows && rows.length > 0) {
      return res.json({ palabra: rows[0].palabra.trim().toUpperCase() });
    }
  } catch (error) {
    // Imprimimos el error completo para saber exactamente qué falló en la consola
    console.error("🔴 Error en /api/palabra:", error);
  }

  // Fallback si la categoría elegida no tiene palabras cargadas en la BD
  const palabrasRespaldo = ["MATE", "EMPANADA", "OBELISCO", "ASADO", "CARPINCHO", "MESSI"];
  const palabraAzar = palabrasRespaldo[Math.floor(Math.random() * palabrasRespaldo.length)];

  return res.json({ palabra: palabraAzar });
});