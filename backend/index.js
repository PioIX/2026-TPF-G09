var express = require('express'); 
var bodyParser = require('body-parser'); 
var cors = require('cors');
const { realizarQuery } = require('./modulos/mysql');

var app = express(); 
var port = process.env.PORT || 4000; 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Servidor a escuchar
app.listen(port, function(){
    console.log(`Server running in http://localhost:${port}`);
});

app.get('/', function(req, res){
    res.status(200).send({ message: 'Entraste pa!' });
});

/* ==========================================
   RUTAS DE AUTENTICACIÓN (Usuario)
   ========================================== */

// REGISTRO DE USUARIO
app.post('/registro', async function(req, res) {
    console.log("Datos recibidos en /registro:", req.body);
    
    // Acepta datos del frontend (nombre/usuario, mail/email, contraseña/contrasena, edad)
    const nombre = req.body.nombre || req.body.usuario;
    const mail = req.body.mail || req.body.email;
    const contraseña = req.body.contraseña || req.body.contrasena || req.body.clave;
    const edad = req.body.edad || 18; // Si no manda edad, pone 18 por defecto


    console.log("nombre", nombre);
    console.log("mail", mail);
    console.log("contraseña", contraseña);


    if (!nombre || !mail || !contraseña) {
        return res.status(400).send({ message: "Completá todos los campos obligatorios" });
    }

    try {
        // Verificar si ya existe en la tabla Usuario por mail o nombre
        let usuarioExistente = await realizarQuery(
            `SELECT * FROM Usuario WHERE mail="${mail}" OR nombre="${nombre}"`
        );

        if (usuarioExistente && usuarioExistente.length > 0) {
            return res.status(400).send({ message: "El usuario o email ya existe" });
        }

        // Insertar en la tabla Usuario
        await realizarQuery(`
            INSERT INTO Usuario (nombre, edad, mail, contraseña) VALUES
            ("${nombre}", ${edad}, "${mail}", "${contraseña}");
        `);

        res.status(200).send({ message: "Usuario registrado con éxito" });
    } catch (error) {
        console.error("Error en /registro:", error);
        res.status(500).send({ message: "Error interno en la base de datos" });
    }
});

// LOGIN DE USUARIO
app.post('/login', async function(req, res) {
    console.log("Datos recibidos en /login:", req.body);
    
    const usuarioIngresado = req.body.usuario || req.body.nombre;
    const claveIngresada = req.body.clave || req.body.contrasena || req.body.contraseña;

    if (!usuarioIngresado || !claveIngresada) {
        return res.status(400).send({ message: "Ingresá usuario y contraseña" });
    }

    try {
        // Buscar por nombre o mail
        let resultado = await realizarQuery(
            `SELECT * FROM Usuario WHERE (nombre="${usuarioIngresado}" OR mail="${usuarioIngresado}") AND contraseña="${claveIngresada}"`
        );

        if (resultado && resultado.length > 0) {
            res.status(200).send({ 
                message: "Login correcto", 
                usuario: resultado[0].nombre 
            });
        } else {
            res.status(401).send({ message: "Usuario o contraseña incorrectos" });
        }
    } catch (error) {
        console.error("Error en /login:", error);
        res.status(500).send({ message: "Error en la base de datos" });
    }
});

/* ==========================================
   RUTAS DE CLUBES, ESTADIOS Y JUGADORES
   ========================================== */

app.get('/clubes', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Clubes WHERE id=${req.query.id}`);
    } else {
        respuesta = await realizarQuery("SELECT * FROM Clubes");
    }    
    res.send(respuesta);
});

app.get('/estadios', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Estadios WHERE id=${req.query.id}`);
    } else {
        respuesta = await realizarQuery("SELECT * FROM Estadios");
    }    
    res.send(respuesta);
});

app.get('/jugadores', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Jugadores WHERE id=${req.query.id}`);
    } else {
        respuesta = await realizarQuery("SELECT * FROM Jugadores");
    }    
    res.send(respuesta);
});

app.post('/clubes', async function(req,res) {
    let clubExistente = await realizarQuery(`SELECT nombre_equipo FROM Clubes WHERE nombre_equipo="${req.body.nombre_equipo}"`);
    if (clubExistente.length > 0) {
        res.send("El club ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Clubes (nombre_equipo,nombre_dt,posicion_tabla) VALUES
        ("${req.body.nombre_equipo}","${req.body.nombre_dt}",${req.body.posicion_tabla});
        `);
        res.send({message: "Club agregado"});
    }
});

app.post('/Estadios', async function(req,res) {
    let estadioExistente = await realizarQuery(`SELECT nombre_estadio FROM Estadios WHERE nombre_estadio="${req.body.nombre_estadio}"`);
    if (estadioExistente.length > 0) {
        res.send("El estadio ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Estadios (nombre_estadio,ciudad,fecha_construccion,capacidad_espectadores,id_club) VALUES
        ("${req.body.nombre_estadio}","${req.body.ciudad}","${req.body.fecha_construccion}",${req.body.capacidad_espectadores},${req.body.id_club});
        `);
        res.send("Estadio agregado");
    }
});

app.post('/Jugadores', async function(req,res) {
    let jugadorExistente = await realizarQuery(`SELECT apellido_jugador FROM Jugadores WHERE apellido_jugador="${req.body.apellido_jugador}"`);
    if (jugadorExistente.length > 0) {
        res.send("El jugador ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Jugadores (nombre_jugador,apellido_jugador,num_camiseta,posicion,id_club) VALUES
        ("${req.body.nombre_jugador}","${req.body.apellido_jugador}",${req.body.num_camiseta},"${req.body.posicion}",${req.body.id_club});
        `);
        res.send("Jugador agregado");
    }
});

app.put('/clubes', async function(req,res) {
    await realizarQuery(`
    UPDATE Clubes SET
        posicion_tabla=${req.body.posicion_tabla}
    WHERE id=${req.body.id};
    `);
    res.send("Club actualizado");
});

app.put('/estadios', async function(req,res) {
    await realizarQuery(`
    UPDATE Estadios SET
        capacidad_espectadores=${req.body.capacidad_espectadores}
    WHERE id=${req.body.id};
    `);
    res.send("Estadio actualizado");
});

app.put('/Jugadores', async function(req,res) {
    await realizarQuery(`
    UPDATE Jugadores SET
        num_camiseta=${req.body.num_camiseta}
    WHERE id=${req.body.id};
    `);
    res.send("Jugador actualizado");
});

app.delete('/clubes', async function(req,res) {
    await realizarQuery(`DELETE FROM Clubes WHERE id=${req.body.id};`);
    res.send("Club eliminado");
});

app.delete('/estadios', async function(req,res) {
    await realizarQuery(`DELETE FROM Estadios WHERE id=${req.body.id};`);
    res.send("Estadio eliminado");
});

app.delete('/jugadores', async function(req,res) {
    await realizarQuery(`DELETE FROM Jugadores WHERE id=${req.body.id};`);
    res.send("Jugador eliminado");
});