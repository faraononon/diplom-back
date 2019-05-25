var mysql = require('mysql2');

var config = {
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'kisakisa123',
    database: 'diploma21'
}

var pool = mysql.createPool(config);

module.exports = pool;