import assert from 'node:assert/strict';
import {
  FILES, HEAD_LEN, arrowGeometry, coordinateLabels, isKnightMove, keyFromPoint, projectKey,
} from '../src/lib/board-geometry.ts';

let n = 0;
const ok = (name: string, fn: () => void) => { fn(); n++; console.log('PASS', name); };
const K = (s: string) => s as any;
const allKeys = () => FILES.split('').flatMap((f) => [1,2,3,4,5,6,7,8].map((r) => K(`${f}${r}`)));

ok('projectKey sudut, kedua orientasi', () => {
  assert.deepEqual(projectKey(K('a1'), 'white'), [0.5, 7.5]);
  assert.deepEqual(projectKey(K('h8'), 'white'), [7.5, 0.5]);
  assert.deepEqual(projectKey(K('a1'), 'black'), [7.5, 0.5]);
  assert.deepEqual(projectKey(K('h8'), 'black'), [0.5, 7.5]);
});

ok('round-trip 64 kotak x 2 orientasi x 2 ukuran (pusat piksel -> nama kotak yang sama)', () => {
  for (const size of [320, 640, 897]) for (const o of ['white', 'black'] as const) for (const k of allKeys()) {
    const [cx, cy] = projectKey(k, o);
    assert.equal(keyFromPoint((cx / 8) * size, (cy / 8) * size, size, size, o), k, `${k} ${o} ${size}`);
  }
});

ok('keyFromPoint di luar/batas/NaN/ukuran nol', () => {
  assert.equal(keyFromPoint(0, 0, 640, 640, 'white'), 'a8');
  assert.equal(keyFromPoint(639.9, 639.9, 640, 640, 'white'), 'h1');
  assert.equal(keyFromPoint(0, 0, 640, 640, 'black'), 'h1');
  assert.equal(keyFromPoint(-1, 10, 640, 640, 'white'), null);
  assert.equal(keyFromPoint(640, 10, 640, 640, 'white'), null);
  assert.equal(keyFromPoint(10, 640, 640, 640, 'white'), null);
  assert.equal(keyFromPoint(NaN, 10, 640, 640, 'white'), null);
  assert.equal(keyFromPoint(10, 10, 0, 0, 'white'), null);
});

ok('isKnightMove', () => {
  assert.ok(isKnightMove(K('g1'), K('f3')));
  assert.ok(isKnightMove(K('a1'), K('c2')));
  assert.ok(!isKnightMove(K('a1'), K('b2')));
  assert.ok(!isKnightMove(K('a1'), K('a3')));
  assert.ok(!isKnightMove(K('e4'), K('e4')));
});

const nums = (s: string) => (s.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
const len = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

ok('panah kuda dari e4: 8 tujuan x 2 orientasi -> tekukan benar (sisi 2 dulu, lalu 1)', () => {
  const offs = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
  for (const o of ['white', 'black'] as const) for (const [df, dr] of offs) {
    const dest = K(`${FILES[4 + df]}${4 + dr}`);
    const g = arrowGeometry(K('e4'), dest, o)!;
    const p = nums(g.path); // M x y L cx cy L bx by
    assert.equal(p.length, 6, `${dest} ${o}: harus 3 titik`);
    const from = projectKey(K('e4'), o), to = projectKey(dest, o);
    assert.deepEqual([p[0], p[1]], from);
    const corner = [p[2], p[3]];
    assert.ok(Math.abs(len(from, corner) - 2) < 1e-9, `leg1=2 utk ${dest} ${o}`);
    assert.ok(Math.abs(len(corner, to) - 1) < 1e-9, `leg2=1 utk ${dest} ${o}`);
    // sudut siku: leg1 dan leg2 tegak lurus
    const v1 = [corner[0] - from[0], corner[1] - from[1]], v2 = [to[0] - corner[0], to[1] - corner[1]];
    assert.ok(Math.abs(v1[0] * v2[0] + v1[1] * v2[1]) < 1e-9, 'siku-siku');
    // garis berhenti di pangkal kepala: HEAD_LEN sebelum tujuan
    assert.ok(Math.abs(len([p[4], p[5]], to) - HEAD_LEN) < 1e-9, 'pangkal kepala');
    // ujung kepala = pusat kotak tujuan
    assert.deepEqual(nums(g.head).slice(0, 2), to);
  }
});

ok('contoh nyata g1->f3 (putih): naik 2 lalu kiri 1', () => {
  const g = arrowGeometry(K('g1'), K('f3'), 'white')!;
  assert.deepEqual(nums(g.path).slice(0, 4), [6.5, 7.5, 6.5, 5.5]);
});

ok('panah lurus/diagonal/1 kotak: 2 titik, jarak benar', () => {
  for (const [a, b] of [['e2','e4'],['a1','h8'],['b2','b3'],['h1','a1'],['d4','a7']]) {
    const g = arrowGeometry(K(a), K(b), 'white')!;
    const p = nums(g.path);
    assert.equal(p.length, 4, `${a}${b}`);
    const from = projectKey(K(a), 'white'), to = projectKey(K(b), 'white');
    assert.ok(Math.abs(len(from, [p[2], p[3]]) - (len(from, to) - HEAD_LEN)) < 1e-9);
  }
});

ok('orig === dest -> null (bukan panah)', () => { assert.equal(arrowGeometry(K('e4'), K('e4'), 'white'), null); });

ok('label koordinat: jumlah, urutan, warna latar', () => {
  for (const o of ['white', 'black'] as const) assert.equal(coordinateLabels(o).length, 16);
  const w = coordinateLabels('white');
  const ranks = w.filter((l) => l.anchor === 'start').map((l) => l.text);
  const files = w.filter((l) => l.anchor === 'end').map((l) => l.text);
  assert.deepEqual(ranks, ['8','7','6','5','4','3','2','1']);
  assert.deepEqual(files, ['a','b','c','d','e','f','g','h']);
  const byText = (arr: typeof w, t: string) => arr.find((l) => l.text === t)!;
  assert.equal(byText(w, 'a').onLight, false); // a1 gelap
  assert.equal(byText(w, 'h').onLight, true);  // h1 terang
  assert.equal(byText(w, '8').onLight, true);  // a8 terang
  assert.equal(byText(w, '1').onLight, false); // a1 gelap
  const b = coordinateLabels('black');
  assert.deepEqual(b.filter((l) => l.anchor === 'start').map((l) => l.text), ['1','2','3','4','5','6','7','8']);
  assert.deepEqual(b.filter((l) => l.anchor === 'end').map((l) => l.text), ['h','g','f','e','d','c','b','a']);
  assert.equal(byText(b, '1').onLight, true);  // h1 terang (kolom kiri = file h)
  // orientasi hitam: baris bawah layar = rank 8, jadi label 'a' ada di a8 (terang) dan 'h' di h8 (gelap)
  assert.equal(byText(b, 'a').onLight, true);
  assert.equal(byText(b, 'h').onLight, false);
  // posisi: rank di kolom kiri (x kecil), file di baris bawah (y ~ 7.9)
  assert.ok(w.filter((l) => l.anchor === 'start').every((l) => l.x < 0.2));
  assert.ok(w.filter((l) => l.anchor === 'end').every((l) => l.y > 7.8));
});

console.log(`\n${n} kelompok tes lulus`);
