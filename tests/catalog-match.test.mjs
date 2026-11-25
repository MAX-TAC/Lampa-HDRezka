import test from 'node:test';
import assert from 'node:assert/strict';
import {rankCandidates} from '../src/catalog-match.mjs';
const card={title:'Ёлки',year:2010,media_type:'movie'};
const exact={id:'1',title:'Елки',year:2010,kind:'movie'};
test('exact normalized title, year, type can match',()=>assert.equal(rankCandidates(card,[exact]).match,exact));
test('remake and series cannot silently substitute',()=>{
 const remake={...exact,id:'2',year:2020}, series={...exact,id:'3',kind:'series'};
 const r=rankCandidates(card,[remake,series]);assert.equal(r.match,null);assert.deepEqual(r.candidates,[remake]);
});
test('ambiguous matches require selection',()=>assert.equal(rankCandidates(card,[exact,{...exact,id:'2'}]).match,null));
test('unknown type requires confirmation',()=>assert.equal(rankCandidates(card,[{...exact,kind:null}]).match,null));
test('original title is considered',()=>assert.equal(rankCandidates({...card,original_title:'Christmas Trees'},[{...exact,title:'Christmas Trees'}]).match.title,'Christmas Trees'));
