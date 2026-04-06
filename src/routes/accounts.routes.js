const express =require("express")
const router = express.Router()
const accountController = require('../controllers/account.controller')
const authMiddleware = require('../middleware/auth.middleware')
/**
 * - POST (/api/accounts/) 
 * -create a new account
 */
router.post("/",authMiddleware.authMiddleware,accountController.createAccountController)

/**
 * -GET (/api/accounts)
 * - get all accounts of the logged in user
 */
router.get('/',authMiddleware.authMiddleware,accountController.getUserAccountsController)


/**
 *  - GET /api/accounts/balance/:accountId
 */

router.get('/balance/:accountId',authMiddleware.authMiddleware,accountController.getAccountBalanceController)


module.exports = router;