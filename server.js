const mongoose = require('mongoose');
const express = require('express');
require ('dotenv').config()

const userRouter = require('./routes/userRouter')



const cors = require('cors')
mongoose.set('strictQuery' , true);

//connecting to the db

mongoose.connect(process.env.DB_CONNECT)
    .then(() =>{
        console.log('MongoDB connected...');
    })


//creating express app

const app = express();

const PORT = process.env.PORT || 3000;

const corsOptions = {
    origin: "*",
    methods: ["GET" , "POST" , "PUT" , "DELETE"],
};

app.use(cors(corsOptions));


app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('' , userRouter);





app.get('/', (req,res)=>{
    return res.status(200).json({
        message: 'Congrats your web server is running'
    })
})

app.listen(PORT , () => {
    console.log(`server started on port ${PORT}`);
    console.log(`click here to access http://localhost:${PORT} `);
})