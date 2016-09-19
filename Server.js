const twilioId = 'AC964cf194d80886e9dcdc51f7ed95fa4b';
const twilioToken = 'bd77b5bca83b18054860e0235b4b0bb0';
const fromPhone = '(513) 348-1414';
var bootstrapService = require("express-bootstrap-service");
var express = require('express');
var app = express();
var router = express.Router();
var fs = require("fs");
var twilio = require('twilio');
var lookupsClient = require('twilio').LookupsClient;
var viewPath = __dirname + '/views/';
var dataPath = __dirname + '/data/';
var lookupClient = new lookupsClient(twilioId, twilioToken);
var client = new twilio.RestClient(twilioId, twilioToken);

router.get("/", function(req, res) {
    res.sendFile(viewPath + "index.html");
});

router.get('/TelephoneCodes', function(req, res) {
    fs.readFile(dataPath + "countries.json", 'utf8', function(err, data) {
        res.end(data);
    });
});

router.get('/api/sms-promotion', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    var phone = req.query.phone;
    isPhoneAllreadyRegistered(phone)
        .then(function(successPhone) {
            return validatePhoneNumber(successPhone).then(null, function(error) { return Promise.reject(error); });
        }, function(error) { return Promise.reject(error); })
        .then(function(successPhone) {
            return sendSMS(successPhone).then(null, function(error) { return Promise.reject(error); });
        }, function(error) { return Promise.reject(error); })
        .then(function(successPhone) {
            return addPhoneToStorage(successPhone).then(null, function(error) { return Promise.reject(error); });
        }, function(error) { return Promise.reject(error); })
        .then(function(successPhone) {
            return getSuccessMessage(successPhone).then(null, function(error) { return Promise.reject(error); });
        }).then(function(success) { return res.end(success); }, function(error) { return res.end(error); });
});

app.use("/", router);

app.use(bootstrapService.serve);
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/bootstrap-validator', express.static(__dirname + '/node_modules/bootstrap-validator/dist/'));
app.use('/styles', express.static(__dirname + '/styles/'));
app.use('/scripts', express.static(__dirname + '/scripts/'));

var server = app.listen(8081, function() {
    var host = server.address().address
    var port = server.address().port

    console.log("app listening at http://%s:%s", host, port)
});

/* REGION: Functions */

function isPhoneAllreadyRegistered(phone) {
    return new Promise(function(resolve, reject) {
        fs.readFile(dataPath + "phones.json", 'utf8', function(err, data) {
            var dataJson = JSON.parse(data);
            var filteredArray = dataJson.filter(function(item) { return item.phone === phone; });
            filteredArray.length == 0 ? resolve(phone) : reject(JSON.stringify({ status: "Error", message: "Error: Mobile number allready registered " + phone }));
        });
    });
}

function validatePhoneNumber(phone) {
    return new Promise(function(resolve, reject) {
        lookupClient.phoneNumbers(phone).get({
            type: 'carrier'
        }, (error, number) => {
            number ? resolve(phone) : reject(JSON.stringify({ status: "Error", message: "Error: invalid phone number " + phone }));
        });
    });
}

function sendSMS(phone) {
    console.log("sendSMS " + phone);
    return new Promise(function(resolve, reject) {
        client.sms.messages.create({
            to: phone,
            from: fromPhone,
            body: getMesage()
        }, function(error, message) {

            if (!error) {
                console.log('Success! The SID for this SMS message is:');
                console.log(message.sid);
                console.log('Message sent on:');
                console.log(message.dateCreated);
                resolve(phone);
            } else {
                console.log('Oops! There was an error.');
                console.log(error);
                reject(JSON.stringify({ status: "Error", message: "Error: Promo Code not Send to you mobile " + phone }));
            }
        });
    });

}

function getMesage() {
    return ((new Date()).getHours() < 12) ? "Promo Code: AM123" : "Promo Code: PM456";
}

function addPhoneToStorage(phone) {
    return new Promise(function(resolve, reject) {
        var dataFile = fs.readFileSync(dataPath + "phones.json");
        var data = JSON.parse(dataFile);
        data.push({ phone });
        var dataJSON = JSON.stringify(data);
        fs.writeFileSync(dataPath + "phones.json", dataJSON);
        resolve(phone);
    });
}

function getSuccessMessage(phone) {
    return new Promise(function(resolve, reject) {
        resolve(JSON.stringify({ status: "Success", message: "Success: Promo Code Send to you mobile " + phone }));
    });
}