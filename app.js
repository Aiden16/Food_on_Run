if (process.env.NODE_ENV!=="production"){
    require('dotenv').config()
}
console.log(process.env.CLOUDINARY_CLOUD_NAME)
const express = require('express')
const session = require('express-session')
const flash = require('connect-flash');
const path = require('path')
const mongoose = require('mongoose')
const Food = require('./models/food')
const methodOverride = require('method-override')
//passport
const passport = require('passport')
const localStrategy = require('passport-local') 
const User = require('./models/user')
const app = express()

//mapbox
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding')
const mapBoxToken = process.env.MAPBOX_TOKEN
const geoCoder = mbxGeocoding({accessToken : mapBoxToken})

//cloudinary
const multer  = require('multer')
const {storage} = require('./cloudinary/index')

//to upload files to cloud
const upload = multer({ storage })

//---mongoose setup-----//
mongoose.connect('mongodb://localhost:27017/foodRun', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex:true
    })

const db = mongoose.connection
db.on('error',console.error.bind(console,'connection error'))
db.once('open',()=>{
    console.log('Database connected')
})

//-----Middlewares-----//
app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))
app.use(methodOverride('_method'))

const isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.flash('error','You must be logged in!!')
        return res.redirect('/login')
    }
    next()
}

//--session-----//
const sessionConfig = {
    secret:'Thisisasceretforfoodonrun',
    resave:false,
    saveUninitialized:true,
    cookies:{
        httpOnly:true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge:1000*60*60*24*7
    }

}
app.use(session(sessionConfig))

app.use(flash());

//passport//
app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

//---flash---//
app.use((req, res, next) => {
    res.locals.currentUser = req.user
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

//----Home route-----//
app.get('/',async(req,res)=>{
    const allFoods = await Food.find({}).populate('author')
    // console.log(allFoods)
    res.render('home',{allFoods})
})

//-----to create new posts----//
app.get('/new', isLoggedIn ,async(req,res)=>{
    res.render('new')
})

app.post('/new',upload.array('image'),async(req,res)=>{
    const geoData = await geoCoder.forwardGeocode({
        query:req.body.location,
        limit:1
    }).send()
    console.log('=================================================')
    // [ 77.59796, 12.96991 ]
    // console.log('====>',geoData.body.features[0].geometry.coordinates)
    console.log('=================================================')
    // res.send(geoData)
    const newFood = new Food(req.body)
    newFood.author = req.user.id
    newFood.images=req.files.map(f=>({url:f.path,filename:f.filename}))
    newFood.coordinates.push(geoData.body.features[0].geometry.coordinates[0])
    newFood.coordinates.push(geoData.body.features[0].geometry.coordinates[1])
    await newFood.save()
    console.log(newFood)
    req.flash('success','Successfully created new post')
    // // console.log(newFood)
    res.redirect(`/foods/${newFood.id}/show`)
})

//to book
app.post('/:id/book',async(req,res)=>{
    const food = await Food.findById(req.params.id)
    console.log(food)
    food.booked=req.user.id
    await food.save()
    res.redirect(`/foods/${food.id}/show`)
    // res.send(food)
    // console.log(food.booked.username)
    // console.log(req.user.id)

})

app.get('/foods/:id/show',async(req,res)=>{
    const food = await Food.findById(req.params.id).populate('booked').populate('author')
    console.log(food.coordinates)
    res.render('show',{food})
})

//-----to edit a post-----//
app.get('/foods/:id/edit', isLoggedIn , async(req,res)=>{
    const foundItem = await Food.findById(req.params.id)
    // res.send(foundItem)
    if(!foundItem){
        req.flash('error',"Cannot find that post! :(")
        return res.redirect('/')
    }
    res.render('edit',{foundItem})
})

app.put('/foods/:id',async(req,res)=>{
    const {id} = req.params
    await Food.findByIdAndUpdate(id,req.body)
    req.flash('success','Post edited successfully!')
    res.redirect('/')
})

//------- to delete a post-----//
app.delete('/foods/:id',async(req,res)=>{
    const {id} = req.params
    await Food.findByIdAndDelete(id)
    req.flash('success','Successfully deleted your post!')
    res.redirect('/')
})

//register and stuff

//register page
app.get('/register',(req,res)=>{
    res.render('user/register')
})

//registered user
app.post('/register',async(req,res)=>{
    try{
    const{username,email,password}=req.body
    const newUser = new User({email,username})
    const registerUser = await User.register(newUser,password)
    console.log(registerUser)
    req.flash('success','Welcome to food on run!')
    res.redirect('/')
    }catch(e){
        req.flash('error',e.message)
        res.redirect('/')
    }
})

//login user
//login page
app.get('/login',(req,res)=>{
    res.render('user/login')
})

//authenticate user
app.post('/login',passport.authenticate('local',{failureFlash:true,failureRedirect:'/login'}),(req,res)=>{
    req.flash('success',`Welcom ${req.user.username}!`)
    console.log(req.user)
    res.redirect('/')
})

//logout user 
app.get('/logout',(req,res)=>{
    req.logout()
    req.flash('success','Logged you out!')
    res.redirect('/')
})
app.listen('3000',async(req,res)=>{
    console.log('App is running......')
})