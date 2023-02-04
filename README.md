## CSYE6225- Network Structures and Cloud Computing

## Assignment 1: Project description

Create a web application using a technology stack that meets Cloud-Native Web Application Requirements.

## Frameworks and third party libraries:

Packages required to run:
- Express
- Dotenv
- Nodemon
- Pg, pg-hstore
- Sequelize
- Cors
- Chai
- Mocha
- Spec
- Jest
- Supertest
- Bcrypt

```
npm i --save express dotenv nodemon pg pg-hstore sequelize cors chai mocha spec jest supertest bcrypt
```

## Prerequisites for building and deploying application locally:

```javascript
// install dependencies
npm i --save

// start the server
npm start

// run test cases
npm test
```

## Endpoint URLs

```javascript
// 1. POST route to add a new user to database
GET /healthz

// 2. GET route to retrieve user details
GET /v1/user/{userId}

// 3. POST route to add a new user to database
POST /v1/user

// 4. PUT route to update user details
PUT /v1/user/{userId}
```

### Sample JSON Request for POST


```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "username": "jane.doe@example.com",
  "password": "password"
}
```


### Sample JSON Response for GET
```json
{
  "id": 1,
  "first_name": "Jane",
  "last_name": "Doe",
  "username": "jane.doe@example.com",
  "account_created": "2016-08-29T09:12:33.001Z",
  "account_updated": "2016-08-29T09:12:33.001Z"
}
```

Developer - Aditya Kanala<br>
NUID - 002914764 </br>
