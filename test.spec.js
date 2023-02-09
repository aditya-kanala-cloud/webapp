const request = require('supertest')
const app = require('./app')
const chai = require('chai')
const expect = chai.expect

describe('Authentication Tests', function() {
    describe('Successes', function() {
        it('Return the user if the username is valid', function(done) {
            request(app).post('/v1/user').send({ username:'test@gmail.com'}).end(function(err, res) {
                expect(res.statusCode).to.be.equal(400)
                done()
            })
        })
    })
})

describe('Authentication Test for Post', function() {
    describe('Successes', function() {
        it('Return the product for post if auth does not exist', function(done) {
            request(server).post('/v1/product/').send({}).end(function(err, res) {
                expect(res.statusCode).to.be.equal(401);                
                done();
            });
        });
    });
})