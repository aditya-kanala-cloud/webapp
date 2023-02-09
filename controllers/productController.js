const db = require('../models')
const bcrypt = require('bcrypt')
const moment = require('moment')
const User = db.users
const Product = db.products

const bodyAllowedList = new Set (['name', 'description', 'sku', 'manufacturer', 'quantity'])
var date = moment().tz("America/New_York").format('YYYY-MM-DDTHH:mm:ss.sssZ')

// POST route to add a new product to database
const addProduct = async(req, res) => {
    // if no authorization, return unauthorized
    if(!req.get('Authorization')){
        return res.status(401).send('Unauthorized')
    }

    const authenticated = await authenticateAddProduct(req)
    if(authenticated == true){
        // checks if request body exists, if not returns a bad request
        if(Object.keys(req.body).length === 0){
            return res.status(400).send('Bad request') // request body is empty
        }

        // if any of the required fields are empty or read only fields are entered, return a bad request
        if(!req.body.name || !req.body.description || !req.body.sku || !req.body.manufacturer || !req.body.quantity || req.body.id || req.body.date_added || req.body.date_last_updated || req.body.owner_user_id){
            return res.status(400).send('Bad request') // required fields are missing / read only fields entered
        }

        for (const prop in req.body) {
        if(req.body.hasOwnProperty(prop) && !bodyAllowedList.has(prop)) {
            return res.status(400).json('Bad request');
            }
        }

        // retrieve username of user
        var username = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':')[0]

        // retrieves attribute values from request body
        var name = req.body.name
        var description = req.body.description
        var sku = req.body.sku
        var manufacturer = req.body.manufacturer
        var quantity = req.body.quantity
        var owner_user_id = (await User.findOne({where: { username: username }})).id

        if(typeof quantity === 'string' || quantity < 0 || quantity > 100 || quantity % 1 != 1){
            return res.status(400).send('Bad request') // quantity is entered incorrectly
        }
    
        var checkIfExists = await Product.findOne({where: { sku: sku }})
    
        if(checkIfExists == null){
            let productInfo = {
                name: name,
                description: description,
                sku: sku,
                manufacturer: manufacturer,
                quantity: quantity,
                date_added: date,
                date_last_updated: date,
                owner_user_id: owner_user_id
            }
    
            await Product.create(productInfo)
            let response = await Product.findOne({where: { sku: sku }})    
            return res.status(201).send(response)
        }
    }

    if(authenticated == false){
        return res.status(401).send('Unauthorized') // user not authenticated
    }

    return res.status(400).send('Bad request') // above checks fail
}

// PUT route to add a update product to database
const updateProduct = async(req, res) => {
    // if no authorization, return unauthorized
    if(!req.get('Authorization')){
        return res.status(401).send('Unauthorized')
    }

    const authenticated = await authenticateUpdateProduct(req, res)
    if(authenticated == true){
        // checks if request body exists, if not returns a bad request
        if(Object.keys(req.body).length === 0){
            return res.status(400).send('Bad request') // request body is empty
        }

        // if any of the required fields are empty or read only fields are entered, return a bad request
        if(!req.body.name || !req.body.description || !req.body.sku || !req.body.manufacturer || !req.body.quantity || req.body.id || req.body.date_added || req.body.date_last_updated || req.body.owner_user_id){
            return res.status(400).send('Bad request') // required fields are missing / read only fields entered
        }

        for (const prop in req.body) {
        if(req.body.hasOwnProperty(prop) && !bodyAllowedList.has(prop)) {
            return res.status(400).json('unexpected parameter in  body');
            }
        }

        // checks if request body exists, if not returns a bad request
        if(Object.keys(req.body).length === 0){
        return res.status(400).send('Bad request') // request body is empty
        }

        // retrieves attribute values from request body
        var name = req.body.name
        var description = req.body.description
        var sku = req.body.sku
        var manufacturer = req.body.manufacturer
        var quantity = req.body.quantity

        if(typeof quantity === 'string' || quantity < 0 || quantity > 100 || quantity % 1 != 1){
            return res.status(400).send('Bad request') // quantity is entered incorrectly
        }
      
        var checkIfExists = await Product.findOne({where: { id: req.params.id }})
    
        if(checkIfExists != null){
            if(checkIfExists.sku != req.body.sku){
                var checkIfExists = await Product.findOne({where: { sku: req.body.sku }})
                if(checkIfExists){
                    return res.status(400).send('Bad request')
                }
            }

            await Product.update({name: name, description: description, sku: sku, manufacturer: manufacturer, quantity: quantity, date_last_updated: date}, {where: { id: req.params.id }})
            return res.status(204).send()
        }

        return res.status(400).send('Bad request')
    }
}

// PATCH route to add a update product to database
const patchProduct = async(req, res) => {
    // if no authorization, return unauthorized
    if(!req.get('Authorization')){
        return res.status(401).send('Unauthorized')
    }

    const authenticated = await authenticateUpdateProduct(req, res)
    if(authenticated == true){
        // checks if request body exists, if not returns a bad request
        if(Object.keys(req.body).length === 0){
            return res.status(400).send('Bad request') // request body is empty
        }

        // if trying to update non-updatable fields
        if(req.body.id || req.body.date_added || req.body.date_last_updated || req.body.owner_user_id){
            return res.status(400).send('Bad request') // cannot update these fields
        }

        for (const prop in req.body) {
        if(req.body.hasOwnProperty(prop) && !bodyAllowedList.has(prop)) {
            return res.status(400).json('unexpected parameter in  body');
            }
        }

        // retrieves attribute values from request body
        var name = req.body.name
        var description = req.body.description
        var sku = req.body.sku
        var manufacturer = req.body.manufacturer
        var quantity = req.body.quantity
        var date = moment().tz("America/New_York").format('YYYY-MM-DDTHH:mm:ss.sssZ')

        if(!name && !description && !sku && !manufacturer && !quantity){
            return res.status(400).send('Bad request')
        }

        var checkIfExists = await Product.findOne({where: { id: req.params.id }})

        if(checkIfExists != null){

            if(req.body.owner_user_id){
                if(checkIfExists.owner_user_id != req.body.owner_user_id){
                    return res.status(400)
                }
            }

            if(quantity && (typeof quantity === 'string' || quantity < 0 || quantity > 100 || quantity % 1 != 1)){
                return res.status(400).send('Bad request') // quantity is entered incorrectly
            }

            if(sku){
                if(checkIfExists.sku != req.body.sku){
                    var checkIfExists = await Product.findOne({where: { sku: req.body.sku }})
                    if(checkIfExists){
                        return res.status(400).send('Bad request')
                    }
                }
            }

            await Product.update({name: name, description: description, sku: sku, manufacturer: manufacturer, quantity: quantity, date_last_updated: date}, {where: { id: req.params.id }})
            return res.status(204).send()
        }

        return res.status(400).send('Bad request')
    }
}

// DELETE route to delete product 
const deleteProduct = async (req, res) => {
    // if no authorization, return unauthorized
    if(!req.get('Authorization')){
        return res.status(401).send('Unauthorized')
    }

    if(await Product.findOne({where: { id: req.params.id }}) == null){
        return res.status(404).send('Not found') 
    }

    const authenticated = await authenticateUpdateProduct(req, res)

    if(authenticated == true){
        let product = await Product.findOne({where: { id: req.params.id }})
        if(product != null){
            await Product.destroy({where: { id: req.params.id }})
            return res.status(204).send()
        }
    }
}

// GET route to retrieve product details
const getProduct = async (req, res) => {
    let product = await Product.findOne({where: { id: req.params.id }})
    if(product != null){
        return res.status(200).send(product)
    }
    return res.status(404).send('Not found')
}

// function to authenticate a user while adding product
async function authenticateAddProduct(req) {
    // decodes authorization header to fetch username and password
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':')
    var username = credentials[0]
    var password = credentials[1]

    // finding the user with specified id
    let user = await User.findOne({where: { username: username }})

    if(user){
        // compare user password with stored hash
        const authenticated = await bcrypt.compare(password, user.password)
        if(authenticated) {
            return true
        }
    }
    // if user doesn't exist or unauthenticated
    return false
}

// function to authenticate a user while updating product
async function authenticateUpdateProduct(req, res) {
    // decodes authorization header to fetch username and password
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':')
    var username = credentials[0]
    var password = credentials[1]

    // finding the user with specified id
    let user = await User.findOne({where: { username: username }})
    let product = await Product.findOne({where: { id: req.params.id }})

    if(user && product){
        // compare user password with stored hash
        const authenticated = await bcrypt.compare(password, user.password)
        // if user is authenticated (credentials are correct), compares id passed to that of owner id found for the product passed (owner is correct)
        if(authenticated && user.id == product.owner_user_id) {
            return true
        }
        if(authenticated && user.id != product.owner_user_id){
            return res.status(403).send('Forbidden')
        }
    }

    // if product doesn't exist
    if(!product){
        return res.status(404).send('Not found')
    }

    // if user doesn't exist
    return res.status(401).send('Unauthorized')
}

module.exports = {
    addProduct,
    getProduct,
    updateProduct,
    patchProduct,
    deleteProduct
}