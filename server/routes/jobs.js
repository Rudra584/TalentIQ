import {Router} from 'express';
import {z} from 'zod';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import CandidateProfile from '../models/CandidateProfile.js';
import {authenticate,allowRoles} from '../middleware/auth.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {scoreMatch} from '../services/matching.js';
import {ACTIVE_JOB_STATUSES,makePublishedJob} from '../services/jobStatus.js';

const router=Router();
const jobInput=z.object({title:z.string().trim().min(3).max(120),company:z.string().trim().min(2).max(120),location:z.string().trim().max(120).optional(),type:z.enum(['Full-time','Part-time','Contract','Internship']).optional(),level:z.string().trim().max(50).optional(),description:z.string().trim().min(30).max(8000),requirements:z.array(z.string().trim().min(1).max(80)).max(40),salaryRange:z.string().trim().max(100).optional()});
const searchText=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

// Public listings include older records using the equivalent open/active labels.
router.get('/',asyncHandler(async(req,res)=>{
  const page=Math.max(1,Number(req.query.page)||1);
  const limit=Math.min(30,Math.max(1,Number(req.query.limit)||12));
  const filter={status:{$in:ACTIVE_JOB_STATUSES}};
  if(req.query.q){const q=new RegExp(searchText(req.query.q),'i');filter.$and=[...(filter.$and||[]),{$or:[{title:q},{company:q}]}];}
  if(req.query.location)filter.location=new RegExp(searchText(req.query.location),'i');
  const [jobs,total]=await Promise.all([Job.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit),Job.countDocuments(filter)]);
  res.json({jobs,total,page,pages:Math.ceil(total/limit)});
}));

router.get('/mine',authenticate,allowRoles('recruiter'),asyncHandler(async(req,res)=>{
  const jobs=await Job.find({recruiter:req.user.id}).sort({createdAt:-1});
  const counts=await Application.aggregate([{$match:{job:{$in:jobs.map(j=>j._id)}}},{$group:{_id:'$job',count:{$sum:1}}}]);
  const byJob=new Map(counts.map(x=>[String(x._id),x.count]));
  res.json({jobs:jobs.map(j=>({...j.toObject(),applicantCount:byJob.get(String(j._id))||0}))});
}));

// Publishing is explicit; clients cannot accidentally create a closed posting.
router.post('/',authenticate,allowRoles('recruiter'),asyncHandler(async(req,res)=>{
  const input=jobInput.parse(req.body);
  const job=await Job.create(makePublishedJob(input,req.user.id));
  res.status(201).json({job});
}));

router.put('/:id',authenticate,allowRoles('recruiter'),asyncHandler(async(req,res)=>{
  const input=jobInput.partial().parse(req.body);
  const job=await Job.findOneAndUpdate({_id:req.params.id,recruiter:req.user.id},{$set:input},{new:true,runValidators:true});
  if(!job)return res.status(404).json({error:'Job not found.'});
  res.json({job});
}));

router.patch('/:id/status',authenticate,allowRoles('recruiter'),asyncHandler(async(req,res)=>{
  const {status}=z.object({status:z.enum(['published','closed'])}).parse(req.body);
  const job=await Job.findOneAndUpdate({_id:req.params.id,recruiter:req.user.id},{$set:{status}},{new:true,runValidators:true});
  if(!job)return res.status(404).json({error:'Job not found.'});
  res.json({job});
}));

// Retain the existing close endpoint for clients already using it.
router.delete('/:id',authenticate,allowRoles('recruiter'),asyncHandler(async(req,res)=>{
  const job=await Job.findOneAndUpdate({_id:req.params.id,recruiter:req.user.id},{$set:{status:'closed'}},{new:true,runValidators:true});
  if(!job)return res.status(404).json({error:'Job not found.'});
  res.json({job});
}));

router.post('/:id/apply',authenticate,allowRoles('candidate'),asyncHandler(async(req,res)=>{
  const job=await Job.findOne({_id:req.params.id,status:{$in:ACTIVE_JOB_STATUSES}});
  if(!job)return res.status(404).json({error:'This job is no longer accepting applications.'});
  const profile=await CandidateProfile.findOne({user:req.user.id});
  if(!profile)return res.status(404).json({error:'Candidate profile not found.'});
  const {coverLetter}=z.object({coverLetter:z.string().max(2000).optional()}).parse(req.body);
  const match=scoreMatch(profile.skills,job.requirements,profile.resume?.text);
  const application=await Application.create({candidate:req.user.id,job:job.id,match,coverLetter:coverLetter||''});
  res.status(201).json({application});
}));

export default router;
