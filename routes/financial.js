var express = require('express');
var router = express.Router();
const connection = require('../db/connection');
var axios = require("axios");


async function submitToPurchase(purchase_data_obj){

    var msg = "";
    var result 

    // send user data to users part
    var submit_data = await axios({
        method: 'post',
        url: 'http://localhost:2021/financial/submit_organ_purchase',
        data:{
            organID: purchase_data_obj.organID,
            org_month: purchase_data_obj.org_month,
            org_package_id: purchase_data_obj.org_package_id,
            users_number: purchase_data_obj.users_number,
            org_price_paid: purchase_data_obj.org_price_paid,
            org_payment_id: purchase_data_obj.org_payment_id,
            org_payment_status: purchase_data_obj.org_payment_status
        }
    })
    
    if(submit_data.data.result){

        result = submit_data.data.result
        msg = submit_data.data.msg;
    }else{
        result = submit_data.data.result
        msg = submit_data.data.msg;
    }
    
    // send user data to users part

    return {result: result, msg: msg}
}




router.post('/submit_organ_purchase', function(req, res, next) {
    
    let result = connection.query(`
        INSERT INTO organization_purchase (org_id, price, package_id, users_number, months, used, payment_status, payment_id) 
        VALUES ( ${req.body.organID}, ${req.body.org_price_paid}, ${req.body.org_package_id}, ${req.body.users_number}, ${req.body.org_month}, 0 ,'${req.body.org_payment_status}', '${req.body.org_payment_id}')
    `)

    if(result.affectedRows > 0){

        res.send({ result: true, msg: `your organization purchase is ${req.body.org_payment_status}` });
    }else{
        res.send({ result: false, msg: "Error in inserting" });
    }

});



router.post('/organs_payment', async function(req, res, next) {

    
    var payment_status = ""; 
    var payment_id = ""
    var price = (req.body.month*req.body.package_price*req.body.users_number)


    // send to bank
    var bankData = await axios({
        method: 'post',
        url: 'http://localhost:2021/bank/submit_purchase',
        data:{
            price: price
        }
    })

    payment_status = bankData.data.payment_status;
    payment_id = bankData.data.paymentID;

    // send to bank


    // START => prepare data to add in purchase table
    var organID = 1 // req.cookie.organID
            
    var purchase_data_obj = {

        organID: organID,
        org_month: req.body.month,
        org_package_id: req.body.package_id,
        users_number: req.body.users_number,
        org_price_paid: price,
        org_payment_id: payment_id,
        org_payment_status: payment_status
    }
    // END => prepare data to add in purchase table


    if(payment_status == "Done"){

        var res_submit_purchase = await submitToPurchase(purchase_data_obj);

        if(res_submit_purchase.result){
            
            res.send(res_submit_purchase.msg)
        }else{
            res.send(res_submit_purchase.msg)
        }
        
        
    }else if(payment_status == "failed"){
        
        var res_submit_purchase = await submitToPurchase(purchase_data_obj);

        if(res_submit_purchase.result){
            
            res.send(res_submit_purchase.msg)
        }else{
            res.send(res_submit_purchase.msg)
        }

    }

});



router.post('/organ_previous_payments', function(req, res, next) {

    var result = connection.query(`
        SELECT * FROM organization_purchase WHERE org_id = ${organID} AND payment_status = 'Done'
    `)

    if( result.length > 0 ){

        res.send({ result: true, msg: "All previous payments organ", data: result})
    }else{
        res.send({ result: false, msg: "No previous payments"})
    }
});


module.exports = router;