var express = require('express');
var router = express.Router();

router.post('/submit_purchase', function(req, res, next) {
    data = {
      paymentID: "sd4r23432432",
      payment_status: "Done"
    }
    res.send(data)
});


router.post('/failed_purchase', function(req, res, next) {
    data = {
        paymentID: "sd4r23432432",
        payment_status: "failed"
    }
    res.send(data)
});
  

module.exports = router;
