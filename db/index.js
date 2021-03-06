var promise = require('bluebird');
var bcrypt = require('bcrypt');


var options = {
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
// var connectionString = 'postgres://ghfqsvnpksqnwj:a0f1906cddc9977e2a58601085c20ea62cd952fe91c1c1da2cf833b42d4479a2@ec2-54-235-72-121.compute-1.amazonaws.com:5432/de590nt70ma92f' || 'postgres://localhost:5432/buzz';
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/buzz';

var db = pgp(connectionString);

getAllBars = function(req, res, next) {
  db.query('select * from bars')
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data
        });
    });
};

getNeighborhoodBars = function(req, res, neighborhood) {
  db.query(`SELECT bars.name, bars.location, bars.category FROM bars INNER JOIN neighborhoods ON (neighborhoods.name = '${neighborhood}') and (neighborhoods.id = bars.neighborhood)`)
    .then(function(data) {
      res.status(200).send(data);
    });
};

// getNeighborhoodBars = function(req, res, neighborhood) {
//   db.query(`SELECT bars.name, bars.location, bars.category FROM bars INNER JOIN neighborhoods ON (neighborhoods.name = '${neighborhood}') and (neighborhoods.id = bars.neighborhood)`)
//     .then(function(data) {
//       res.status(200).send(data);
//     });
// };

getAttributes = function(req, res, id) {
  db.query(`SELECT attributes.attribute, bars.category, bars.id, bars.location, bars.hhstart, bars.hhend, bars.name FROM attributes INNER JOIN bars_attributes ON attributes.id = bars_attributes.attribute_id INNER JOIN bars ON bars.id = bars_attributes.bar_id AND bars.neighborhood = ${id}`)
    .then(function(data) {
      res.status(200).send(data);
    });
};




// getNeighborhoodBars = function(req, res, neighborhood, category, id) {
//   db.query(`SELECT bars.name, bars.location, bars.category FROM bars INNER JOIN neighborhoods ON (neighborhoods.name = '${neighborhood}') and (neighborhoods.id = bars.neighborhood) INNER JOIN categories ON (categories.id = bars.category) and (categories.id = 3)
// `)
//     .then(function(data) {
//       res.status(200).send(data);
//     });
// };


getAllCategories = function(req, res, next) {
  db.query('select * from categories')
    .then(function(data) {
      res.status(200).send(data);
    });
};

postUsers = function(req, res, next) {
  // console.log('this is req.body: ', req.body)

  db.any('SELECT * FROM users WHERE username = $1', [req.body.username])
    .then(function(data) {
      console.log('this is the data inside db.any: ', data);
      if(data.length === 0){
        bcrypt.hash(req.body.password, 10, function(err, hash) {
          // db.none('INSERT INTO users (username, password) SELECT ${username}, ${password} WHERE NOT EXISTS (SELECT 1 FROM users WHERE username=${username})', req.body)
          db.none('INSERT INTO users(username, password) VALUES ($1, $2)', [req.body.username, hash])
            .then(function () {
              console.log('i have inserted a user');
              res.status(200)
                .json({
                  status: 'success',
                  message: 'inserted user'
                });
            })
            .catch(function (err) {
              return next(err);
            });
        });
      } else {
        res.status(400)
        res.send('This username has been taken')
      }
    })
    .catch(function(error) {
      return next(err);
    });

};

checkUser = function(req, res, next) {
  // db.query('SELECT * FROM users WHERE username=${username} AND password=${password}', req.body)
  db.query('SELECT * FROM users WHERE username=${username}', req.body)
  .then(function (data) {
    console.log('this is req.body.password: ', req.body.password);
    console.log('this is data password: ', data[0].password)
    bcrypt.compare(req.body.password, data[0].password).then(function(result){
      console.log('this is result: ', result);
      if(result) {
        console.log('login successful');
        res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Successfully logged in'
        });
      } else {
        res.status(401)
        res.send(['The password you entered does not match'])
      }
    })
  })

  .catch(function (err) {
    return next(err);
  });
};


addToUserFavs = function(req, res, next) {
  db.query('INSERT INTO users_bars (user_id, bar_id) SELECT ${userID}, ${barID} WHERE NOT EXISTS (SELECT 1 FROM users_bars WHERE bar_id=${barID})', req.body)
    .then(function(data) {
      console.log('favorite bar added');
      res.status(200)
        .json({
          status: 'success',
          message: 'Successfully logged in'
        });
    })
    .catch(function (err) {
      return next(err);
    });
};

getUserFaves = function(req, res, next) {
  db.query('SELECT bars.name FROM bars INNER JOIN users_bars ON bars.id = users_bars.bar_id INNER JOIN users ON users.id = users_bars.user_id AND users.id = ${userID}', req.body)
    .then(function(data) {
      console.log('got users favorite bars');
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Got favorite bars'
        });
    })
    .catch(function (err) {
      return next(err);
    });
};





// module.exports = connection;
module.exports.getAllBars = getAllBars;
module.exports.getNeighborhoodBars = getNeighborhoodBars;
module.exports.getAllCategories = getAllCategories;
module.exports.getAttributes = getAttributes;
module.exports.postUsers = postUsers;
module.exports.checkUser = checkUser;
module.exports.addToUserFavs = addToUserFavs;
module.exports.getUserFaves = getUserFaves;
