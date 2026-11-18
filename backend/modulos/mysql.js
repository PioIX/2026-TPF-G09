const mySql = require("mysql2/promise");

const SQL_CONFIGURATION_DATA = {
  host: process.env.MYSQL_HOST || "10.1.5.205",
  user: process.env.MYSQL_USERNAME || "2026_5INF_G09",
  password: process.env.MYSQL_PASSWORD || "brbr",
  database: process.env.MYSQL_DB || "2026_5INF_G09",
  port: 3306,
  charset: "UTF8_GENERAL_CI",
};

exports.realizarQuery = async function (queryString, params = []) {
  let returnObject;
  let connection;
  try {
    connection = await mySql.createConnection(SQL_CONFIGURATION_DATA);
    returnObject = await connection.execute(queryString, params);
  } catch (err) {
    console.error("Error SQL:", err.message);
    throw err;
  } finally {
    if (connection && connection.end) await connection.end();
  }
  return returnObject[0];
};