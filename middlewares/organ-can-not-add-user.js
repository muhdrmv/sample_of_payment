let connection = require('../db/connection')

module.exports = (req, res, next)=>{

    var organID = 1

    var results = connection.query(`
        SELECT * FROM organization_purchase WHERE org_id = ${organID} AND org_purchase_id = ${req.body.org_purchase_id}
    `)

    if( results.length > 0 ){
        
        if(results[0].org_purchase_used < results[0].org_purchase_users_number){

            next();
        }else{
            res.send( {result: false, msg:"Your organization has defined all its users"})
        }
    }else{

        res.send( {result: false, msg:"This org_purchase_id does not belong to your organization"})
    }

}