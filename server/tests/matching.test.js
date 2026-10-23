import test from 'node:test';
import assert from 'node:assert/strict';
import {extractSkills,normalizeSkill,scoreMatch} from '../services/matching.js';

test('all required skills match for 100 percent',()=>{
  const result=scoreMatch([' Python ','LINUX','Networking','Ethical Hacking','SIEM'],['Python','Linux','Computer Networking','Ethical Hacking','SIEM']);
  assert.equal(result.score,100);
  assert.deepEqual(result.missingSkills,[]);
});

test('React.js matches React in either direction',()=>{
  assert.equal(scoreMatch(['React.js'],['React']).score,100);
  assert.equal(scoreMatch(['React'],['React.js']).score,100);
  assert.equal(normalizeSkill('  REACT.JS  '),'react');
});

test('Node and Node.js are equivalent as complete skill names',()=>{
  assert.equal(scoreMatch(['Node'],['Node.js']).score,100);
  assert.equal(normalizeSkill(' NODE JS '),'node.js');
  assert.equal(scoreMatch(['Python'],['Node.js'],'Node is a tree data structure.').score,0);
  assert.equal(scoreMatch([],['Node.js'],'Built APIs with Node.js.').score,100);
});

test('Express and Express.js are equivalent',()=>{
  assert.equal(scoreMatch(['Express'],['Express.js']).score,100);
  assert.equal(scoreMatch(['Express.js'],['Express']).score,100);
  assert.equal(normalizeSkill('Express JS'),'express.js');
});

test('Computer Networking is equivalent to Networking',()=>{
  assert.equal(scoreMatch(['Computer Networking'],['Networking']).score,100);
  assert.equal(scoreMatch(['Networking'],['Computer Networking']).score,100);
  assert.equal(normalizeSkill('COMPUTER   NETWORKING'),'networking');
});

test('Java does not match JavaScript in either direction',()=>{
  assert.equal(scoreMatch(['JavaScript'],['Java']).score,0);
  assert.equal(scoreMatch(['Java'],['JavaScript']).score,0);
  assert.equal(extractSkills('JavaScript developer').includes('java'),false);
});

test('React does not match React Native, including resume extraction',()=>{
  assert.equal(scoreMatch(['React Native'],['React']).score,0);
  assert.equal(scoreMatch(['React'],['React Native']).score,0);
  assert.equal(scoreMatch([],['React'],'Experienced with React Native apps.').score,0);
  assert.equal(scoreMatch([],['React Native'],'Experienced with React Native apps.').score,100);
  assert.deepEqual(extractSkills('React Native developer'),['react native']);
});

test('case, whitespace and reasonable punctuation differences normalize safely',()=>{
  assert.equal(normalizeSkill('  rEaCt . Js  '),'react');
  assert.equal(normalizeSkill('node-js'),'node.js');
  assert.equal(normalizeSkill('Express-JS'),'express.js');
  assert.equal(scoreMatch(['  COMPUTER   NETWORKING '],['networking']).score,100);
});

test('duplicate required skills count once after normalization',()=>{
  const result=scoreMatch(['React'],['React','React.js','Node.js']);
  assert.equal(result.score,50);
  assert.deepEqual(result.matchedSkills,['react']);
  assert.deepEqual(result.missingSkills,['node.js']);
});

test('duplicate candidate skills do not increase the score',()=>{
  const result=scoreMatch(['React','react.js',' REACT ','JavaScript'],['React','Node.js']);
  assert.equal(result.score,50);
  assert.deepEqual(result.matchedSkills,['react']);
});

test('partial overlap uses matched requirements divided by total requirements',()=>{
  const result=scoreMatch(['Python','Linux'],['Python','Linux','Networking','SIEM']);
  assert.equal(result.score,50);
  assert.deepEqual(result.matchedSkills,['python','linux']);
  assert.deepEqual(result.missingSkills,['networking','siem']);
});

test('missing candidate skills never produce a false 100 percent',()=>{
  const result=scoreMatch([],['Python','Linux']);
  assert.equal(result.score,null);
  assert.equal(result.reason,'candidate-skills-missing');
  assert.equal(result.explanation,'Add your skills or upload a resume to calculate your match.');
});

test('missing job requirements cannot produce a misleading percentage',()=>{
  const result=scoreMatch(['python'],[]);
  assert.equal(result.score,null);
  assert.equal(result.reason,'requirements-missing');
});

test('one candidate receives different scores for different job requirements',()=>{
  const skills=['python','react','node.js','javascript'];
  const cybersecurity=scoreMatch(skills,['Python','Linux','Networking','Ethical Hacking','SIEM']);
  const fullStack=scoreMatch(skills,['React','Node.js','JavaScript']);
  assert.equal(cybersecurity.score,20);
  assert.equal(fullStack.score,100);
});

test('resume extraction recognizes cybersecurity skills as separate whole terms',()=>{
  assert.deepEqual(extractSkills('Python, Linux, Networking, Ethical Hacking, SIEM'),['python','linux','networking','ethical hacking','siem']);
});

test('HTML5 remains distinct from HTML without an explicit alias',()=>{
  assert.equal(scoreMatch(['HTML5'],['HTML']).score,0);
  assert.equal(scoreMatch(['HTML'],['HTML5']).score,0);
});
