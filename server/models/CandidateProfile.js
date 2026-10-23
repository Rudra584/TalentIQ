import mongoose from 'mongoose';
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User',unique:true,required:true},headline:{type:String,maxLength:160,default:''},location:{type:String,maxLength:120,default:''},experienceYears:{type:Number,min:0,max:60,default:0},skills:[{type:String,trim:true,maxLength:60}],summary:{type:String,maxLength:1500,default:''},resume:{filename:String,storedName:String,mimeType:String,size:Number,text:String,uploadedAt:Date}},{timestamps:true});
export default mongoose.model('CandidateProfile',schema);
