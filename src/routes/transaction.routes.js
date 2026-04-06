const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const Router = express.Router()
const transactionController = require('../controllers/transaction.controller')

/**
 * - POST /api/transactions/
 * - create a new transaction
 */
Router.post('/',authMiddleware.authMiddleware,transactionController.createTransaction)

/**
 * - POST /api/transactions/system/initial-funds
 * - create initial funds transaction form system user 
 */
Router.post("/system",authMiddleware.authSystemUserMiddleware,transactionController.createSystemTransaction)

module.exports = Router;