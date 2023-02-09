const express = require('express')
const userRouter = require('./routes/userRouter')
const productRouter = require('./routes/productRouter')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/', userRouter)
app.use('/v1/product', productRouter)
app.use('*', function (req, res) {
    res.status(400).send('Invalid route')
})

module.exports = app