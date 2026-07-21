import test from'node:test';import assert from'node:assert/strict';import{LEVELS,LURES}from'../src/levels.js';
test('five substantial voyages',()=>{assert.equal(LEVELS.length,5);for(const l of LEVELS){assert.ok(l.width>=230);assert.ok(l.platforms.length>=45);assert.ok(l.checkpoints.length>=3);assert.ok(l.pearls.length>=30);assert.ok(l.goal[0]>l.width-8)}});
test('eight permanent lure definitions are unique',()=>{assert.equal(LURES.length,8);assert.equal(new Set(LURES.map(l=>l.id)).size,8);for(const l of LURES)assert.ok(l.name&&l.desc&&l.color)});
test('main routes do not declare required lures',()=>{for(const l of LEVELS){assert.equal(l.requiredLure,undefined);assert.ok(l.lurePickups.length>=1);assert.ok(l.secrets.length>=3)}});
test('every voyage has unique art, fish, and music',()=>{assert.equal(new Set(LEVELS.map(l=>l.bg)).size,5);assert.equal(new Set(LEVELS.map(l=>l.fish)).size,5);assert.equal(new Set(LEVELS.map(l=>l.music)).size,5)});
