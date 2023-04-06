const db = require('../models')
const bcrypt = require('bcrypt')
const moment = require('moment')
const User = db.users
const Product = db.products
const AWS = require ('aws-sdk')
const bodyAllowedList = new Set (['name', 'description', 'sku', 'manufacturer', 'quantity'])
const StatsD = require('node-statsd')
const logger = require('../logger')
var client = new StatsD({
    host: "localhost",
    port: "8125"
});

s3 = new AWS.S3({region: process.env.AWS_REGION })
// POST route to add a new product to database
const addProduct = async(req, res) => {
    client.increment('add_product')
    // if no authorization, return unauthorized
    if(!req.get('Authorization')){
        logger.info("Cannot add product because of wrong credentials");
        return res.status(401).send('Unauthorized')
    }

    const authenticated = await authenticateAddProduct(req)
    if(authenticated == true){
        // checks if request body exists, if not returns a bad request
        if(Object.keys(req.body).length === 0){
            logger.info("JSON request body is empty to add a product");
            return res.status(400).send('Request Body is Empty') // request body is empty
        }

        // if any of the required fields are empty or read only fields are entered, return a bad request

        if(!req.body.name || !req.body.description || !req.body.sku || !req.body.manufacturer || req.body.quantity==null || req.body.id || req.body.date_added || req.body.date_last_updated || req.body.owner_user_id){
            logger.info("Unable to add product because of missing or invalid fields");
            return res.status(400).send('Required fields are empty or read only fields are entered') // required fields are missing / read only fields entered
        }

        for (const prop in req.body) {
        if(req.body.hasOwnProperty(prop) && !bodyAllowedList.has(prop)) {
            return res.status(400).json('Bad request!!');
            }
        }

        // retrieve username of user
        var username = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':')[0]

        var date = moment().tz("America/New_York").format('YYYY-MM-DDTHH:mm:ss.sssZ')

        // retrieves attribute values from request body
        var name = req.body.name
        var description = req.body.description
        var sku = req.body.sku
        var manufacturer = req.body.manufacturer
        var quantity = req.body.quantity
        var owner_user_id = (await User.findOne({where: { username: username }})).id

        if(typeof quantity === 'string' || quantity < 0 || quantity > 100 || quantity % 1!= 0 ){
            logger.info("Entered quantity is in wrong format");
            return res.status(400).send('Incorrect quantity entered') // quantity is entered incorrectly
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
            logger.info("Product Created Successfully"); //product creation  
            return res.status(201).send(response)
        }
    }

    if(authenticated == false){
        logger.info("Wrong credentials of the user provided");
        return res.status(401).send('User not authenticated') // user not authenticated
    }

    return res.status(400).send('Bad request') // above checks fail
}

// PUT route to add a update product to database
const updateProduct = async(req, res) => {
    client.increment("update_product")
    // if no authorization, return unauthorized

    if(!req.get('Authorization')){
        logger.info("Wrong credentials of the user provided");
        return res.status(401).send('Unauthorized')
    }

    const authenticated = await authenticateUpdateProduct(req, res)
    if(authenticated == true){
        // checks if request body exists, if not returns a bad request
        if(Object.keys(req.body).length === 0){
            logger.info("JSON request body is empty to update the product");
            return res.status(400).send('Request Body is empty') // request body is empty
        }

        // if any of the required fields are empty or read only fields are entered, return a bad request
        if(!req.body.name || !req.body.description || !req.body.sku || !req.body.manufacturer || req.body.quantity==null || req.body.id || req.body.date_added || req.body.date_last_updated || req.body.owner_user_id){
            logger.info("Required fields are empty or invalid to update the product");
            return res.status(400).send('Required fields are empty or read only fields are given') // required fields are missing / read only fields entered
        }

        for (const prop in req.body) {
        if(req.body.hasOwnProperty(prop) && !bodyAllowedList.has(prop)) {
            return res.status(400).json('unexpected parameter in body');
            }
        }

        // checks if request body exists, if not returns a bad request
        if(Object.keys(req.body).length === 0){
        logger.info("JSON request body is empty to update the product");
        return res.status(400).send('Request Body is empty') // request body is empty
        }
       
        var date = moment().tz("America/New_York").format('YYYY-MM-DDTHH:mm:ss.sssZ')

        // retrieves attribute values from request body
        var name = req.body.name
        var description = req.body.description
        var sku = req.body.sku
        var manufacturer = req.body.manufacturer
        var quantity = req.body.quantity

        if(typeof quantity === 'string' || quantity < 0 || quantity > 100 || quantity % 1!= 0 ){
            logger.info("Enter quantity is invalid");
            return res.status(400).send('Incorrect quantity entered') // quantity is entered incorrectly
        }
      
        var checkIfExists = await Product.findOne({where: { id: req.params.id }})
    
        if(checkIfExists != null){
            if(checkIfExists.sku != req.body.sku){
                var checkIfExists = await Product.findOne({where: { sku: req.body.sku }})
                if(checkIfExists){
                    logger.info("New sku is not allowed during update");
                    return res.status(400).send('Bad request')
                }
            }

            await Product.update({name: name, description: description, sku: sku, manufacturer: manufacturer, quantity: quantity, date_last_updated: date}, {where: { id: req.params.id }})
            logger.info("Update Successfule, id : "+req.params.id);
            return res.status(204).send()
        }

        return res.status(400).send('Bad request')
    }
}

// PATCH route to add a update product to database
const patchProduct = async(req, res) => {
    client.increment("product_patch")
    // if no authorization, return unauthorized
    if(!req.get('Authorization')){
        logger.info("Bad credentials");
        return res.status(401).send('Unauthorized')
    }

    const authenticated = await authenticateUpdateProduct(req, res)
    if(authenticated == true){
        // checks if request body exists, if not returns a bad request
        if(Object.keys(req.body).length === 0){
            logger.info("JSON requested body is empty");
            return res.status(400).send('Request Body is empty') // request body is empty
        }

        // if trying to update non-updatable fields
        if(req.body.id || req.body.date_added || req.body.date_last_updated || req.body.owner_user_id){
            logger.info("Cannot update the system auto generated fields");
            return res.status(400).send('Trying to update auto generated fields') // cannot update these fields
        }

        for (const prop in req.body) {
        if(req.body.hasOwnProperty(prop) && !bodyAllowedList.has(prop)) {
            logger.info("New property in the JSON body");
            return res.status(400).json('unexpected parameter in body');
            }
        }

        var date = moment().tz("America/New_York").format('YYYY-MM-DDTHH:mm:ss.sssZ')

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
                    logger.info(checkIfExists.body.owner_user_id+" does not exist");
                    return res.status(400)
                }
            }

            if(quantity && (typeof quantity === 'string' || quantity < 0 || quantity > 100 || quantity % 1!= 0 )){
                logger.info("Quantity entered in invalid");
                return res.status(400).send('Incorrect quantity entered') // quantity is entered incorrectly
            }

            if(sku){
                if(checkIfExists.sku != req.body.sku){
                    var checkIfExists = await Product.findOne({where: { sku: req.body.sku }})
                    if(checkIfExists){
                        logger.info(checkIfExists.sku+" does not exist");
                        return res.status(400).send('Bad request')
                    }
                }
            }

            await Product.update({name: name, description: description, sku: sku, manufacturer: manufacturer, quantity: quantity, date_last_updated: date}, {where: { id: req.params.id }})
            logger.info("Product updated successfully");
            return res.status(204).send()
        }

        return res.status(400).send('Bad request')
    }
}

// DELETE route to delete product 
const deleteProduct = async (req, res) => {
    client.increment('delete_product')
    // if no authorization, return unauthorized
    if(!req.get('Authorization')){
        logger.info("User is not authorized to delete");
        return res.status(401).send('Unauthorized')
    }

    if(await Product.findOne({where: { id: req.params.id }}) == null){
        logger.info("ID not present");
        return res.status(404).send('Not found') 
    }

    const authenticated = await authenticateUpdateProduct(req, res)

    if(authenticated == true){
        let product = await Product.findOne({where: { id: req.params.id }})
        if(product != null){
            await Product.destroy({where: { id: req.params.id }})

            //code to delete image after product delete
            const prefix = req.params.id + '/'

            const deleteObjectsParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Delete: {
                    Objects: []
                }
            }

            const listObjectsParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Prefix: prefix
            }

            s3.listObjectsV2(listObjectsParams, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    return;
                }
                deleteObjectsParams.Delete.Objects = data.Contents.map(function(content) {
                    return {Key: content.Key};
                })
                s3.deleteObjects(deleteObjectsParams, function(err, data) {
                    if (err) {
                        //logger.info(`[deleteProduct] from [productController]: Image deletion from S3 bucket unsuccessful for Product ID [${req.params.id}]`)
                        console.log(err, err.stack);
                    } else {
                        //logger.info(`[deleteProduct] from [productController]: Image deletion from S3 bucket successful for Product ID [${req.params.id}]`)
                        console.log("Deleted objects:", data.Deleted);
                    }
                })
            })

            logger.info("Product with ID "+req.params.id+" deleted");
            return res.status(204).send()
        }
    }
}

// GET route to retrieve product details
const getProduct = async (req, res) => {
    client.increment('get_product')
    let product = await Product.findOne({where: { id: req.params.id }})
    if(product != null){
        logger.info("Product with ID "+req.params.id+" retrieved successfully");
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
    // if user does not exist or is not unauthenticated
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