const express=require('express')
const {connectToMongoDB} = require('./connect')
const URL=require('./models/url')
const path = require('path')
const cookieParser= require('cookie-parser')
const {checkForAuthentication, restrictTo}= require('./middlewares/auth')

const urlRoute=require('./routes/url')
const staticRoute = require('./routes/staticRouter')
const userRoute = require('./routes/user')

const app=express()
const port=8001

connectToMongoDB("mongodb://localhost:27017/short-url-2")
.then(()=> console.log("MongoDb connected!"))

app.set("view engine", "ejs")
app.set('views', path.resolve('./views'))

app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(cookieParser())
app.use(checkForAuthentication)

app.get('/test', async(req,res)=>{
    const allUrls=await URL.find({})
    return res.render('home',{
        urls:allUrls,
    })
})

app.use('/url', restrictTo(["NORMAL","ADMIN"]), urlRoute) 
app.use('/', staticRoute)
app.use('/user', userRoute)

app.get('/url/:shortId', async (req,res) => {
    const shortId = req.params.shortId
    const entry = await URL.findOneAndUpdate({
        shortId,
    },
    {
        $push: {
            visitHistory:{
                timestamp : Date.now(),
            },
        },
    })
    if (!entry) {
        return res.status(404).json({ error: "Short URL not found" })
    }

    res.redirect(entry.redirectURL)
})

app.listen(port, ()=> console.log(`Server started at port no. : ${port}`))
