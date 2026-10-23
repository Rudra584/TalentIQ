export const SKILLS=[
  'javascript','typescript','react','react native','node.js','express','python','java','sql','mongodb','postgresql',
  'aws','docker','kubernetes','css','html','communication','leadership','project management','figma',
  'machine learning','data analysis','excel','salesforce','git','rest api','accessibility',
  'linux','networking','ethical hacking','siem','cybersecurity','penetration testing','incident response',
  'threat analysis','vulnerability assessment','firewalls','tcp/ip','active directory'
];

// Alias lookup is exact after punctuation compaction; unknown names retain their
// normalized spelling, so similar-looking technologies are not merged broadly.
const aliasKey=value=>value.replace(/[\s._-]+/g,'');
const SKILL_ALIASES=new Map([
  ['computer networking','networking'],['networking fundamentals','networking'],['network administration','networking'],
  ['js','javascript'],
  ['react','react'],['react.js','react'],['react js','react'],['reactjs','react'],
  ['react native','react native'],['node','node.js'],['node.js','node.js'],['node js','node.js'],['nodejs','node.js'],
  ['express','express.js'],['express.js','express.js'],['express js','express.js'],['expressjs','express.js'],
  ['penetration testing','ethical hacking'],['pentesting','ethical hacking'],['pen testing','ethical hacking'],
  ['security information and event management','siem'],['siem tools','siem'],
  ['linux administration','linux'],['linux system administration','linux'],
  ['rest api','rest api'],['restful api','rest api'],['rest apis','rest api'],
  ['tcp/ip','tcp/ip']
].map(([alias,canonical])=>[aliasKey(alias),canonical]));

export function normalizeSkill(value){
  if(typeof value!=='string')return '';
  const normalized=value.trim().toLowerCase().replace(/[\u2010-\u2015]/g,'-').replace(/\s+/g,' ');
  return SKILL_ALIASES.get(aliasKey(normalized))||normalized;
}

const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

export function extractSkills(text=''){
  const source=String(text).toLowerCase();
  const found=SKILLS.filter(skill=>{
    const reactNativeGuard=skill==='react'?'(?![\\s.-]+native\\b)':'';
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(skill)}${reactNativeGuard}([^a-z0-9]|$)`,'i').test(source);
  });
  return [...new Set(found.map(normalizeSkill))];
}

export function scoreMatch(candidateSkills=[],requirements=[],resumeText=''){
  const required=[...new Set((Array.isArray(requirements)?requirements:[]).map(normalizeSkill).filter(Boolean))];
  const candidate=[...new Set([
    ...(Array.isArray(candidateSkills)?candidateSkills:[]).map(normalizeSkill),
    ...extractSkills(resumeText)
  ].filter(Boolean))];

  if(!required.length)return {score:null,calculated:false,reason:'requirements-missing',matchedSkills:[],missingSkills:[],explanation:'Job requirements are missing, so a skill match cannot be calculated.'};
  if(!candidate.length)return {score:null,calculated:false,reason:'candidate-skills-missing',matchedSkills:[],missingSkills:required,explanation:'Add your skills or upload a resume to calculate your match.'};

  const candidateSet=new Set(candidate);
  const matchedSkills=required.filter(skill=>candidateSet.has(skill));
  const missingSkills=required.filter(skill=>!candidateSet.has(skill));
  const score=Math.round(matchedSkills.length/required.length*100);
  return {score,calculated:true,reason:null,matchedSkills,missingSkills,explanation:`${matchedSkills.length} of ${required.length} required skills match your profile or extracted resume. This keyword comparison is a screening aid, not an assessment of ability.`};
}

// Temporary, opt-in diagnostics stay on the server and are disabled in production.
// Never pass resume text, names, email addresses, or credentials to this logger.
export function logMatchDiagnostics({candidateId,job,profile,match}){
  if(process.env.NODE_ENV!=='development'||process.env.TALENTIQ_DEBUG_MATCHING!=='true')return;
  const profileSkills=Array.isArray(profile?.skills)?profile.skills:[];
  const resumeSkills=extractSkills(profile?.resume?.text||'');
  const combined=[...new Set([...profileSkills.map(normalizeSkill),...resumeSkills.map(normalizeSkill)].filter(Boolean))];
  const combinedSet=new Set(combined);
  const requirements=Array.isArray(job?.requirements)?job.requirements:[];
  const report={
    candidateId:String(candidateId||profile?.user||''),
    job:{id:String(job?._id||''),title:job?.title||'',company:job?.company||''},
    profileSkills,
    resumeExtractedSkills:resumeSkills,
    combinedNormalizedCandidateSkills:combined,
    requiredSkills:requirements,
    requirementResults:requirements.map(skill=>{
      const normalized=normalizeSkill(skill);
      return {skill,normalized,matched:combinedSet.has(normalized)};
    }),
    finalPercentage:match?.score??null
  };
  console.info('[TalentIQ skill-match debug]',JSON.stringify(report));
}
