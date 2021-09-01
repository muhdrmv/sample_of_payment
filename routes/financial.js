var express = require('express');
var router = express.Router();
const connection = require('../db/connection');
var axios = require("axios");


router.get('/packages',  function(req, res, next){

    var userID = 1 // req.cookie.userID  
    var d = new Date();
    var date_now = d.getTime()

    var result = connection.query(`
        SELECT * FROM purchase WHERE
        user_id = ${userID} AND
        payment_status = 'Done' ORDER by user_id DESC 
    `);


    if( result.length > 0){

        
        var purchase_expire = result[0].purchase_expire;
        purchase_expire = parseInt(purchase_expire);

        if( purchase_expire > date_now ){

            res.send("<h2>You have Package</h2>"); // or redirect to another page
        }else{
            
            res.send(`<h2>id = ${userID} has not Package and redirect to buy package</h2>`);
            // for postman: res.render('user_packages')
        }
    }else{
        res.send(`<h2>You id = ${userID} has not Package and redirect to buy package</h2>`);
        // for postman:  res.render('user_packages')
    }
});





async function submitToPurchase(purchase_data_obj){

    var msg = "";
    var result 

    // send user data to users part
    var submitData = await axios({
        method: 'post',
        url: 'http://localhost:3030/financial/add_user_purchase',
        data:{
            user_id: purchase_data_obj.user_id,
            user_month: purchase_data_obj.user_month,
            user_package_id: purchase_data_obj.user_package_id,
            user_price_paid: purchase_data_obj.user_price_paid,
            user_payment_id: purchase_data_obj.user_payment_id,
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



router.post('/users_payment', async function(req, res, next) {


    var payment_status = ""; // Done or Failed\
    var payment_id = ""


    // send to bank
    var bankData = await axios({
        method: 'post',
        url: 'http://localhost:3030/bank/failed_purchase'
    })
    
    payment_status = bankData.data.payment_status;
    payment_id = bankData.data.paymentID;
  
    // send to bank
 

    // START => prepare data to add in purchase table
    var userID = 2 // req.cookie.userID
    
    var purchase_data_obj = {

        user_id: userID,
        user_month: req.body.month,
        user_package_id: req.body.package_id,
        user_price_paid: req.body.month*req.body.package_price,
        user_payment_id: payment_id,
        user_payment_status: payment_status
    }
    // END => prepare data to add in purchase table


    if(payment_status == "Done"){ // payment_status => from bank
        

        var res_submit_purchase = await submitToPurchase(purchase_data_obj);

        if(res_submit_purchase.result){
            
            res.send(res_submit_purchase.msg)
        }else{
            res.send(res_submit_purchase.msg)
        }

        
    }else if(payment_status == "failed"){ // payment_status => from bank


        var res_submit_purchase = await submitToPurchase(purchase_data_obj);

        if(res_submit_purchase.result){
            
            res.send(res_submit_purchase.msg)
        }else{
            res.send(res_submit_purchase.msg)
        }

    }

});



router.post('/add_user_purchase',async function(req, res, next) {

    var d = new Date();
    var present_time = d.getTime();  
    var expire_time = present_time + (req.body.user_month*30*24*3600*1000);

    let result = connection.query(`
        INSERT INTO purchase (user_id, price, package_id, time, month, expire, payment_id, payment_status) 
        VALUES ( ${req.body.user_id}, ${req.body.user_price_paid}, ${req.body.user_package_id}, ${present_time}, ${req.body.user_month}, ${expire_time},'${req.body.user_payment_id}', '${req.body.payment_status}')
    `);

    if(result.affectedRows > 0){

        res.send({ result: true, msg: "You have purchased the desired package" });
    }else{
        res.send({ result: false, msg: "not inserted in purchased the desired package"  });
    }

});



// Submit the request from organization into purchase
router.post('/add_organ_users_purchase', function(req, res, next) {

    //START => Submit the request from organization into purchase
    var d = new Date();
    var present_time = d.getTime();    
    var expire_time = present_time + (req.body.org_month*30*24*3600*1000);
    
    let add_user_to_purchase = connection.query(`
        INSERT INTO purchase (user_id, price, package_id, time, month, expire, payment_id, payment_status) 
        VALUES ( ${req.body.user_id}, ${req.body.user_price_paid}, ${req.body.org_package_id}, '${present_time}', ${req.body.org_month}, '${expire_time}','${req.body.organID}', '${req.body.payment_status}')
    `)

    if( add_user_to_purchase.affectedRows < 1 ){

        res.send({ result: false , msg: "Error : can't inserted in purchase table"});
    }else{

        res.send({ result: true, msg: " User added in purchase table."});
    }
    //END => Submit the request from organization into purchase


});



module.exports = router;