const mongoose = require('mongoose')
const Schema = mongoose.Schema
const foodSchema = new Schema({
     name:String,
     image:String,
     location:String,
     author:{
         type:mongoose.Schema.Types.ObjectId,
         ref:'User'
     }
 })

 module.exports = mongoose.model("Food",foodSchema)