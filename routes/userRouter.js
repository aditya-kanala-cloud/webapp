const userController = require('../controllers/userController')

const router = require('express').Router()
router.get('/healthz', userController.getStatus)
router.post('/v1/user', userController.addUser)
router.get('/v1/user/:id', userController.getUser)
router.put('/v1/user/:id', userController.updateUser)

module.exports = router