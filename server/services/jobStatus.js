export const ACTIVE_JOB_STATUSES=Object.freeze(['published','open','active']);

export function makePublishedJob(input,recruiterId){
  return {...input,recruiter:recruiterId,status:'published'};
}

export function isActiveJobStatus(status){
  return ACTIVE_JOB_STATUSES.includes(status);
}
