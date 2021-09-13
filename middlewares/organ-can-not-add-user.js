let connection = require('../db/connection')

module.exports = (req, res, next)=>{

    var organID = 1

    var results = connection.query(`
        SELECT * FROM organization_purchase where users_number > used AND payment_status = 'Done' AND org_id = ${organID}
    `)

    if( results.length > 0 ){
        
        next();
    }else{

        res.send( {result: false, msg:"Your organization has defined all its users"})
    }
}