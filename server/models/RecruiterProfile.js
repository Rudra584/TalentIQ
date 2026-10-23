import mongoose from 'mongoose';
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User',unique:true,required:true},company:{type:String,required:true,trim:true,maxLength:120},website:String,industry:String,about:{type:String,maxLength:1200,default:''}},{timestamps:true});
export default mongoose.model('RecruiterProfile',schema);
