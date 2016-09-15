var express = require('express');
var app = express();
var path = require('path');
var db = require('./models');
var multiparty = require('multiparty');
var fs = require('fs');
var Refferals = db.Refferals;
var Pics = db.Pics;
var bodyParser = require('body-parser');

var twilioApp = require('./routes/twilio');

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use('/twilio', twilioApp);
app.put(/\/homeless\/\d+/, function(req, res) {
});

app.get('/homeless', function(req, res) {
  console.log(Pics);
  Refferals.findAll({include: [{
      model: Pics,
      as: 'pic',
    }, {
      model: db.refferalStatus,
      as: 'refferalStatus',
    }]}).then(function(data) {
      res.json(data);
  });
});

app.get('/dashboard', function(req, res, next) {
  Refferals.findAll({include: [{
      model: Pics,
      as: 'pic',
    }, {
      model: db.refferalStatus,
      as: 'refferalStatus',
    }]}).then(function(refferal) {
      console.log(refferal[1].dataValues);
      refferal.push({});
      res.render('dashboard', {json: refferal.reverse()});
  });
});

app.post('/message', function(req, res) {
  Pics.create({fileName: req.body.MediaUrl0})
  .then(function(pic) {
      // Inserts Location data to  Locations table
      Refferals.create({refferalStatus_id:1,
                        pic_id: pic.id,
                        phoneNumber: req.body.From,
                        city: req.body.FromCity,
                        state: req.body.FromState,
                        zip: req.body.FromZip,
                        description: req.body.Body})
    .then(function(refferal) {
      // Sends response that tells the pic got uploaded
      return res.json(refferal);
    });
  });
});
app.post('/homeless', function(req, res, next) {
  // Create Form parse
  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {
    if(err)
      throw err;
    if(files.pic[0].size){
      fs.readFile(files.pic[0].path, function (err, data) {
      if(err)
        next(err);
      // Creates unique file name for picture
      var insertName = __dirname +
      '/uploads/' +
      Date.now() +
      files.pic[0].originalFilename;
      // Write file to disk
      fs.writeFile(insertName , data, function (err) {
      if(err)
        next(err);
      // Inserts Pic Name to  Picture table
      return Pics.create({fileName: insertName})
      .then(function(pic) {
      // Inserts Location data to  Locations table
        return Refferals.create({refferalStatus:1,
          pic: pic.id,
          name: fields.name[0],
          firstName: fields.firstName[0],
          lastName: fields.lastName[0],
          email: fields.email[0],
          phoneNumber: fields.phoneNumber[0],
          area: fields.area[0],
          city: fields.city[0],
          state: fields.state[0],
          zip: fields.zip[0],
          address: fields.address[0],
          GPS: "(0,0)",
          description: fields.description[0]})
          .then(function(refferal) {
          // Sends response that tells the pic got uploaded
            return res.json(refferal);
          });
          });
        });
      });
    }
    else{
       Refferals.create({refferalStatus_id:1,
          name: fields.name[0],
          firstName: fields.firstName[0],
          lastName: fields.lastName[0],
          email: fields.email[0],
          phoneNumber: fields.phoneNumber[0],
          area: fields.area[0],
          city: fields.city[0],
          state: fields.state[0],
          zip: fields.zip[0],
          address: fields.address[0],
          GPS: "(0,0)",
          description: fields.description[0]})
          .then(function(refferal) {
          // Sends response that tells the pic got uploaded
            return res.json(refferal);
          });
    }
  });
});

app.put(/\/homeless\/\d+/, function(req, res) {
 var split = req.url.split('/');
 var numId = split[2];
 Refferals.update(req.body,{where:{id:numId}})
   .then((data)=> {
     res.json(data);
   });
});

app.get(/\/homeless\/\d+\/photo/, function(req, res) {
 var split = req.url.split('/');
 var numId = split[2];
 Refferals.findOne({
   where: {
     id: numId
   },
   include: [{
     model: Pics,
     as: 'pic',
   }, {
     model: db.refferalStatus,
     as: 'refferalStatus',
   }]}).then(function(data) {
     res.sendFile(data.dataValues.pic.fileName);
 });
});

var server = app.listen(3000, function(){
  var host = server.address().address;
  var port = server.address().port;
  db.sequelize.sync();
  console.log('listening on',host, port);
});