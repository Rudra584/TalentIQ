import mongoose from 'mongoose';
const schema=new mongoose.Schema({recruiter:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},title:{type:String,required:true,trim:true,maxLength:120},company:{type:String,required:true,trim:true,maxLength:120},location:{type:String,default:'Remote'},type:{type:String,enum:['Full-time','Part-time','Contract','Internship'],default:'Full-time'},level:{type:String,default:'Mid-level'},description:{type:String,required:true,maxLength:8000},requirements:[{type:String,trim:true}],status:{type:String,enum:['draft','published','closed'],default:'published',index:true},salaryRange:String},{timestamps:true});
schema.index({status:1,createdAt:-1});
export default mongoose.model('Job',schema);
