const bcrypt = require('bcrypt')
const moment = require('moment')
const db = require('../models')

const Images = db.images
const User = db.users
const Products = db.products

const {uploadFile, deleteFile}  = require('../s3')
const StatsD = require('node-statsd')
const logger = require('../logger')
var client = new StatsD({
    host: "localhost",
    port: "8125"
});

const uploadImage = async (req,res) => {
    client.increment('upload_image');
    //check if Auth block exist in request
    if(!req.get('Authorization')){
        logger.info("User not authorized because of false credentials");
        return res.status(401).send('Unauthorized')
    }
    console.log(req.params)
    if(isNaN(req.params.id) || !req.file){
        logger.info("The fields are not present");
        return res.status(400).send('Bad request')
    }

    // check if user is authorized
    const authenticated = await authenticate(req,res)

    if(!isNaN(authenticated)){

        const extension = req.file.mimetype

        // check if request body has all the necessary information
        if( extension!= "image/jpeg" && extension != "image/png"){
            logger.info("Wrong file extension being uploaded");
            return res.status(400).send('File Format Not Supported')
        }

        const result = await uploadFile(req)

        var date = moment().tz("America/New_York").format('YYYY-MM-DDTHH:mm:ss.sss')

        // structuring JSON object with Info
        let newImage = {
            product_id: req.params.id,
            file_name: req.file.originalname,
            date_created: date,
            s3_bucket_path : result.key,
        }

        const image = await Images.create(newImage)
        logger.info("Image uploaded successfully");
        return res.status(201).send(image)
    }
}

// method to be executed on GET method call
const getImage = async (req, res) => {
    client.increment('get_image')

    if(isNaN(req.params.id) || isNaN(req.params.image) ){
        logger.info("Required fields not present");
        return res.status(400).json('Bad request');
    }

    //check if auth block exist in request
    if(!req.get('Authorization')){
        logger.info("User not authorized to access image");
        return res.status(401).send('Unauthorized')
    }

    //decode auth
    const authenticated = await authenticate(req,res)

    if(!isNaN(authenticated)){

        let image = await Images.findOne({where: {product_id: req.params.id, image_id: req.params.image }})//edited product_id

        //check if product exist
        if(image != null){
            logger.info("Image retrieved successfully");
            return res.status(200).send(image)
        }else{
            return res.status(403).send("Forbidden from accessing other images")
        }
    }
}

const getAllImages = async (req, res) => {
    client.increment('all_images')
    if(isNaN(req.params.id)){
        logger.info("Required field not present");
        return res.status(400).json('Bad request');
    }
    if(!req.get('Authorization')){
        logger.info("User not authorized");
        return res.status(401).send('Unauthorized')
    }
    const authenticated = await authenticate(req,res)
    if(!isNaN(authenticated)){
        let images = await Images.findAll({where: { product_id: req.params.id }})
        if(images != null){
            logger.info("All the images retrieved successfully");
            return res.status(200).send(images)
        }else{
            logger.info("Required image not found");
            return res.status(404).send("Not Found")
        }
    }
}

const deleteImage = async (req,res) => {
    client.increment('delete_image')

    if(isNaN(req.params.id) || isNaN(req.params.image) ){
        logger.info("Required fields are not present");
        return res.status(400).json('Bad request');
    }

    //check if auth block exist in request
    if(!req.get('Authorization')){
        logger.info("User not authorized to access images");
        return res.status(401).send('Unauthorized')
    }

    //decode auth
    const authenticated = await authenticate(req,res)

    if(!isNaN(authenticated)){

        // retrieve product data based on parameter id
        let image = await Images.findOne({where: {product_id: req.params.id, image_id: req.params.image }}) //edited product_id

        //check if product exist and delete
        if(image != null){

            await deleteFile(image.s3_bucket_path)

            await Images.destroy({where: { image_id: req.params.image }})
            logger.info("Image deletion successful");
            return res.status(204).send()
        }else{
            return res.status(403).send("Forbidden from accessing other images")
        }
    }

}

// function to authenticate a user
async function authenticate (req, res) {
    // decrypt auth
    var basicAuth = Buffer.from(req.get('Authorization').split(' ')[1], 'base64').toString().split(':')
    let user = await User.findOne({where: { username: basicAuth[0] }})

    if(user){
        const authenticated = await bcrypt.compare(basicAuth[1], user.password)
        if(authenticated){

            if(req.params.id){
                let product = await Products.findOne({where: { id: req.params.id }})
                if(product != null){
                    if(product.owner_user_id == user.id){
                        return user.id
                    }else{
                        return res.status(403).send('Forbidden')
                    }
                }else{
                    logger.info("Requested image not found");
                    return res.status(404).send('Product Not Found')
                }
            }else{
                return user.id;
            }

        }else{
            return res.status(401).send('Unauthorized')
        }

    }else{
        return res.status(401).send('Unauthorized')
    }
}

module.exports = {
    getImage,
    deleteImage,
    uploadImage,
    getAllImages
}