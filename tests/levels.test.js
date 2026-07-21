import test from 'node:test';import assert from 'node:assert/strict';import {LEVELS} from '../src/levels.js';
test('demo includes five complete stages',()=>{assert.equal(LEVELS.length,5);for(const l of LEVELS){assert.ok(l.name&&l.fish);assert.ok(l.platforms.length>=8);assert.ok(l.hooks.length>=4);assert.ok(l.pearls.length>=4);assert.ok(l.goal[0]>l.start[0])}});
test('every stage has a unique catch',()=>assert.equal(new Set(LEVELS.map(l=>l.fish)).size,5));
