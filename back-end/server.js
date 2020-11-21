const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const cors = require('cors');
const mysql = require('mysql');

// db configuration from external json file
const config = require('./config.json');


// Create connection from config.json
const { host, dbport, user, password, database } = config.database;
var db = mysql.createConnection({ host, dbport, user, password, database});


// calling the initialize function 
// database and table is created automatically
initialize();


// defining function initialize
// initializing the database setup
function initialize(){

  // when no database created
  // Create connection from config.json
  const { host, dbport, user, password, database } = config.database;
  var db = mysql.createConnection({ host, dbport, user, password});

  // Connect
  db.connect((err) => {
    if(err){
        throw err;
    }
    console.log('MySql Connected...');
    db.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`, function (err, result) {
      if (err) throw err;
      console.log("Database created");
    });
  
  });
  
  // include database in the connection
  setTimeout(() => {
    var db = mysql.createConnection({ host, user, password, database});
  
    // creating the table of users if not exists
    let sql = 'CREATE TABLE IF NOT EXISTS users(id int AUTO_INCREMENT, email VARCHAR(255), password VARCHAR(255), name VARCHAR(255), gender VARCHAR(255), mobile VARCHAR(255), PRIMARY KEY(id))';
    db.query(sql, function (err, result){
      if (err) throw err;
      console.log("table created");
    });
  
  }, 500);  // end of timeout

  } // end of function initialize
  // end of function initialize




// allow json to the server
app.use(express.json())

// allowing cross origin
app.use(cors());




// backend API for User Registration
// registering a user and saving to database
app.post('/users', async (req, res) => {
  try {

    // check for unique email in database
    const users= [];
    let sql2 = 'SELECT * FROM users';
    let query2 = db.query(sql2, async (err, result, fields) => {
      if(err) throw err;
      result.forEach((item)=>{
        users.push(item.email)
        // console.log(item.email);
      })
      var n = users.includes(req.body.email);
      if(n === true){
        res.status(500).send('Sorry. This email is already taken!')
        console.log('User Already Existed');
      }else{
        // console.log('false');
            // converted into secured hased password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // taking all input data
    let post = {
      email: req.body.email, 
      password: hashedPassword,
      name: req.body.firstname + ' ' + req.body.lastname,
      mobile: req.body.mobile,
      gender: req.body.gender,
    };

    // saving in database
    let sql = 'INSERT INTO users SET ?';
    let query = db.query(sql, post, (err, result) => {
        if(err) throw err;
        console.log('User Inserted Successfully');
        res.status(200).send('Signed Up Successfully');
    });
    // console.log(post);
      }
      // console.log(users);
      // console.log(req.body.email);

    });  // query for all emails ends

  } catch {
    res.status(500).send('Something Went wrong')
  }
})





// backend API for User Login
// checking login credentials and send success/error message
app.post('/users/login', async (req, res) => {
  // console.log(req.body);

try {
    // check for valid login
    const users= [];
    let sql2 = 'SELECT * FROM users';
    let query2 = db.query(sql2, async (err, result, fields) => {
      if(err) throw err;
      result.forEach((item)=>{
        users.push(item.email);
        //if email exists in db
        // then checking the hashed password
        if(item.email === req.body.email){
          console.log(item.password);
          bcrypt.compare(req.body.password, item.password).then((result)=>{
            if(result){
              console.log("authentication successful")
              res.status(200).send('authentication successful')
              // do stuff
            } else {
              console.log("authentication failed. Password doesn't match")
              res.status(500).send('authentication failed. Password does not match')
              // do other stuff
            }
          })
          .catch((err)=>console.error(err))
        }
      })
      var n = users.includes(req.body.email);
      if(n === true){
        console.log('email is correct');
        // res.status(200).send('email is correct')
      }else{
        console.log('email is incorrect');
        res.status(500).send('Email is incorrect')
      }
      // console.log(users);
      // console.log(req.body.email);

    });  // query for all emails ends
  } catch {
    res.status(500).send('Error')
  }
})
// backend API for User Login ends here




// app.listen(3000);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 3000;
app.listen(port, () => console.log('Server is listening on port ' + port));


