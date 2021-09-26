const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ImageSchema = new Schema({
    url:String,
    filename:String
})

ImageSchema.virtual('thumbnail').get(function(){
    return this.url.replace('/upload','/upload/w_500,h_400')
})
const foodSchema = new Schema({
     name:String,
     images:[ImageSchema],
     location:String,
     author:{
         type:mongoose.Schema.Types.ObjectId,
         ref:'User'
     }
 })

 module.exports = mongoose.model("Food",foodSchema)