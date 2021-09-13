var mysql = require('sync-mysql');

var connection = new mysql({
    host: "localhost",
    user: "root",
    password: "",
    database: "userview_cognofit"
})

module.exports = connection