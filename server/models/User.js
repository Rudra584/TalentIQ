import mongoose from 'mongoose';
const schema=new mongoose.Schema({name:{type:String,required:true,trim:true,maxLength:100},email:{type:String,required:true,unique:true,lowercase:true,trim:true},passwordHash:{type:String,required:true,select:false},role:{type:String,enum:['candidate','recruiter'],required:true},resetTokenHash:String,resetExpires:Date},{timestamps:true});
export default mongoose.model('User',schema);
