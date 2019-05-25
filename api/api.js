
var pool = require('./db.js');
var mysql = require('mysql2');


module.exports = {

  loadItems: function (req, res) {
    var inserts = req.params.name;
    pool.getConnection((err, connection) => {
      if (err) throw err;
      connection.query(`select * from ${inserts}`, function (error, results, fields) {
        if (error) {
          return res.send(error);
        }	else {
          var json = results;
          res.send(json);
        }
      });
      pool.releaseConnection(connection);
    });
  },

  createItem: function(req, res) {
    pool.getConnection((err, connection) => { 
    var name = req.params.name; 
		var data = req.body;
    var keys = Object.keys(data).join(', ');
    var inserts = [];
    for(let prop in data) {
      if (Number(data[prop])) {
        inserts.push(data[prop]);
      } else {
        inserts.push(`"${data[prop]}"`);	
      }
    }
    var values = inserts.join(', ');
    connection.execute(`INSERT INTO diploma21.${name} (${keys}) VALUES (${values})`, function(err, results, fields) {
      if (err) {
        return res.send(err);
      } else {
        console.log(results);  
        connection.query(`select * from diploma21.${name}`, function (error, results, fields) {
          if (error) {
            return res.send(error);
          }	else {
            var json = results;
            res.send(json);
          }
        });
      }
      }); 
    });
  },

  updateItem: function (req, res) {  
		pool.getConnection((err, connection) => {
      var data = req.body;
      var name = req.params.name;
      var inserts = [];
      for(let prop in data) {
        inserts.push(`${prop}="${data[prop]}"`);	
      }
      var id = inserts.splice(0, 1);
      var string = inserts.join(', ');
      connection.execute(`UPDATE diploma21.${name} SET ${string} WHERE ${id}`, function(err) {
        if (err) return res.send(err);
        connection.query(`select * from diploma21.${name}`, function (error, results, fields) {
          if (error) {
            return res.send(error);
          }	else {
            var json = results;
            res.send(json);
          }
        });
        }); 
      });
		
    },

    removeItem: function (req, res) {
      pool.getConnection((err, connection) => {
        var name = req.params.name;
        var inserts = req.params.id;
          connection.query(`select * from diploma21.${name}`, function (error, results, fields) {
            if (error) {
              return res.send(error);
            }	else {
              var key = Object.keys(results[0]);
              connection.execute(`DELETE FROM diploma21.${name} WHERE ${key[0]}=?`, [inserts], function(err, results) {
                if (err) return res.send(err);
                connection.query(`select * from diploma21.${name}`, function (error, results) {
                  if (error) return res.send(error);
                  var json = results;
                  res.send(json);
                });
              });
            }
          });
      });
    }

};
  