import mongoose from 'mongoose';
const schema=new mongoose.Schema({candidate:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},job:{type:mongoose.Schema.Types.ObjectId,ref:'Job',required:true,index:true},status:{type:String,enum:['submitted','reviewing','interview','offer','rejected','withdrawn'],default:'submitted'},match:{score:Number,matchedSkills:[String],missingSkills:[String],explanation:String},coverLetter:{type:String,maxLength:2000}},{timestamps:true});
schema.index({candidate:1,job:1},{unique:true});
export default mongoose.model('Application',schema);
