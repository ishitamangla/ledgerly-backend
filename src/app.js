// 2 tasks 
//creation of server
//configuration of server

const express = require("express")
const cookieParser = require("cookie-parser")
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/accounts.routes")
const transactionRoutes = require("./routes/transaction.routes")

const app = express()


//parse json convert to js object and put data in req.body
app.use(express.json())

//read form cookies and put in req.cookies
app.use(cookieParser())

app.get("/",(req,res) => {
    res.send("Ledger services is up and runing")
})

app.use("/api/auth",authRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/transactions",transactionRoutes)

module.exports = app

