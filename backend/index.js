var express = require('express'); //Tipo de servidor: Express
var bodyParser = require('body-parser'); //Convierte los JSON
var cors = require('cors');
const { realizarQuery } = require('./modulos/mysql');

var app = express(); //Inicializo express
var port = process.env.PORT || 4000; //Ejecuto el servidor en el puerto 4000

// Convierte una petición recibida (POST-GET...) a objeto JSON
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cors());

//Pongo el servidor a escuchar
app.listen(port, function(){
    console.log(`Server running in http://localhost:${port}`);
});

app.get('/', function(req, res){
    res.status(200).send({
        message: 'Entraste pa!'
    });
});

/**
 * req = request. en este objeto voy a tener todo lo que reciba del cliente
 * res = response. Voy a responderle al cliente
 */



app.get('/clubes', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Clubes WHERE id=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Clubes");
    }    
    res.send(respuesta);
})
app.get('/estadios', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Estadios WHERE id=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Estadios");
    }    
    res.send(respuesta);
})
app.get('/jugadores', async function(req,res){
    let respuesta;
    if (req.query.id != undefined) {
        respuesta = await realizarQuery(`SELECT * FROM Jugadores WHERE id=${req.query.id}`)
    } else {
        respuesta = await realizarQuery("SELECT * FROM Jugadores");
    }    
    res.send(respuesta);
})


//cuando se inserta un club validar q no exista:
app.post('/clubes', async function(req,res) {
    console.log(req.body)
    let clubExistente = await realizarQuery(`SELECT Nombre_equipo FROM Clubes WHERE nombre_equipo="${req.body.nombre_equipo}"`);
    console.log(clubExistente)
    if (clubExistente.length > 0) {
        res.send("El club ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Clubes (nombre_equipo,nombre_dt,posicion_tabla) VALUES
        ("${req.body.nombre_equipo}","${req.body.nombre_dt}",${req.body.posicion_tabla});
        `)
        res.send({message: "Club agregado"})
    }
})  

app.post('/Estadios', async function(req,res) {
    console.log(req.body)
    let estadioExistente = await realizarQuery(`SELECT nombre_estadio FROM Estadios WHERE nombre_estadio="${req.body.nombre_estadio}"`);
    console.log(estadioExistente)
    if (estadioExistente.length > 0) {
        res.send("El estadio ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Estadios (nombre_estadio,ciudad,fecha_construccion,capacidad_espectadores,id_club) VALUES
        ("${req.body.nombre_estadio}","${req.body.ciudad}","${req.body.fecha_construccion}",${req.body.capacidad_espectadores},${req.body.id_club});
        `)
        res.send("Estadio agregado")
    }
})  

app.post('/Jugadores', async function(req,res) {
    console.log(req.body)
    let jugadorExistente = await realizarQuery(`SELECT apellido_jugador FROM Jugadores WHERE apellido_jugador="${req.body.apellido_jugador}"`);
    console.log(jugadorExistente)
    if (jugadorExistente.length > 0) {
        res.send("El jugador ya existe");
    } else {
        await realizarQuery(`
        INSERT INTO Jugadores (nombre_jugador,apellido_jugador,num_camiseta,posicion,id_club) VALUES
        ("${req.body.nombre_jugador}","${req.body.apellido_jugador}",${req.body.num_camiseta},"${req.body.posicion}",${req.body.id_club});
        `)
        res.send("Jugador agregado")
    }
})  


app.put('/clubes', async function(req,res) {
    console.log(req.body) 
    await realizarQuery(`
    UPDATE Clubes SET
        posicion_tabla=${req.body.posicion_tabla}
    WHERE id=${req.body.id};
    `)
    res.send("Club actualizado")
})  

app.put('/estadios', async function(req,res) {
    console.log(req.body) 
    await realizarQuery(`
    UPDATE Estadios SET
        capacidad_espectadores=${req.body.capacidad_espectadores},
    WHERE id=${req.body.id};
    `)
    res.send("Estadio actualizado")
})  

app.put('/Jugadores', async function(req,res) {
    console.log(req.body) 
    await realizarQuery(`
    UPDATE Jugadores SET
        num_camiseta=${req.body.num_camiseta},
    WHERE id=${req.body.id};
    `)
    res.send("Jugador actualizado")
})  



app.delete('/clubes', async function(req,res) {
    console.log(req.body) 
    await realizarQuery(`
    DELETE FROM Clubes WHERE id=${req.body.id};
    `)
    res.send("Club eliminado")
})  

app.delete('/estadios', async function(req,res) {
    console.log(req.body) 
    await realizarQuery(`
    DELETE FROM Estadios WHERE id=${req.body.id};
    `)
    res.send("Estadio eliminado")
})  

app.delete('/jugadores', async function(req,res) {
    console.log(req.body) 
    await realizarQuery(`
    DELETE FROM Jugadores WHERE id=${req.body.id};
    `)
    res.send("Jugador eliminado")
})      