const express = require('express')
const session = require('express-session')
const flash = require('connect-flash');
const path = require('path')
const mongoose = require('mongoose')
const Food = require('./models/food')
const methodOverride = require('method-override')
const app = express()


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

//---flash---//
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

//----Home route-----//
app.get('/',async(req,res)=>{
    const allFoods = await Food.find({})
    console.log(allFoods)
    res.render('home',{allFoods})
})

//-----to create new posts----//
app.get('/new',async(req,res)=>{
    res.render('new')
})

app.post('/new',async(req,res)=>{
    const newFood = new Food(req.body)
    await newFood.save()
    req.flash('success','Successfully created new post')
    console.log(newFood)
    res.redirect('/')
})

//-----to edit a post-----//
app.get('/foods/:id/edit',async(req,res)=>{
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
app.listen('3000',async(req,res)=>{
    console.log('App is running......')
})