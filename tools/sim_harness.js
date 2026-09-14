/* Headless calibration harness for match_engine.html
   Usage: node tools/sim_harness.js [nSeeds] [seedBase]
   Extracts the engine <script>, stubs the DOM, runs full matches, dumps stats. */
'use strict';
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'match_engine.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('no <script> found'); process.exit(1) }
const code = m[1];

function mkCtx() {
    const grad = { addColorStop() { } };
    return new Proxy({}, {
        get(t, k) {
            if (k === 'measureText') return () => ({ width: 0 });
            if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => grad;
            if (typeof t[k] !== 'undefined') return t[k];
            return () => { };
        },
        set(t, k, v) { t[k] = v; return true }
    });
}
function mkEl(id) {
    const el = {
        id, innerHTML: '', textContent: '', className: '', width: 0, height: 0,
        style: {}, dataset: {}, onclick: null, _t: null,
        classList: { add() { }, remove() { }, toggle() { } },
        addEventListener() { }, appendChild() { }, prepend() { }, remove() { }, removeChild() { },
        get firstChild() { return mkEl('x') }, get lastChild() { return mkEl('x') },
        getBoundingClientRect: () => ({ width: 1200, height: 800, left: 0, top: 0 }),
        getContext: () => mkCtx(),
        firstElementChild: { style: {} },
    };
    return el;
}
const els = {};
global.document = {
    getElementById: id => els[id] || (els[id] = mkEl(id)),
    createElement: tag => mkEl(tag),
    querySelectorAll: () => [],
};
global.window = { devicePixelRatio: 1, addEventListener() { } };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => { };

const run = new Function(code + '\n; return { step, boot, getM: () => M, HALF };');
const api = run();

const nSeeds = +(process.argv[2] || 3);
const seedBase = +(process.argv[3] || 1);

const acc = { poss: [0, 0], passA: [0, 0], passC: [0, 0], lobA: [0, 0], lobC: [0, 0], shots: [0, 0], sot: [0, 0], xg: [0, 0], corners: [0, 0], fouls: [0, 0], off: [0, 0], boxE: [0, 0], tkW: [0, 0], ints: [0, 0], goals: [0, 0], crossA: [0, 0] };
let crash = 0;
for (let s = 0; s < nSeeds; s++) {
    const seed = seedBase + s;
    api.boot(seed);
    let guard = 0;
    try {
        while (api.getM().phase !== 'FULL' && guard < 400000) { api.step(); guard++ }
    } catch (e) {
        crash++;
        console.error('seed', seed, 'CRASH:', e.message);
        continue;
    }
    const M = api.getM();
    const [h, a] = M.teams;
    const psum = h.stats.poss + a.stats.poss;
    const hp = psum > 2 ? h.stats.poss / psum * 100 : 50;
    acc.poss[0] += hp; acc.poss[1] += 100 - hp;
    for (const k of ['passA', 'passC', 'lobA', 'lobC', 'shots', 'sot', 'xg', 'corners', 'fouls', 'off', 'boxE', 'tkW', 'ints', 'crossA']) { acc[k][0] += h.stats[k]; acc[k][1] += a.stats[k] }
    acc.goals[0] += M.score[0]; acc.goals[1] += M.score[1];
    const pct = (c, t2) => t2 ? Math.round(c / t2 * 100) + '%' : '—';
    console.log(`seed ${seed}  ${M.score[0]}:${M.score[1]}  | poss ${Math.round(hp)}/${Math.round(100 - hp)}  pass ${h.stats.passC}/${h.stats.passA} (${pct(h.stats.passC, h.stats.passA)}) + ${a.stats.passC}/${a.stats.passA} (${pct(a.stats.passC, a.stats.passA)})  | lob ${h.stats.lobC}/${h.stats.lobA} + ${a.stats.lobC}/${a.stats.lobA} = ${h.stats.lobA + a.stats.lobA}  | shots ${h.stats.shots}+${a.stats.shots}  xG ${h.stats.xg.toFixed(2)}+${a.stats.xg.toFixed(2)}  | corners ${h.stats.corners}+${a.stats.corners}  fouls ${h.stats.fouls}+${a.stats.fouls}  | boxE ${h.stats.boxE}+${a.stats.boxE}  tkW ${h.stats.tkW}+${a.stats.tkW}  ints ${h.stats.ints}+${a.stats.ints}`);
}
const n = Math.max(1, nSeeds - crash);
const A = k => (acc[k][0] + acc[k][1]) / n;
console.log('\n=== MEAN PER MATCH (both teams combined) ===');
console.log(`goals ${((acc.goals[0] + acc.goals[1]) / n).toFixed(2)} (${(acc.goals[0] / n).toFixed(2)}:${(acc.goals[1] / n).toFixed(2)})  poss ${Math.round(acc.poss[0] / n)}/${Math.round(acc.poss[1] / n)}`);
console.log(`passes ${Math.round(A('passA'))} att / ${Math.round(A('passC'))} comp (${Math.round(A('passC') / Math.max(1, A('passA')) * 100)}%)  | lofted ${Math.round(A('lobA'))} att (${Math.round(A('lobA') / Math.max(1, A('passA')) * 100)}% of passes) ${Math.round(A('lobC'))} comp`);
console.log(`shots ${Math.round(A('shots'))}  sot ${Math.round(A('sot'))}  xG ${A('xg').toFixed(2)}  crosses ${Math.round(A('crossA'))}  boxE ${Math.round(A('boxE'))}`);
console.log(`corners ${Math.round(A('corners'))}  fouls ${Math.round(A('fouls'))}  offsides ${Math.round(A('off'))}  tkW ${Math.round(A('tkW'))}  ints ${Math.round(A('ints'))}`);
if (crash) console.log(`!! ${crash} crash(es)`);
