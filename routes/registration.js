var express = require('express');
var router = express.Router();
var connection = require('../db/connection');
var bcrypt = require("bcrypt");
var organ_can_not_add_user = require('../middlewares/organ-can-not-add-user'); //  check => if user_used >= user_number




function increaseOneUsed(organID, package_id){

    //START => Increase one used field in organization_purchase table In related row
    var organ_purchase_data = connection.query(`
        SELECT * FROM organization_purchase WHERE org_id = ${organID} AND package_id = ${package_id} AND payment_status = 'Done' AND users_number > used
    `)[0]

    var used = organ_purchase_data.org_purchase_used + 1 ;

    var add_to_used = connection.query(`
        UPDATE organization_purchase SET used = ${used} WHERE org_id = ${organID} AND org_purchase_id = ${org_purchase_id}
    `)

    if( add_to_used.affectedRows < 1 ){
        return({ result: false , msg: "Error in : Increase one used field"});
    }else{
        return({ result: true, msg: "Increased one in used field" });
    }
    //END => Increase one used field in organization_purchase table In related row
}




async function submitToPurchase(purchase_data_obj){

    var msg = "";
    var result 

    // send user data to users part
    var submitData = axios({
        method: 'post',
        url: 'http://localhost:3030/financial/add_organ_users_purchase',
        data:{
            user_id: purchase_data_obj.user_id,
            organID: purchase_data_obj.organID,
            org_month: purchase_data_obj.org_month,
            org_package_id: purchase_data_obj.org_package_id,
            user_price_paid: purchase_data_obj.user_price_paid,
            payment_status: purchase_data_obj.payment_status
        }
    })
    

    if(submitData.data.result){

        result = submitData.data.result
        msg = submitData.data.msg;
    }else{
        result = submitData.data.result
        msg = submitData.data.msg;
    }
    
    // send user data to users part

    return {result: result, msg: msg}
}



router.post('/available_packages' ,function(req, res, next) {

    var organID = 1
    var packages = connection.query(`
        SELECT * FROM organization_purchase where users_number > used AND payment_status = 'Done' AND org_id = ${organID}
    `);

    res.send(packages);
});





router.post('/suspended_users' ,function(req, res, next) {

    // This route is for those Users who are suspended and have not been assigned a package
    var organID = 1;
    let suspended_users = connection.query(`
        SELECT *
        FROM users
        WHERE organ_id = ${organID} AND user_id  NOT IN (
            SELECT user_id 
            FROM purchase WHERE
            price = ${organID}
        )
    `)
    // ATTENTION : When an organization decides to put a user on the purchase table because that user has not paid, we put that organization ID instead of the price field.
    
    res.send(suspended_users)
});




router.post('/purcahsed_users' , function(req, res, next) {

    // This route is for those Users who are not suspended and have been assigned a package and we want to show the expire time
    
    var organID = 1 ;
    let purcahsed_users = connection.query(`
        SELECT *
        FROM users
        WHERE organ_id = ${organID} AND user_id IN (
            SELECT user_id 
            FROM purchase WHERE
            price = ${organID}
        )
    `)
    // ATTENTION : When an organization decides to put a user on the purchase table because that user has not paid, we put that organization ID instead of the price field.

    res.send(purcahsed_users)
}); 




router.post('/submit_suspended_user', organ_can_not_add_user , async function(req, res, next) {

    // This route is for those Users who are suspended and have not been assigned a package And we want to register a package for them

    var organID = 1;

    // START => prepare data to add in purchase table
    var organ_purchase_data = connection.query(`
        SELECT * FROM organization_purchase WHERE org_id = ${organID} AND package_id = ${req.body.package_id} AND payment_status = 'Done' AND users_number > used
    `)[0];

    
    var purchase_data_obj = {

        user_id: req.body.user_id,
        organID: organID,
        org_month: organ_purchase_data.months,
        org_package_id: organ_purchase_data.package_id,
        user_price_paid: organID,
        payment_status: "Done"
    }
    // END => prepare data to add in purchase table


    var res_submit_purchase = await submitToPurchase(purchase_data_obj);


    if(res_submit_purchase.result){
        
        //START => Increase one used field in organization_purchase table In related row
        var increase_one_used = await increaseOneUsed(organID, req.body.package_id);
        //END => Increase one used field in organization_purchase table In related row

        if( increase_one_used.result ){

            res.send(increase_one_used.msg)
        }else{

            res.send(increase_one_used.msg)
        }
        
    }else{

        res.send(res_submit_purchase.msg)
    }
            
});





router.post('/add_organ_user',async function(req, res, next) {

    var organID = 1

    // START => If the email is duplicate, it should not be added to users again
    
    var checkEmail = connection.query(`
        SELECT * FROM users WHERE user_email = '${req.body.email}' 
    `);
    
    
    if( checkEmail.length < 1 ){ // if we don't have this email

        // START => Add user in database. AlSO we can send as http request to auth in user Part
        let enc_password = await bcrypt.hash(req.body.password, 10);
        let d = new Date();

        var add_user = connection.query(`
            INSERT INTO users (user_email, user_google_id, organ_id ,user_fullname, user_gender, user_birthday, user_password, user_date_registration) 
            VALUES ('${req.body.email}', 'none', ${organID} ,'${req.body.fullname}', '${req.body.gender}', '${req.body.birthday}', '${enc_password}', '${d.getTime()}')
        `);

        if ( add_user.affectedRows < 1 ) { 
            res.send({ result: false , msg: "Error in : couldn't add user"});
        }
        // START => Add user in database. AlSO we can send as http request to auth in user Part
        
    }

});


module.exports = router;
