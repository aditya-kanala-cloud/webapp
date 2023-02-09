const db = require('../models')
const bcrypt = require('bcrypt')
const { sequelize }  = require('../models/index')
const moment = require('moment')
const User = db.users

// POST route to add a new user to database
const addUser = async (req, res) => {
    // checks if request body exists, if not returns a bad request
    if(Object.keys(req.body).length === 0){
        return res.status(400).send('Request Body is empty') // request body is empty
    }

    // if any of the required fields are empty, return a bad request
    if(!req.body.first_name || !req.body.last_name || !req.body.username || !req.body.password){
        return res.status(400).send('Required fields are empty') // required fields are missing
    }

    // retrieves attribute values from request body
    var first_name = req.body.first_name
    var last_name = req.body.last_name
    var username = req.body.username
    var password = req.body.password
    var date = moment().tz("America/New_York").format('YYYY-MM-DDTHH:mm:ss.sssZ')

    // regex to check for valid username (email)
    var usernameCheck = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    var checkIfExists = await User.findOne({where: { username: username }})

    // hash the user password with a salt value of 10
    var hash = await bcrypt.hash(password, 10)

    // if username does not exist and all entered values are valid, a new user is created and their details are returned with the corresponding status code
    if(checkIfExists == null && username.match(usernameCheck)){
        // create user info to store into database
        let userInfo = {
            first_name: first_name,
            last_name: last_name,
            username: username,
            password: hash,
            account_created: date,
            account_updated: date
        }

        // creates new user and returns select details
        await User.create(userInfo)

        // finds newly created user to fetch info
        let response = await User.findOne({where: { username: username },
            attributes: { exclude: [ 'password' ]}})     
        return res.status(201).send(response)
    }

    // if above checks fail, a bad request is returned
    return res.status(400).send('Bad request')
}

// GET route to retrieve user details
const getUser = async (req, res) => {
    // checks for authorization header
    if(!req.get('Authorization')){
        return res.status(401).send('Unauthorized')
    }

    // authorization check
    const authenticated = await authenticate(req, res)
    if(authenticated == true){
        // retrieve user details on successful authentication
        let user = await User.findOne({where: { id: req.params.id },
            attributes: { exclude: [ 'password' ]}})
        if(user != null){
            return res.status(200).send(user)
        }
    }
}

// PUT route to update user details
const updateUser = async (req, res) => {
    if(!req.body.first_name || !req.body.last_name || !req.body.password){
        return res.status(400).send('Bad request')
    }
    
    if(!req.get('Authorization')){
        return res.status(401).send('Unauthorized')
    }
    
    // attempt to update any other field should return 400 Bad Request HTTP response code
    if(!req.body.username && !req.body.account_created && !req.body.account_updated && Object.keys(req.body).length === 3)
    {
        // checks if user is authenticated (valid credentials)
        const authenticated = await authenticate(req, res)
        if(authenticated == true){
            // gets password passed
            var password = req.body.password
            // hash the user password with a salt value of 10
            const hash = await bcrypt.hash(password, 10)

            // update user
            const user = await User.update({first_name: req.body.first_name, last_name: req.body.last_name, password: hash, account_updated: moment().tz("America/New_York").format('YYYY-MM-DDTHH:mm:ss.sssZ')}, {where: { id: req.params.id }})
            // if details updated successfully
            if(user == 1){
                return res.status(204).send(user)
            }
            return res.status(400).send('Bad request')
        }
    }
    else{
        return res.status(400).send('Bad request')
    }
}

// function to authenticate a user
async function authenticate (req, res) {
    // decodes authorization header to fetch username and password
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':')
    var username = credentials[0]
    var password = credentials[1]

    // finding the user with specified id
    let actualUser = await User.findOne({where: { id: req.params.id }})
    let givenUser = await User.findOne({where: { username: username }})

    if(givenUser && actualUser){
        // compare user password with stored hash
        const authenticated = await bcrypt.compare(password, givenUser.password)
        console.log(authenticated)
        console.log(username)
        // if user is authenticated (credentials are correct), compares username passed to that of username found via id passed (username is correct)
        if(authenticated && username == actualUser.username) {
            return true
        }
        if(authenticated && username != actualUser.username){
            return res.status(403).send('Forbidden')
        }
    }
    // if user doesn't exist
    return res.status(401).send('Unauthorized')
}

// function to check if server is healthy
const getStatus = (req,res) => {
    sequelize
  .authenticate()
  .then(() => {
    res.send('')
  })
  .catch(err => {
    res.send('', err)
  })
}

module.exports = {
    addUser,
    getUser,
    updateUser,
    getStatus
}