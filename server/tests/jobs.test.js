import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVE_JOB_STATUSES,isActiveJobStatus,makePublishedJob} from '../services/jobStatus.js';

test('new job payload is always active even if a client sends a stale closed value',()=>{
  assert.deepEqual(makePublishedJob({title:'Designer',status:'closed'},'recruiter-1'),{title:'Designer',status:'published',recruiter:'recruiter-1'});
});

test('published and legacy open/active statuses are eligible for candidates, closed jobs are not',()=>{
  assert.deepEqual(ACTIVE_JOB_STATUSES,['published','open','active']);
  for(const status of ACTIVE_JOB_STATUSES)assert.equal(isActiveJobStatus(status),true);
  assert.equal(isActiveJobStatus('closed'),false);
  assert.equal(isActiveJobStatus(undefined),false);
});
