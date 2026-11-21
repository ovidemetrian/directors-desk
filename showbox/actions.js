/* Director's Desk · SHOW BOX · ACTION MAP
   Desk action keys → one QRC write + the exact value the box must read back from the Core.
   Only what Q-SYS owns lives here: scenes, mic mutes, mic levels, and HUSH.
   Lights (sACN), cameras and cue lights belong to other boxes. GO Blackout is lighting: not here.

   HUSH is in the map but marked human: it is never reachable through /box/action (the grammar and Claude's path),
   only through /box/hush, which the box accepts from the Director or A1 Audio pressing the desk's own HUSH key.

   Control names are placeholders. Whoever builds the Q-SYS design fills in the real Named Controls.
   Design conventions the box needs (write them on the Q-SYS job sheet):
   • "Desk.Scene" (1-4) saved inside each scene snapshot, so a scene has a value to read back
   • "Desk.Hush" (0/1) that, inside the design, mutes every mic and remote input regardless of their own mutes */
'use strict';

const SCENE_BANK = 'Scenes';
const SCENE_RAMP = 0.5;                                   // seconds
const SCENES = { walkin: 1, presentation: 2, qa: 3, brk: 4 };
const MICS = { pres: 'Pres', aud1: 'Aud1', aud2: 'Aud2', remote: 'Remote', play: 'Play' }; // desk channel id → control prefix
const HUSH = 'Desk.Hush';

/* Same ownership as the desk (desk.js OWN). The box checks the role of the joined device, not what the page claims. */
const OWN = { audio: ['Director', 'A1 Audio'], scene: ['Director'] };

const MAP = {};
for (const [k, n] of Object.entries(SCENES))
  MAP['scene:' + k] = { title: 'Scene · ' + k, own: 'scene', write: q => q.snapshot(SCENE_BANK, n, SCENE_RAMP),
    readback: { name: 'Desk.Scene', want: n }, settleMs: SCENE_RAMP * 1000 + 150 };
for (const [k, p] of Object.entries(MICS)) {
  MAP['mute:' + k] = { title: k + ' · mute', own: 'audio', write: q => q.set(p + '.Mute', 1), readback: { name: p + '.Mute', want: 1 } };
  MAP['live:' + k] = { title: k + ' · open', own: 'audio', write: q => q.set(p + '.Mute', 0), readback: { name: p + '.Mute', want: 0 } };
}
/* Levels take a value: "level:pres" with value -6 (dB). Read-back allows 0.5 dB for the Core's own rounding. */
function levelAction(id, db) {
  const p = MICS[id]; if (!p || !Number.isFinite(db)) return null;
  const v = Math.max(-100, Math.min(20, db)), ramp = 0.3;
  return { title: `${id} · level ${v} dB`, own: 'audio', write: q => q.set(p + '.Gain', v, ramp),
    readback: { name: p + '.Gain', want: v, tol: 0.5 }, settleMs: ramp * 1000 + 100 };
}
const HUSH_ACTIONS = {
  on:  { title: 'HUSH engaged', own: 'audio', human: true, write: q => q.set(HUSH, 1), readback: { name: HUSH, want: 1 } },
  off: { title: 'HUSH released', own: 'audio', human: true, write: q => q.set(HUSH, 0), readback: { name: HUSH, want: 0 } }
};

const WATCH = [...new Set([HUSH, 'Desk.Scene', ...Object.values(MICS).flatMap(p => [p + '.Mute', p + '.Gain'])])];

module.exports = { MAP, WATCH, OWN, MICS, SCENES, SCENE_BANK, HUSH, HUSH_ACTIONS, levelAction };
