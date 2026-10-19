//Sección MySQL del código
const mySql = require("mysql2/promise");




	const SQL_CONFIGURATION_DATA = {
    host: '10.1.4.153', // O 'localhost' si la base de datos está en tu computadora
    user: '2026-5INF-G09',
    password: 'brbr', // Escribí la contraseña exacta
    database: '2026-5INF-G09',     // El nombre de tu base de datos
    port: 3306,
    charset: 'UTF8_GENERAL_CI'
};

/**
 * Realiza una query a la base de datos MySQL indicada en el archivo "mysql.js".
 * @param {String} queryString Query que se desea realizar. Textual como se utilizaría en el MySQL Workbench.
 * @returns Respuesta de la base de datos. Suele ser un vector de objetos.
 */
exports.realizarQuery = async function (queryString)
{
	let returnObject;
	let connection;
	try
	{
		connection = await mySql.createConnection(SQL_CONFIGURATION_DATA);
		returnObject = await connection.execute(queryString);
	}
	catch(err)
	{
		console.log(err);
	}
	finally
	{
		if(connection && connection.end) connection.end();
	}
	return returnObject[0];
}