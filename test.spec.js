const request = require('supertest')
const app = require('./app')
const chai = require('chai')
const expect = chai.expect

describe('Authentication Tests', function() {
    describe('Successes', function() {
        it('Return the user if the username is valid', function(done) {
            request(app).post('/v1/user').send({ username:'test@gmail.com'}).end(function(err, res) {
                expect(res.statusCode).to.be.equal(200)
                done()
            })
        })
    })
})
