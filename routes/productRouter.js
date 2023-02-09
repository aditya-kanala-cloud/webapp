const productController = require('../controllers/productController')

const productRouter = require('express').Router()

productRouter.post('/', productController.addProduct)
productRouter.get('/:id', productController.getProduct)
productRouter.put('/:id', productController.updateProduct)
productRouter.patch('/:id', productController.patchProduct)
productRouter.delete('/:id', productController.deleteProduct)

module.exports = productRouter