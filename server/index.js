require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const cors = require('cors')

const trackingRoute = require('./routes/tracking')
const userRouter = require('./routes/user')
const officeRouter = require('./routes/postoffice')
const warehouseRouter = require('./routes/warehouse')
const updateStateRouter = require('./routes/updatestate')

const connectDB = async () => {
    try {
        await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@magicpost.razafix.mongodb.net/?retryWrites=true&w=majority`)
        console.log('MongoDB connected')
        console.log(`Connected to MongoDB database: ${mongoose.connection.db.databaseName}`);
    } catch (err) { 
        console.log(err)
    }
}

connectDB()
const app = express()

app.use(cors({ 
    origin: '*'
}))
app.use(bodyParser.json());

// Register your routes
app.use('/orders', trackingRoute)
app.use('/user', userRouter)
app.use('/postoffice', officeRouter)
app.use('/warehouse', warehouseRouter)  
app.use('/updatestate', updateStateRouter)

const port = 3000
app.listen(port, () => console.log(`Example app listening on ${port}!`))
