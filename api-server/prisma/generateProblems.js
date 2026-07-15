/**
 * generateProblems.js
 *
 * A curated catalogue of well-known competitive-programming / interview problems
 * (the classic problem TYPES found on LeetCode, Codeforces, CSES and GeeksforGeeks),
 * written in original wording. Every test case's expected output is produced by a
 * real JavaScript reference solver that parses the exact stdin format, so a correct
 * solution in ANY supported language reproduces it byte-for-byte and is accepted.
 *
 * All outputs are integers or plain strings (no floating point) so they compare
 * identically across languages. Larger results use mod 1e9+7 and say so.
 *
 * Exports: { generatedProblems } — shaped like the entries in prisma/seed.js.
 */

'use strict';

const MOD = 1000000007n;

// ─── Deterministic RNG so generated data is stable across re-seeds ───────────
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function ri(rand, lo, hi) { return lo + Math.floor(rand() * (hi - lo + 1)); }

// ─── Parsing / math helpers used by reference solvers ────────────────────────
function lines(s) { return String(s).split('\n'); }
function toInts(line) { return String(line == null ? '' : line).trim().split(/\s+/).filter((x) => x.length).map(Number); }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

const RESERVED = new Set([
  'two-sum', 'palindrome-check', 'fibonacci-number', 'fizzbuzz', 'valid-parentheses',
  'binary-search', 'reverse-string', 'merge-two-sorted-arrays', 'longest-common-subsequence',
  'number-of-islands', 'maximum-subarray', 'climbing-stairs', 'trapping-rain-water',
  'edit-distance', 'median-of-two-sorted-arrays',
]);
const usedSlugs = new Set();
function uniqueSlug(title) { let base = slugify(title), s = base, i = 2; while (RESERVED.has(s) || usedSlugs.has(s)) s = `${base}-${i++}`; usedSlugs.add(s); return s; }

const problems = [];
function add(spec) {
  const slug = uniqueSlug(spec.title);
  const nSamples = spec.samples || 2;
  const testCases = spec.inputs.map((inp, i) => ({
    input: inp, expectedOutput: String(spec.solve(inp)), isSample: i < nSamples, orderIndex: i,
  }));
  const examples = testCases.filter((t) => t.isSample).map((t) => ({ input: t.input, output: t.expectedOutput }));
  const ex = examples[0];
  const description =
    `## ${spec.title}\n\n${spec.statement}\n\n### Input\n${spec.inFmt}\n\n### Output\n${spec.outFmt}\n\n` +
    `### Example\n\`\`\`\nInput:\n${ex.input}\n\nOutput:\n${ex.output}\n\`\`\``;
  problems.push({
    title: spec.title, slug, difficulty: spec.difficulty, rating: spec.rating,
    description, constraints: spec.constraints || 'See the problem statement for limits.',
    examples, tags: spec.tags, timeLimitMs: spec.timeLimitMs || 2000, memoryLimitMb: 256, testCases,
  });
}
const ARR = 'Line 1: N. Line 2: N space-separated integers.';

// ════════════════════════════════════════════════════════════════════════════
//  ARRAYS · TWO POINTERS · HASHING
// ════════════════════════════════════════════════════════════════════════════

add({ title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', rating: 1000, tags: ['Array', 'Dynamic Programming'],
  statement: 'You are given daily prices of a stock. Choose one day to buy and a later day to sell to maximize profit. Return the maximum profit, or 0 if no profit is possible.',
  inFmt: ARR, outFmt: 'The maximum achievable profit.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); let mn = Infinity, best = 0; for (const x of a) { mn = Math.min(mn, x); best = Math.max(best, x - mn); } return best; },
  inputs: ['6\n7 1 5 3 6 4', '5\n7 6 4 3 1', '1\n5', '4\n2 4 1 7', '3\n3 3 3', '5\n1 2 3 4 5'] });

add({ title: 'Maximum Product Subarray', difficulty: 'Medium', rating: 1400, tags: ['Array', 'Dynamic Programming'],
  statement: 'Given an integer array, find the contiguous subarray with the largest product and return that product.',
  inFmt: ARR, outFmt: 'The maximum product of a contiguous subarray.', constraints: '1 <= N <= 20000, -10 <= a[i] <= 10',
  solve: (i) => { const a = toInts(lines(i)[1]); let mx = a[0], mn = a[0], res = a[0]; for (let k = 1; k < a.length; k++) { const x = a[k]; const c1 = mx * x, c2 = mn * x; mx = Math.max(x, c1, c2); mn = Math.min(x, c1, c2); res = Math.max(res, mx); } return res; },
  inputs: ['4\n2 3 -2 4', '3\n-2 0 -1', '5\n2 -5 -2 -4 3', '1\n-3', '4\n-2 3 -4 5', '3\n0 2 0'] });

add({ title: 'Majority Element', difficulty: 'Easy', rating: 1100, tags: ['Array', 'Hash Map'],
  statement: 'An element that appears more than N/2 times is the majority element. It is guaranteed to exist. Return it.',
  inFmt: ARR, outFmt: 'The majority element.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); let c = 0, cand = null; for (const x of a) { if (c === 0) cand = x; c += x === cand ? 1 : -1; } return cand; },
  inputs: ['3\n3 2 3', '7\n2 2 1 1 1 2 2', '1\n9', '5\n4 4 4 2 4', '5\n7 7 7 7 7', '3\n1 1 2'] });

add({ title: 'Move Zeroes', difficulty: 'Easy', rating: 900, tags: ['Array', 'Two Pointers'],
  statement: 'Move all zeroes to the end of the array while keeping the relative order of the non-zero elements. Print the resulting array.',
  inFmt: ARR, outFmt: 'The array after moving zeroes to the end, space-separated.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); const nz = a.filter((x) => x !== 0); while (nz.length < a.length) nz.push(0); return nz.join(' '); },
  inputs: ['5\n0 1 0 3 12', '3\n0 0 1', '1\n0', '4\n1 2 3 4', '5\n0 0 0 0 5', '4\n4 0 5 0'] });

add({ title: 'Single Number', difficulty: 'Easy', rating: 1000, tags: ['Array', 'Bit Manipulation'],
  statement: 'Every element appears exactly twice except one that appears once. Find that single element.',
  inFmt: ARR, outFmt: 'The element that appears once.', constraints: '1 <= N <= 100000 (N is odd)',
  solve: (i) => { const a = toInts(lines(i)[1]); let x = 0; for (const v of a) x ^= v; return x; },
  inputs: ['3\n2 2 1', '5\n4 1 2 1 2', '1\n7', '5\n5 3 5 8 3', '3\n9 9 4', '7\n1 2 3 2 1 4 4'] });

add({ title: 'Missing Number', difficulty: 'Easy', rating: 1000, tags: ['Array', 'Math'],
  statement: 'The array contains N distinct numbers taken from the range 0..N with exactly one number missing. Find the missing number.',
  inFmt: ARR, outFmt: 'The missing number.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); const n = a.length; let s = n * (n + 1) / 2; for (const x of a) s -= x; return s; },
  inputs: ['3\n3 0 1', '5\n0 1 2 3 5', '1\n0', '4\n0 1 2 3', '5\n5 4 3 2 1', '2\n2 0'] });

add({ title: 'Find the Duplicate Number', difficulty: 'Medium', rating: 1300, tags: ['Array', 'Two Pointers'],
  statement: 'The array of length N+1 contains integers in the range 1..N. Exactly one value is repeated (possibly several times). Return that repeated value.',
  inFmt: ARR, outFmt: 'The repeated value.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); const seen = new Set(); for (const x of a) { if (seen.has(x)) return x; seen.add(x); } return -1; },
  inputs: ['5\n1 3 4 2 2', '5\n3 1 3 4 2', '2\n1 1', '7\n1 2 3 4 5 6 4', '4\n2 2 2 2', '6\n5 4 3 2 1 5'] });

add({ title: 'Contains Duplicate', difficulty: 'Easy', rating: 900, tags: ['Array', 'Hash Set'],
  statement: 'Determine whether any value appears at least twice in the array. Print `YES` if there is a duplicate, otherwise `NO`.',
  inFmt: ARR, outFmt: '`YES` or `NO`.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); return new Set(a).size < a.length ? 'YES' : 'NO'; },
  inputs: ['4\n1 2 3 1', '4\n1 2 3 4', '1\n5', '5\n1 1 1 1 1', '3\n7 8 9', '6\n1 2 3 4 5 3'] });

add({ title: 'Product of Array Except Self', difficulty: 'Medium', rating: 1300, tags: ['Array', 'Prefix Sum'],
  statement: 'For each index, compute the product of all other elements of the array (without using division). Print the resulting array.',
  inFmt: ARR, outFmt: 'The output array, space-separated.', constraints: '2 <= N <= 1000, values fit in 32-bit product',
  solve: (i) => { const a = toInts(lines(i)[1]); const n = a.length; const res = Array(n).fill(1); let p = 1; for (let k = 0; k < n; k++) { res[k] = p; p *= a[k]; } p = 1; for (let k = n - 1; k >= 0; k--) { res[k] *= p; p *= a[k]; } return res.join(' '); },
  inputs: ['4\n1 2 3 4', '5\n-1 1 0 -3 3', '2\n3 7', '3\n2 2 2', '4\n1 1 1 1', '3\n5 1 2'] });

add({ title: 'Rotate Array', difficulty: 'Medium', rating: 1100, tags: ['Array'],
  statement: 'Rotate the array to the right by K steps. Print the resulting array.',
  inFmt: 'Line 1: N. Line 2: N integers. Line 3: K.', outFmt: 'The rotated array, space-separated.', constraints: '1 <= N <= 100000, 0 <= K <= 10^9',
  solve: (i) => { const L = lines(i); const a = toInts(L[1]); const n = a.length; const k = ((toInts(L[2])[0] % n) + n) % n; return a.slice(n - k).concat(a.slice(0, n - k)).join(' '); },
  inputs: ['7\n1 2 3 4 5 6 7\n3', '4\n-1 -100 3 99\n2', '1\n5\n10', '5\n1 2 3 4 5\n0', '3\n1 2 3\n4', '4\n1 2 3 4\n4'] });

add({ title: 'Kth Largest Element', difficulty: 'Medium', rating: 1200, tags: ['Array', 'Sorting'],
  statement: 'Return the K-th largest element in the array (1-indexed, counting duplicates).',
  inFmt: 'Line 1: N. Line 2: N integers. Line 3: K.', outFmt: 'The K-th largest element.', constraints: '1 <= K <= N <= 100000',
  solve: (i) => { const L = lines(i); const a = toInts(L[1]).sort((x, y) => y - x); return a[toInts(L[2])[0] - 1]; },
  inputs: ['6\n3 2 1 5 6 4\n2', '9\n3 2 3 1 2 4 5 5 6\n4', '1\n1\n1', '5\n7 7 7 7 7\n3', '4\n9 1 5 3\n1', '4\n9 1 5 3\n4'] });

add({ title: 'Subarray Sum Equals K', difficulty: 'Medium', rating: 1500, tags: ['Array', 'Prefix Sum', 'Hash Map'],
  statement: 'Count the number of contiguous subarrays whose elements sum to exactly K.',
  inFmt: 'Line 1: N. Line 2: N integers. Line 3: K.', outFmt: 'The number of subarrays summing to K.', constraints: '1 <= N <= 20000',
  solve: (i) => { const L = lines(i); const a = toInts(L[1]); const k = toInts(L[2])[0]; const m = new Map([[0, 1]]); let s = 0, c = 0; for (const x of a) { s += x; c += m.get(s - k) || 0; m.set(s, (m.get(s) || 0) + 1); } return c; },
  inputs: ['3\n1 1 1\n2', '3\n1 2 3\n3', '1\n5\n5', '5\n1 -1 1 -1 1\n0', '4\n3 4 7 2\n7', '5\n0 0 0 0 0\n0'] });

add({ title: 'Minimum Size Subarray Sum', difficulty: 'Medium', rating: 1400, tags: ['Array', 'Two Pointers', 'Sliding Window'],
  statement: 'Given an array of positive integers and a target, return the length of the shortest contiguous subarray whose sum is at least the target, or 0 if none exists.',
  inFmt: 'Line 1: N. Line 2: N positive integers. Line 3: target.', outFmt: 'The minimal length, or 0.', constraints: '1 <= N <= 100000',
  solve: (i) => { const L = lines(i); const a = toInts(L[1]); const t = toInts(L[2])[0]; let l = 0, s = 0, best = Infinity; for (let r = 0; r < a.length; r++) { s += a[r]; while (s >= t) { best = Math.min(best, r - l + 1); s -= a[l++]; } } return best === Infinity ? 0 : best; },
  inputs: ['6\n2 3 1 2 4 3\n7', '4\n1 4 4 0\n4', '5\n1 1 1 1 1\n11', '3\n1 2 3\n6', '1\n5\n3', '5\n5 1 3 5 10\n8'] });

add({ title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', rating: 1400, tags: ['String', 'Sliding Window', 'Hash Set'],
  statement: 'Return the length of the longest substring that contains no repeated character.',
  inFmt: 'A single string (no spaces).', outFmt: 'The length of the longest substring without repeats.', constraints: '0 <= length <= 100000',
  solve: (i) => { const s = lines(i)[0] || ''; const last = new Map(); let l = 0, best = 0; for (let r = 0; r < s.length; r++) { const c = s[r]; if (last.has(c) && last.get(c) >= l) l = last.get(c) + 1; last.set(c, r); best = Math.max(best, r - l + 1); } return best; },
  inputs: ['abcabcbb', 'bbbbb', 'pwwkew', 'abcdef', 'dvdf', 'tmmzuxt'] });

add({ title: 'Container With Most Water', difficulty: 'Medium', rating: 1300, tags: ['Array', 'Two Pointers', 'Greedy'],
  statement: 'Each element is the height of a vertical line at that index. Pick two lines that together with the x-axis form a container holding the most water. Return the maximum area.',
  inFmt: ARR, outFmt: 'The maximum water area.', constraints: '2 <= N <= 100000',
  solve: (i) => { const h = toInts(lines(i)[1]); let l = 0, r = h.length - 1, best = 0; while (l < r) { best = Math.max(best, (r - l) * Math.min(h[l], h[r])); if (h[l] < h[r]) l++; else r--; } return best; },
  inputs: ['9\n1 8 6 2 5 4 8 3 7', '2\n1 1', '5\n1 2 3 4 5', '4\n4 3 2 1', '3\n2 3 4', '6\n1 2 4 3 5 2'] });

add({ title: 'Count Triplets With Zero Sum', difficulty: 'Medium', rating: 1400, tags: ['Array', 'Two Pointers'],
  statement: 'Count the number of index triplets (i, j, k) with i < j < k such that a[i] + a[j] + a[k] = 0.',
  inFmt: ARR, outFmt: 'The number of such triplets.', constraints: '3 <= N <= 500',
  solve: (i) => { const a = toInts(lines(i)[1]); let c = 0; for (let x = 0; x < a.length; x++) for (let y = x + 1; y < a.length; y++) for (let z = y + 1; z < a.length; z++) if (a[x] + a[y] + a[z] === 0) c++; return c; },
  inputs: ['6\n-1 0 1 2 -1 -4', '3\n0 0 0', '4\n1 2 3 4', '5\n-2 0 1 1 2', '3\n1 -1 0', '6\n0 0 0 0 0 0'] });

add({ title: 'Sort Colors', difficulty: 'Medium', rating: 1100, tags: ['Array', 'Two Pointers', 'Sorting'],
  statement: 'The array contains only the values 0, 1 and 2. Sort it in non-decreasing order and print it.',
  inFmt: ARR, outFmt: 'The sorted array, space-separated.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); const c = [0, 0, 0]; for (const x of a) c[x]++; const out = []; for (let v = 0; v < 3; v++) for (let k = 0; k < c[v]; k++) out.push(v); return out.join(' '); },
  inputs: ['6\n2 0 2 1 1 0', '3\n2 0 1', '1\n0', '4\n1 1 1 1', '5\n2 2 2 2 2', '5\n0 1 2 1 0'] });

add({ title: 'Merge Intervals', difficulty: 'Medium', rating: 1400, tags: ['Array', 'Sorting', 'Intervals'],
  statement: 'Given a set of intervals, merge all overlapping intervals. Print the merged intervals sorted by start, one per line as `start end`.',
  inFmt: 'Line 1: N. Next N lines: two integers `l r` per interval.', outFmt: 'Merged intervals, one `l r` per line.', constraints: '1 <= N <= 10000',
  solve: (i) => { const L = lines(i); const n = toInts(L[0])[0]; const iv = []; for (let k = 1; k <= n; k++) iv.push(toInts(L[k])); iv.sort((a, b) => a[0] - b[0]); const res = []; for (const [l, r] of iv) { if (res.length && l <= res[res.length - 1][1]) res[res.length - 1][1] = Math.max(res[res.length - 1][1], r); else res.push([l, r]); } return res.map((p) => `${p[0]} ${p[1]}`).join('\n'); },
  inputs: ['4\n1 3\n2 6\n8 10\n15 18', '2\n1 4\n4 5', '1\n5 7', '3\n1 4\n2 3\n5 6', '2\n1 10\n2 3', '3\n1 2\n3 4\n5 6'] });

add({ title: 'Non-overlapping Intervals', difficulty: 'Medium', rating: 1500, tags: ['Array', 'Greedy', 'Intervals'],
  statement: 'Given N intervals, return the minimum number of intervals you must remove so that the rest are pairwise non-overlapping (touching endpoints do not count as overlap).',
  inFmt: 'Line 1: N. Next N lines: `l r`.', outFmt: 'The minimum number of removals.', constraints: '1 <= N <= 100000',
  solve: (i) => { const L = lines(i); const n = toInts(L[0])[0]; const iv = []; for (let k = 1; k <= n; k++) iv.push(toInts(L[k])); iv.sort((a, b) => a[1] - b[1]); let end = -Infinity, keep = 0; for (const [l, r] of iv) { if (l >= end) { keep++; end = r; } } return n - keep; },
  inputs: ['4\n1 2\n2 3\n3 4\n1 3', '3\n1 2\n1 2\n1 2', '2\n1 2\n2 3', '1\n5 9', '4\n1 100\n11 22\n1 11\n2 12', '3\n1 5\n2 3\n4 6'] });

add({ title: 'Max Consecutive Ones', difficulty: 'Easy', rating: 900, tags: ['Array'],
  statement: 'The array contains only 0s and 1s. Return the length of the longest run of consecutive 1s.',
  inFmt: ARR, outFmt: 'The longest run of 1s.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); let c = 0, best = 0; for (const x of a) { c = x === 1 ? c + 1 : 0; best = Math.max(best, c); } return best; },
  inputs: ['6\n1 1 0 1 1 1', '3\n0 0 0', '1\n1', '5\n1 1 1 1 1', '4\n1 0 1 1', '6\n0 1 0 1 0 1'] });

add({ title: 'Longest Consecutive Sequence', difficulty: 'Medium', rating: 1500, tags: ['Array', 'Hash Set'],
  statement: 'Return the length of the longest run of consecutive integers (in value) present in the array. The array is not sorted.',
  inFmt: ARR, outFmt: 'The length of the longest consecutive run.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); const s = new Set(a); let best = 0; for (const x of s) { if (!s.has(x - 1)) { let y = x, len = 1; while (s.has(y + 1)) { y++; len++; } best = Math.max(best, len); } } return best; },
  inputs: ['6\n100 4 200 1 3 2', '8\n0 3 7 2 5 8 4 6', '1\n5', '5\n1 2 0 1 2', '4\n9 1 4 7', '5\n5 4 3 2 1'] });

add({ title: 'Leaders in an Array', difficulty: 'Easy', rating: 1100, tags: ['Array'],
  statement: 'An element is a leader if it is strictly greater than every element to its right. The rightmost element is always a leader. Print all leaders in their original order.',
  inFmt: ARR, outFmt: 'The leaders, space-separated, left to right.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); let mx = -Infinity; const res = []; for (let k = a.length - 1; k >= 0; k--) { if (a[k] > mx) { res.push(a[k]); mx = a[k]; } } return res.reverse().join(' '); },
  inputs: ['6\n16 17 4 3 5 2', '5\n1 2 3 4 0', '1\n7', '4\n5 5 5 5', '3\n3 2 1', '5\n7 4 5 7 3'] });

add({ title: 'Equilibrium Index', difficulty: 'Easy', rating: 1100, tags: ['Array', 'Prefix Sum'],
  statement: 'Return the smallest index i such that the sum of elements before i equals the sum of elements after i. If none exists, print -1.',
  inFmt: ARR, outFmt: 'The equilibrium index (0-based) or -1.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); const total = a.reduce((x, y) => x + y, 0); let left = 0; for (let k = 0; k < a.length; k++) { if (left === total - left - a[k]) return k; left += a[k]; } return -1; },
  inputs: ['5\n1 3 5 2 2', '3\n1 2 3', '1\n0', '7\n-7 1 5 2 -4 3 0', '4\n1 1 1 1', '5\n2 0 2 0 4'] });

add({ title: 'Gas Station', difficulty: 'Medium', rating: 1500, tags: ['Array', 'Greedy'],
  statement: 'There are N gas stations in a circle. gas[i] is the fuel available and cost[i] the fuel needed to travel to the next station. Return the starting index from which you can complete the circuit, or -1 if impossible. If several work, return the smallest such index.',
  inFmt: 'Line 1: N. Line 2: gas array. Line 3: cost array.', outFmt: 'The starting index, or -1.', constraints: '1 <= N <= 100000',
  solve: (i) => { const L = lines(i); const g = toInts(L[1]), c = toInts(L[2]); const n = g.length; let total = 0, tank = 0, start = 0; for (let k = 0; k < n; k++) { const d = g[k] - c[k]; total += d; tank += d; if (tank < 0) { start = k + 1; tank = 0; } } return total >= 0 ? start : -1; },
  inputs: ['5\n1 2 3 4 5\n3 4 5 1 2', '3\n2 3 4\n3 4 3', '1\n5\n4', '4\n5 1 2 3\n4 4 1 5', '2\n3 3\n3 3', '3\n1 1 1\n2 2 2'] });

add({ title: 'Search in Rotated Sorted Array', difficulty: 'Medium', rating: 1400, tags: ['Array', 'Binary Search'],
  statement: 'A sorted array of distinct integers has been rotated at some pivot. Given a target, return its index, or -1 if it is not present.',
  inFmt: 'Line 1: N. Line 2: rotated sorted array. Line 3: target.', outFmt: 'The index of target, or -1.', constraints: '1 <= N <= 100000',
  solve: (i) => { const L = lines(i); const a = toInts(L[1]); const t = toInts(L[2])[0]; const idx = a.indexOf(t); return idx; },
  inputs: ['7\n4 5 6 7 0 1 2\n0', '7\n4 5 6 7 0 1 2\n3', '1\n1\n1', '5\n3 4 5 1 2\n1', '4\n5 1 2 3\n5', '6\n6 7 8 1 2 3\n8'] });

add({ title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', rating: 1300, tags: ['Array', 'Binary Search'],
  statement: 'A sorted array of distinct integers has been rotated. Return its minimum element.',
  inFmt: ARR, outFmt: 'The minimum element.', constraints: '1 <= N <= 100000',
  solve: (i) => Math.min(...toInts(lines(i)[1])),
  inputs: ['5\n3 4 5 1 2', '7\n4 5 6 7 0 1 2', '1\n1', '4\n1 2 3 4', '3\n2 3 1', '6\n5 6 7 8 9 4'] });

add({ title: 'Search Insert Position', difficulty: 'Easy', rating: 1000, tags: ['Array', 'Binary Search'],
  statement: 'Given a sorted array of distinct integers and a target, return the index where it is, or the index where it would be inserted to keep the array sorted.',
  inFmt: 'Line 1: N. Line 2: sorted array. Line 3: target.', outFmt: 'The insert position (0-based).', constraints: '1 <= N <= 100000',
  solve: (i) => { const L = lines(i); const a = toInts(L[1]); const t = toInts(L[2])[0]; let p = 0; while (p < a.length && a[p] < t) p++; return p; },
  inputs: ['4\n1 3 5 6\n5', '4\n1 3 5 6\n2', '4\n1 3 5 6\n7', '4\n1 3 5 6\n0', '1\n5\n5', '3\n2 4 6\n3'] });

add({ title: 'First and Last Position', difficulty: 'Medium', rating: 1200, tags: ['Array', 'Binary Search'],
  statement: 'Given a sorted array and a target value, print the index of its first and last occurrence. If it is absent, print `-1 -1`.',
  inFmt: 'Line 1: N. Line 2: sorted array. Line 3: target.', outFmt: 'Two integers: first and last index (or -1 -1).', constraints: '1 <= N <= 100000',
  solve: (i) => { const L = lines(i); const a = toInts(L[1]); const t = toInts(L[2])[0]; const f = a.indexOf(t), l = a.lastIndexOf(t); return `${f} ${l}`; },
  inputs: ['6\n5 7 7 8 8 10\n8', '6\n5 7 7 8 8 10\n6', '1\n1\n1', '5\n2 2 2 2 2\n2', '4\n1 2 3 4\n4', '3\n1 2 3\n0'] });

add({ title: 'Squares of a Sorted Array', difficulty: 'Easy', rating: 1000, tags: ['Array', 'Two Pointers', 'Sorting'],
  statement: 'Given a sorted array (which may contain negatives), return the squares of each number sorted in non-decreasing order.',
  inFmt: ARR, outFmt: 'The sorted squares, space-separated.', constraints: '1 <= N <= 100000',
  solve: (i) => toInts(lines(i)[1]).map((x) => x * x).sort((a, b) => a - b).join(' '),
  inputs: ['5\n-4 -1 0 3 10', '5\n-7 -3 2 3 11', '1\n-2', '3\n1 2 3', '4\n-4 -3 -2 -1', '3\n0 0 0'] });

add({ title: 'Pascal Triangle Row', difficulty: 'Easy', rating: 1100, tags: ['Math', 'Dynamic Programming'],
  statement: 'Print the N-th row (0-indexed) of Pascal\'s triangle. Row 0 is `1`.',
  inFmt: 'A single integer N.', outFmt: 'The row, space-separated.', constraints: '0 <= N <= 33',
  solve: (i) => { const n = toInts(i)[0]; let row = [1n]; for (let k = 1; k <= n; k++) { const nx = [1n]; for (let j = 1; j < k; j++) nx.push(row[j - 1] + row[j]); nx.push(1n); row = nx; } return row.map(String).join(' '); },
  inputs: ['3', '0', '1', '5', '10', '4'] });

// ════════════════════════════════════════════════════════════════════════════
//  STRINGS
// ════════════════════════════════════════════════════════════════════════════

add({ title: 'Valid Palindrome', difficulty: 'Easy', rating: 1000, tags: ['String', 'Two Pointers'],
  statement: 'Considering only alphanumeric characters and ignoring case, determine whether the line reads the same forwards and backwards. Print `YES` or `NO`.',
  inFmt: 'A single line that may contain spaces and punctuation.', outFmt: '`YES` or `NO`.', constraints: '1 <= length <= 100000',
  solve: (i) => { const s = (lines(i)[0] || '').toLowerCase().replace(/[^a-z0-9]/g, ''); return s === s.split('').reverse().join('') ? 'YES' : 'NO'; },
  inputs: ['A man, a plan, a canal: Panama', 'race a car', 'ab', 'Was it a car or a cat I saw', 'No lemon, no melon', 'hello'] });

add({ title: 'Longest Palindromic Substring', difficulty: 'Medium', rating: 1400, tags: ['String', 'Dynamic Programming'],
  statement: 'Return the length of the longest contiguous substring that is a palindrome.',
  inFmt: 'A single string (no spaces).', outFmt: 'The length of the longest palindromic substring.', constraints: '1 <= length <= 2000',
  solve: (i) => { const s = lines(i)[0] || ''; let best = 0; const exp = (l, r) => { while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; } return r - l - 1; }; for (let k = 0; k < s.length; k++) { best = Math.max(best, exp(k, k), exp(k, k + 1)); } return best; },
  inputs: ['babad', 'cbbd', 'a', 'forgeeksskeegfor', 'abcde', 'aaaa'] });

add({ title: 'Longest Common Prefix', difficulty: 'Easy', rating: 1000, tags: ['String'],
  statement: 'Return the longest common prefix shared by all the given strings. If there is none, print an empty line.',
  inFmt: 'Line 1: N. Next N lines: one string each.', outFmt: 'The longest common prefix.', constraints: '1 <= N <= 200',
  solve: (i) => { const L = lines(i); const n = toInts(L[0])[0]; const ws = []; for (let k = 1; k <= n; k++) ws.push(L[k] || ''); let p = ws[0]; for (let k = 1; k < n; k++) { while (ws[k].indexOf(p) !== 0) p = p.slice(0, -1); } return p; },
  inputs: ['3\nflower\nflow\nflight', '3\ndog\nracecar\ncar', '1\nhello', '2\nabcd\nabce', '3\ninter\ninternal\ninternet', '2\nsame\nsame'] });

add({ title: 'Implement strStr', difficulty: 'Easy', rating: 1100, tags: ['String'],
  statement: 'Return the index of the first occurrence of the needle in the haystack, or -1 if the needle is not part of the haystack.',
  inFmt: 'Line 1: haystack. Line 2: needle.', outFmt: 'The index of the first match, or -1.', constraints: '0 <= lengths <= 100000',
  solve: (i) => { const L = lines(i); return (L[0] || '').indexOf(L[1] || ''); },
  inputs: ['sadbutsad\nsad', 'leetcode\nleeto', 'hello\nll', 'aaa\nbbb', 'abc\nc', 'mississippi\nissip'] });

add({ title: 'Reverse Words in a String', difficulty: 'Medium', rating: 1200, tags: ['String'],
  statement: 'Reverse the order of words in the line. Words are separated by one or more spaces; collapse them to a single space and trim the result.',
  inFmt: 'A single line.', outFmt: 'The words in reverse order, single-spaced.', constraints: '1 <= length <= 100000',
  solve: (i) => { const t = (lines(i)[0] || '').trim(); if (!t) return ''; return t.split(/\s+/).reverse().join(' '); },
  inputs: ['the sky is blue', 'hello world', 'a', 'code arena judge system', 'one two', 'x y z'] });

add({ title: 'Roman to Integer', difficulty: 'Easy', rating: 1100, tags: ['String', 'Math'],
  statement: 'Convert a Roman numeral to its integer value.',
  inFmt: 'A Roman numeral string (I, V, X, L, C, D, M).', outFmt: 'The integer value.', constraints: '1 <= value <= 3999',
  solve: (i) => { const s = lines(i)[0]; const m = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }; let t = 0; for (let k = 0; k < s.length; k++) { if (k + 1 < s.length && m[s[k]] < m[s[k + 1]]) t -= m[s[k]]; else t += m[s[k]]; } return t; },
  inputs: ['III', 'LVIII', 'MCMXCIV', 'IV', 'IX', 'XLII'] });

add({ title: 'Integer to Roman', difficulty: 'Medium', rating: 1200, tags: ['String', 'Math'],
  statement: 'Convert an integer to its Roman numeral representation.',
  inFmt: 'A single integer N.', outFmt: 'The Roman numeral.', constraints: '1 <= N <= 3999',
  solve: (i) => { let n = toInts(i)[0]; const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]; const sym = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']; let r = ''; for (let k = 0; k < val.length; k++) { while (n >= val[k]) { r += sym[k]; n -= val[k]; } } return r; },
  inputs: ['3', '58', '1994', '4', '9', '3999'] });

add({ title: 'Excel Column Title', difficulty: 'Easy', rating: 1200, tags: ['String', 'Math'],
  statement: 'Given a positive integer, return its corresponding column title as it appears in a spreadsheet (1 → A, 2 → B, …, 27 → AA).',
  inFmt: 'A single integer N.', outFmt: 'The column title.', constraints: '1 <= N <= 2000000000',
  solve: (i) => { let n = toInts(i)[0]; let s = ''; while (n > 0) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); } return s; },
  inputs: ['1', '28', '701', '26', '27', '702'] });

add({ title: 'Excel Column Number', difficulty: 'Easy', rating: 1100, tags: ['String', 'Math'],
  statement: 'Given a spreadsheet column title (like `A`, `Z`, `AA`), return its corresponding column number.',
  inFmt: 'A column title (uppercase letters).', outFmt: 'The column number.', constraints: '1 <= length <= 7',
  solve: (i) => { const s = lines(i)[0]; let n = 0; for (const c of s) n = n * 26 + (c.charCodeAt(0) - 64); return n; },
  inputs: ['A', 'AB', 'ZY', 'Z', 'AA', 'BA'] });

add({ title: 'Add Binary', difficulty: 'Easy', rating: 1100, tags: ['String', 'Math', 'Bit Manipulation'],
  statement: 'Given two binary strings, return their sum as a binary string.',
  inFmt: 'Line 1: first binary string. Line 2: second binary string.', outFmt: 'The sum in binary.', constraints: '1 <= length <= 10000',
  solve: (i) => { const L = lines(i); return (BigInt('0b' + L[0]) + BigInt('0b' + L[1])).toString(2); },
  inputs: ['11\n1', '1010\n1011', '0\n0', '1\n111', '1111\n1', '100\n110'] });

add({ title: 'Add Strings', difficulty: 'Easy', rating: 1100, tags: ['String', 'Math'],
  statement: 'Given two non-negative integers represented as strings, return their sum as a string (do not use built-in big-integer parsing in your own solution).',
  inFmt: 'Line 1: first number. Line 2: second number.', outFmt: 'The sum as a decimal string.', constraints: '1 <= length <= 10000',
  solve: (i) => { const L = lines(i); return (BigInt(L[0]) + BigInt(L[1])).toString(); },
  inputs: ['11\n123', '456\n77', '0\n0', '999\n1', '12345678901234567890\n98765432109876543210', '5\n5'] });

add({ title: 'Multiply Strings', difficulty: 'Medium', rating: 1400, tags: ['String', 'Math'],
  statement: 'Given two non-negative integers represented as strings, return their product as a string.',
  inFmt: 'Line 1: first number. Line 2: second number.', outFmt: 'The product as a decimal string.', constraints: '1 <= length <= 200',
  solve: (i) => { const L = lines(i); return (BigInt(L[0]) * BigInt(L[1])).toString(); },
  inputs: ['2\n3', '123\n456', '0\n52', '99\n99', '11\n11', '100\n100'] });

add({ title: 'Count and Say', difficulty: 'Medium', rating: 1300, tags: ['String', 'Simulation'],
  statement: 'The count-and-say sequence starts with `1`. Each next term describes the previous one by reading off runs of digits (e.g. `21` is read as "one 2, one 1" → `1211`). Return the N-th term.',
  inFmt: 'A single integer N.', outFmt: 'The N-th term of the sequence.', constraints: '1 <= N <= 30',
  solve: (i) => { let n = toInts(i)[0], s = '1'; for (let k = 1; k < n; k++) { let t = '', j = 0; while (j < s.length) { let c = 1; while (j + 1 < s.length && s[j + 1] === s[j]) { j++; c++; } t += c + s[j]; j++; } s = t; } return s; },
  inputs: ['1', '4', '2', '5', '6', '3'] });

add({ title: 'Isomorphic Strings', difficulty: 'Easy', rating: 1200, tags: ['String', 'Hash Map'],
  statement: 'Two strings are isomorphic if the characters of the first can be consistently replaced to obtain the second (a one-to-one mapping). Print `YES` or `NO`.',
  inFmt: 'Line 1: first string. Line 2: second string.', outFmt: '`YES` or `NO`.', constraints: '1 <= length <= 100000',
  solve: (i) => { const L = lines(i); const a = L[0] || '', b = L[1] || ''; if (a.length !== b.length) return 'NO'; const m1 = {}, m2 = {}; for (let k = 0; k < a.length; k++) { if (m1[a[k]] === undefined && m2[b[k]] === undefined) { m1[a[k]] = b[k]; m2[b[k]] = a[k]; } else if (m1[a[k]] !== b[k] || m2[b[k]] !== a[k]) return 'NO'; } return 'YES'; },
  inputs: ['egg\nadd', 'foo\nbar', 'paper\ntitle', 'ab\naa', 'abc\nxyz', 'badc\nbaba'] });

add({ title: 'Group Anagrams Count', difficulty: 'Medium', rating: 1300, tags: ['String', 'Hash Map', 'Sorting'],
  statement: 'Given N words, group the anagrams together. Return the number of distinct groups.',
  inFmt: 'Line 1: N. Next N lines: one word each.', outFmt: 'The number of anagram groups.', constraints: '1 <= N <= 10000',
  solve: (i) => { const L = lines(i); const n = toInts(L[0])[0]; const set = new Set(); for (let k = 1; k <= n; k++) set.add((L[k] || '').split('').sort().join('')); return set.size; },
  inputs: ['6\neat\ntea\ntan\nate\nnat\nbat', '1\na', '3\nabc\nbca\ncab', '2\nxy\nyx', '3\ncat\ndog\nbird', '4\nlisten\nsilent\nenlist\ngoogle'] });

add({ title: 'Ransom Note', difficulty: 'Easy', rating: 1000, tags: ['String', 'Hash Map'],
  statement: 'Given a ransom note and a magazine string, determine whether the note can be built using the letters of the magazine (each magazine letter used at most once). Print `YES` or `NO`.',
  inFmt: 'Line 1: ransom note. Line 2: magazine.', outFmt: '`YES` or `NO`.', constraints: '1 <= lengths <= 100000',
  solve: (i) => { const L = lines(i); const note = L[0] || '', mag = L[1] || ''; const cnt = {}; for (const c of mag) cnt[c] = (cnt[c] || 0) + 1; for (const c of note) { if (!cnt[c]) return 'NO'; cnt[c]--; } return 'YES'; },
  inputs: ['a\nb', 'aa\nab', 'aa\naab', 'abc\ncba', 'hello\nolleh', 'xx\nx'] });

add({ title: 'Length of Last Word', difficulty: 'Easy', rating: 800, tags: ['String'],
  statement: 'Return the length of the last word in the line. A word is a maximal sequence of non-space characters.',
  inFmt: 'A single line (may have trailing spaces).', outFmt: 'The length of the last word.', constraints: '1 <= length <= 100000',
  solve: (i) => { const t = (lines(i)[0] || '').trim(); if (!t) return 0; const parts = t.split(/\s+/); return parts[parts.length - 1].length; },
  inputs: ['Hello World', '   fly me   to   the moon  ', 'luffy is still joyboy', 'a', 'code', 'one two three'] });

add({ title: 'Minimum Add to Make Parentheses Valid', difficulty: 'Medium', rating: 1200, tags: ['String', 'Stack', 'Greedy'],
  statement: 'Given a string of `(` and `)`, return the minimum number of parentheses to add to make it valid.',
  inFmt: 'A string of parentheses.', outFmt: 'The minimum insertions needed.', constraints: '1 <= length <= 100000',
  solve: (i) => { const s = lines(i)[0] || ''; let open = 0, add = 0; for (const c of s) { if (c === '(') open++; else { if (open > 0) open--; else add++; } } return add + open; },
  inputs: ['())', '(((', '()', '()))((', '(', '))(('] });

add({ title: 'Reverse Integer', difficulty: 'Medium', rating: 1200, tags: ['Math'],
  statement: 'Reverse the digits of a signed 32-bit integer. If the reversed value overflows the 32-bit signed range, output 0.',
  inFmt: 'A single integer N.', outFmt: 'The reversed integer, or 0 on overflow.', constraints: '-2^31 <= N <= 2^31 - 1',
  solve: (i) => { const n = toInts(i)[0]; const sign = n < 0 ? -1 : 1; const r = sign * parseInt(String(Math.abs(n)).split('').reverse().join(''), 10); return (r < -2147483648 || r > 2147483647) ? 0 : r; },
  inputs: ['123', '-123', '120', '0', '1534236469', '-2147483412'] });

// ════════════════════════════════════════════════════════════════════════════
//  DYNAMIC PROGRAMMING
// ════════════════════════════════════════════════════════════════════════════

add({ title: 'Coin Change', difficulty: 'Medium', rating: 1500, tags: ['Dynamic Programming'],
  statement: 'Given coin denominations and a target amount, return the minimum number of coins needed to make the amount, or -1 if it cannot be made. You have an unlimited supply of each coin.',
  inFmt: 'Line 1: number of coin types M. Line 2: M denominations. Line 3: amount.', outFmt: 'Minimum coins, or -1.', constraints: '1 <= M <= 20, 0 <= amount <= 10000',
  solve: (i) => { const L = lines(i); const coins = toInts(L[1]); const amt = toInts(L[2])[0]; const dp = Array(amt + 1).fill(Infinity); dp[0] = 0; for (let a = 1; a <= amt; a++) for (const c of coins) if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1); return dp[amt] === Infinity ? -1 : dp[amt]; },
  inputs: ['3\n1 2 5\n11', '1\n2\n3', '1\n1\n0', '3\n2 5 10\n27', '2\n3 7\n5', '4\n1 5 6 9\n11'] });

add({ title: 'Coin Change Ways', difficulty: 'Medium', rating: 1500, tags: ['Dynamic Programming'],
  statement: 'Given coin denominations and a target amount, return the number of distinct combinations of coins that sum to the amount (order does not matter). Unlimited supply of each coin.',
  inFmt: 'Line 1: M. Line 2: M denominations. Line 3: amount.', outFmt: 'The number of combinations.', constraints: '1 <= M <= 20, 0 <= amount <= 5000',
  solve: (i) => { const L = lines(i); const coins = toInts(L[1]); const amt = toInts(L[2])[0]; const dp = Array(amt + 1).fill(0); dp[0] = 1; for (const c of coins) for (let a = c; a <= amt; a++) dp[a] += dp[a - c]; return dp[amt]; },
  inputs: ['3\n1 2 5\n5', '1\n2\n3', '1\n10\n10', '2\n2 3\n7', '3\n1 2 3\n4', '2\n5 10\n20'] });

add({ title: 'House Robber', difficulty: 'Medium', rating: 1300, tags: ['Dynamic Programming'],
  statement: 'Each house holds some money, but you cannot rob two adjacent houses. Return the maximum amount you can rob.',
  inFmt: ARR, outFmt: 'The maximum money.', constraints: '1 <= N <= 100000, 0 <= a[i] <= 10000',
  solve: (i) => { const a = toInts(lines(i)[1]); let prev = 0, cur = 0; for (const x of a) { const t = Math.max(cur, prev + x); prev = cur; cur = t; } return cur; },
  inputs: ['4\n1 2 3 1', '5\n2 7 9 3 1', '1\n5', '3\n2 1 4', '4\n5 5 5 5', '6\n6 7 1 30 8 2'] });

add({ title: 'House Robber Circular', difficulty: 'Medium', rating: 1500, tags: ['Dynamic Programming'],
  statement: 'The houses are arranged in a circle, so the first and last are adjacent. You cannot rob two adjacent houses. Return the maximum you can rob.',
  inFmt: ARR, outFmt: 'The maximum money.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); if (a.length === 1) return a[0]; const rob = (arr) => { let p = 0, c = 0; for (const x of arr) { const t = Math.max(c, p + x); p = c; c = t; } return c; }; return Math.max(rob(a.slice(1)), rob(a.slice(0, -1))); },
  inputs: ['3\n2 3 2', '4\n1 2 3 1', '1\n5', '5\n200 3 140 20 10', '2\n1 2', '4\n5 5 5 5'] });

add({ title: 'Longest Increasing Subsequence', difficulty: 'Medium', rating: 1500, tags: ['Dynamic Programming', 'Binary Search'],
  statement: 'Return the length of the longest strictly increasing subsequence of the array.',
  inFmt: ARR, outFmt: 'The length of the LIS.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); const tails = []; for (const x of a) { let lo = 0, hi = tails.length; while (lo < hi) { const m = (lo + hi) >> 1; if (tails[m] < x) lo = m + 1; else hi = m; } tails[lo] = x; } return tails.length; },
  inputs: ['8\n10 9 2 5 3 7 101 18', '6\n0 1 0 3 2 3', '7\n7 7 7 7 7 7 7', '1\n5', '5\n1 2 3 4 5', '5\n5 4 3 2 1'] });

add({ title: 'Partition Equal Subset Sum', difficulty: 'Medium', rating: 1600, tags: ['Dynamic Programming'],
  statement: 'Determine whether the array can be split into two subsets with equal sums. Print `YES` or `NO`.',
  inFmt: ARR, outFmt: '`YES` or `NO`.', constraints: '1 <= N <= 200, 1 <= a[i] <= 100',
  solve: (i) => { const a = toInts(lines(i)[1]); const s = a.reduce((x, y) => x + y, 0); if (s % 2) return 'NO'; const t = s / 2; const dp = new Uint8Array(t + 1); dp[0] = 1; for (const x of a) for (let j = t; j >= x; j--) if (dp[j - x]) dp[j] = 1; return dp[t] ? 'YES' : 'NO'; },
  inputs: ['4\n1 5 11 5', '4\n1 2 3 5', '1\n2', '6\n1 2 3 4 5 6', '2\n1 1', '3\n2 2 2'] });

add({ title: '0/1 Knapsack', difficulty: 'Medium', rating: 1600, tags: ['Dynamic Programming'],
  statement: 'Given N items with weights and values and a knapsack of capacity W, maximize the total value of items chosen without exceeding the capacity. Each item may be taken at most once.',
  inFmt: 'Line 1: N W. Line 2: N weights. Line 3: N values.', outFmt: 'The maximum total value.', constraints: '1 <= N <= 500, 1 <= W <= 5000',
  solve: (i) => { const L = lines(i); const [n, W] = toInts(L[0]); const wt = toInts(L[1]), val = toInts(L[2]); const dp = Array(W + 1).fill(0); for (let k = 0; k < n; k++) for (let c = W; c >= wt[k]; c--) dp[c] = Math.max(dp[c], dp[c - wt[k]] + val[k]); return dp[W]; },
  inputs: ['3 4\n1 3 4\n15 20 30', '3 50\n10 20 30\n60 100 120', '1 1\n2\n5', '4 10\n5 4 6 3\n10 40 30 50', '2 3\n4 5\n1 2', '3 6\n1 2 3\n6 10 12'] });

add({ title: 'Unique Paths', difficulty: 'Medium', rating: 1300, tags: ['Dynamic Programming', 'Math'],
  statement: 'A robot at the top-left of an M×N grid can move only right or down. Return the number of distinct paths to the bottom-right corner.',
  inFmt: 'Two integers M and N on one line.', outFmt: 'The number of paths.', constraints: '1 <= M, N <= 100',
  solve: (i) => { const [m, n] = toInts(i); const dp = Array(n).fill(1n); for (let r = 1; r < m; r++) for (let c = 1; c < n; c++) dp[c] += dp[c - 1]; return dp[n - 1].toString(); },
  inputs: ['3 7', '3 2', '1 1', '3 3', '10 10', '2 2'] });

add({ title: 'Unique Paths With Obstacles', difficulty: 'Medium', rating: 1400, tags: ['Dynamic Programming'],
  statement: 'A robot moves right or down through a grid. Cells with 1 are blocked, 0 are free. Return the number of distinct paths from the top-left to the bottom-right (0 if blocked at start/end).',
  inFmt: 'Line 1: M N. Next M lines: N values (0 or 1).', outFmt: 'The number of paths.', constraints: '1 <= M, N <= 100',
  solve: (i) => { const L = lines(i); const [m, n] = toInts(L[0]); const g = []; for (let r = 0; r < m; r++) g.push(toInts(L[1 + r])); const dp = Array(n).fill(0n); dp[0] = g[0][0] === 1 ? 0n : 1n; for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) { if (g[r][c] === 1) { dp[c] = 0n; } else if (c > 0) dp[c] += dp[c - 1]; } return dp[n - 1].toString(); },
  inputs: ['3 3\n0 0 0\n0 1 0\n0 0 0', '2 2\n0 1\n0 0', '1 1\n0', '1 1\n1', '3 3\n0 0 0\n0 0 0\n0 0 0', '2 2\n1 0\n0 0'] });

add({ title: 'Minimum Path Sum', difficulty: 'Medium', rating: 1400, tags: ['Dynamic Programming'],
  statement: 'Given an M×N grid of non-negative numbers, find a path from the top-left to the bottom-right that minimizes the sum of numbers along it (moving only right or down). Return that minimum sum.',
  inFmt: 'Line 1: M N. Next M lines: N integers.', outFmt: 'The minimum path sum.', constraints: '1 <= M, N <= 200',
  solve: (i) => { const L = lines(i); const [m, n] = toInts(L[0]); const g = []; for (let r = 0; r < m; r++) g.push(toInts(L[1 + r])); const dp = Array(n).fill(Infinity); dp[0] = 0; for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) { const up = dp[c]; const left = c > 0 ? dp[c - 1] : Infinity; dp[c] = g[r][c] + (r === 0 && c === 0 ? 0 : Math.min(up, left)); } return dp[n - 1]; },
  inputs: ['3 3\n1 3 1\n1 5 1\n4 2 1', '2 3\n1 2 3\n4 5 6', '1 1\n5', '1 4\n1 2 3 4', '4 1\n1 2 3 4', '2 2\n1 2\n1 1'] });

add({ title: 'Triangle Minimum Path', difficulty: 'Medium', rating: 1400, tags: ['Dynamic Programming'],
  statement: 'Given a triangle of numbers, find the minimum path sum from top to bottom. From a number you may move to one of the two adjacent numbers on the row below.',
  inFmt: 'Line 1: number of rows R. Next R lines: row i has i integers.', outFmt: 'The minimum top-to-bottom path sum.', constraints: '1 <= R <= 200',
  solve: (i) => { const L = lines(i); const r = toInts(L[0])[0]; const tri = []; for (let k = 1; k <= r; k++) tri.push(toInts(L[k])); const dp = tri[r - 1].slice(); for (let row = r - 2; row >= 0; row--) for (let c = 0; c <= row; c++) dp[c] = tri[row][c] + Math.min(dp[c], dp[c + 1]); return dp[0]; },
  inputs: ['4\n2\n3 4\n6 5 7\n4 1 8 3', '1\n-10', '2\n1\n2 3', '3\n1\n2 3\n4 5 6', '3\n5\n1 1\n1 1 1', '2\n7\n3 8'] });

add({ title: 'Jump Game', difficulty: 'Medium', rating: 1400, tags: ['Array', 'Greedy', 'Dynamic Programming'],
  statement: 'Each element is the maximum jump length from that position. Starting at index 0, determine whether you can reach the last index. Print `YES` or `NO`.',
  inFmt: ARR, outFmt: '`YES` or `NO`.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); let reach = 0; for (let k = 0; k < a.length; k++) { if (k > reach) return 'NO'; reach = Math.max(reach, k + a[k]); } return 'YES'; },
  inputs: ['5\n2 3 1 1 4', '5\n3 2 1 0 4', '1\n0', '3\n2 0 0', '4\n1 1 1 1', '5\n0 1 2 3 4'] });

add({ title: 'Jump Game II', difficulty: 'Medium', rating: 1500, tags: ['Array', 'Greedy'],
  statement: 'Each element is the maximum jump length from that position. Return the minimum number of jumps to reach the last index (it is guaranteed to be reachable).',
  inFmt: ARR, outFmt: 'The minimum number of jumps.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); let jumps = 0, end = 0, far = 0; for (let k = 0; k < a.length - 1; k++) { far = Math.max(far, k + a[k]); if (k === end) { jumps++; end = far; } } return jumps; },
  inputs: ['5\n2 3 1 1 4', '5\n2 3 0 1 4', '1\n0', '3\n1 1 1', '4\n1 2 3 4', '6\n5 1 1 1 1 1'] });

add({ title: 'Decode Ways', difficulty: 'Medium', rating: 1500, tags: ['String', 'Dynamic Programming'],
  statement: 'A message of digits is decoded by mapping 1→A, 2→B, …, 26→Z. Return the number of ways to decode the given digit string. `0` cannot start a valid mapping.',
  inFmt: 'A string of digits.', outFmt: 'The number of decodings.', constraints: '1 <= length <= 100',
  solve: (i) => { const s = lines(i)[0] || ''; const n = s.length; const dp = Array(n + 1).fill(0n); dp[0] = 1n; dp[1] = s[0] === '0' ? 0n : 1n; for (let k = 2; k <= n; k++) { if (s[k - 1] !== '0') dp[k] += dp[k - 1]; const two = +s.slice(k - 2, k); if (two >= 10 && two <= 26) dp[k] += dp[k - 2]; } return dp[n].toString(); },
  inputs: ['12', '226', '06', '11106', '10', '2101'] });

add({ title: 'Word Break', difficulty: 'Medium', rating: 1500, tags: ['String', 'Dynamic Programming'],
  statement: 'Given a string and a dictionary of words, determine whether the string can be segmented into a sequence of one or more dictionary words. Print `YES` or `NO`.',
  inFmt: 'Line 1: the string S. Line 2: number of dictionary words M. Line 3: M space-separated words.', outFmt: '`YES` or `NO`.', constraints: '1 <= |S| <= 300, 1 <= M <= 1000',
  solve: (i) => { const L = lines(i); const s = L[0] || ''; const dict = new Set((L[2] || '').trim().split(/\s+/)); const n = s.length; const dp = Array(n + 1).fill(false); dp[0] = true; for (let e = 1; e <= n; e++) for (let st = 0; st < e; st++) { if (dp[st] && dict.has(s.slice(st, e))) { dp[e] = true; break; } } return dp[n] ? 'YES' : 'NO'; },
  inputs: ['leetcode\n2\nleet code', 'applepenapple\n2\napple pen', 'catsandog\n5\ncats dog sand and cat', 'a\n1\na', 'aaaa\n1\naa', 'abc\n2\na b'] });

add({ title: 'Perfect Squares', difficulty: 'Medium', rating: 1500, tags: ['Dynamic Programming', 'Math'],
  statement: 'Return the least number of perfect-square numbers (1, 4, 9, 16, …) that sum to N.',
  inFmt: 'A single integer N.', outFmt: 'The minimum count of perfect squares.', constraints: '1 <= N <= 10000',
  solve: (i) => { const n = toInts(i)[0]; const dp = Array(n + 1).fill(Infinity); dp[0] = 0; for (let a = 1; a <= n; a++) for (let s = 1; s * s <= a; s++) dp[a] = Math.min(dp[a], dp[a - s * s] + 1); return dp[n]; },
  inputs: ['12', '13', '1', '100', '7', '48'] });

add({ title: 'Maximal Square', difficulty: 'Medium', rating: 1500, tags: ['Dynamic Programming', 'Matrix'],
  statement: 'Given an M×N grid of 0s and 1s, find the area of the largest square containing only 1s.',
  inFmt: 'Line 1: M N. Next M lines: N values (0 or 1).', outFmt: 'The area of the largest all-ones square.', constraints: '1 <= M, N <= 300',
  solve: (i) => { const L = lines(i); const [m, n] = toInts(L[0]); const g = []; for (let r = 0; r < m; r++) g.push(toInts(L[1 + r])); const dp = Array(n + 1).fill(0); let best = 0, prev = 0; for (let r = 1; r <= m; r++) { prev = 0; for (let c = 1; c <= n; c++) { const tmp = dp[c]; if (g[r - 1][c - 1] === 1) { dp[c] = Math.min(dp[c], dp[c - 1], prev) + 1; best = Math.max(best, dp[c]); } else dp[c] = 0; prev = tmp; } } return best * best; },
  inputs: ['4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0', '2 2\n0 1\n1 0', '1 1\n0', '1 1\n1', '3 3\n1 1 1\n1 1 1\n1 1 1', '2 3\n1 1 1\n1 1 1'] });

add({ title: 'Longest Palindromic Subsequence', difficulty: 'Medium', rating: 1500, tags: ['String', 'Dynamic Programming'],
  statement: 'Return the length of the longest subsequence of the string that is a palindrome.',
  inFmt: 'A single string (no spaces).', outFmt: 'The length of the longest palindromic subsequence.', constraints: '1 <= length <= 1000',
  solve: (i) => { const s = lines(i)[0] || ''; const n = s.length; const dp = Array.from({ length: n }, () => new Int32Array(n)); for (let k = 0; k < n; k++) dp[k][k] = 1; for (let len = 2; len <= n; len++) for (let a = 0; a + len - 1 < n; a++) { const b = a + len - 1; dp[a][b] = s[a] === s[b] ? dp[a + 1][b - 1] + 2 : Math.max(dp[a + 1][b], dp[a][b - 1]); } return dp[0][n - 1]; },
  inputs: ['bbbab', 'cbbd', 'a', 'agbdba', 'abcde', 'racecar'] });

add({ title: 'Min Cost Climbing Stairs', difficulty: 'Easy', rating: 1200, tags: ['Dynamic Programming'],
  statement: 'Each step has a cost. You may start at step 0 or step 1, and from a step climb one or two steps. Return the minimum cost to reach the top (past the last step).',
  inFmt: ARR, outFmt: 'The minimum cost to reach the top.', constraints: '2 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); let p = 0, q = 0; for (let k = 2; k <= a.length; k++) { const cur = Math.min(q + a[k - 1], p + a[k - 2]); p = q; q = cur; } return q; },
  inputs: ['3\n10 15 20', '10\n1 100 1 1 1 100 1 1 100 1', '2\n0 0', '4\n1 2 3 4', '5\n5 5 5 5 5', '3\n0 1 2'] });

add({ title: 'Nth Tribonacci Number', difficulty: 'Easy', rating: 1000, tags: ['Dynamic Programming', 'Math'],
  statement: 'The tribonacci sequence is T(0)=0, T(1)=1, T(2)=1, and T(n)=T(n-1)+T(n-2)+T(n-3). Return T(N).',
  inFmt: 'A single integer N.', outFmt: 'T(N).', constraints: '0 <= N <= 37',
  solve: (i) => { const n = toInts(i)[0]; const t = [0, 1, 1]; if (n < 3) return t[n]; for (let k = 3; k <= n; k++) t[k] = t[k - 1] + t[k - 2] + t[k - 3]; return t[n]; },
  inputs: ['4', '25', '0', '1', '2', '10'] });

add({ title: 'Nth Ugly Number', difficulty: 'Medium', rating: 1400, tags: ['Dynamic Programming', 'Math'],
  statement: 'An ugly number has no prime factors other than 2, 3 and 5 (1 is the first ugly number). Return the N-th ugly number.',
  inFmt: 'A single integer N.', outFmt: 'The N-th ugly number.', constraints: '1 <= N <= 1690',
  solve: (i) => { const n = toInts(i)[0]; const u = [1]; let i2 = 0, i3 = 0, i5 = 0; while (u.length < n) { const nx = Math.min(u[i2] * 2, u[i3] * 3, u[i5] * 5); u.push(nx); if (nx === u[i2] * 2) i2++; if (nx === u[i3] * 3) i3++; if (nx === u[i5] * 5) i5++; } return u[n - 1]; },
  inputs: ['10', '1', '7', '15', '150', '11'] });

// ════════════════════════════════════════════════════════════════════════════
//  MATH
// ════════════════════════════════════════════════════════════════════════════

add({ title: 'Integer Square Root', difficulty: 'Easy', rating: 1100, tags: ['Math', 'Binary Search'],
  statement: 'Return the floor of the square root of a non-negative integer N (do not use built-in sqrt in your own solution).',
  inFmt: 'A single integer N.', outFmt: 'floor(sqrt(N)).', constraints: '0 <= N <= 2000000000',
  solve: (i) => { const n = toInts(i)[0]; let lo = 0, hi = 100000, ans = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (m * m <= n) { ans = m; lo = m + 1; } else hi = m - 1; } return ans; },
  inputs: ['4', '8', '0', '1', '2000000000', '99'] });

add({ title: 'Happy Number', difficulty: 'Easy', rating: 1100, tags: ['Math', 'Hash Set'],
  statement: 'Repeatedly replace N by the sum of the squares of its digits. N is happy if this process eventually reaches 1. Print `YES` if N is happy, else `NO`.',
  inFmt: 'A single integer N.', outFmt: '`YES` or `NO`.', constraints: '1 <= N <= 2000000000',
  solve: (i) => { let n = toInts(i)[0]; const seen = new Set(); while (n !== 1 && !seen.has(n)) { seen.add(n); let s = 0; while (n > 0) { const d = n % 10; s += d * d; n = Math.floor(n / 10); } n = s; } return n === 1 ? 'YES' : 'NO'; },
  inputs: ['19', '2', '1', '7', '4', '23'] });

add({ title: 'Power of Three', difficulty: 'Easy', rating: 900, tags: ['Math'],
  statement: 'Determine whether N is a power of three. Print `YES` or `NO`.',
  inFmt: 'A single integer N.', outFmt: '`YES` or `NO`.', constraints: '-2^31 <= N <= 2^31 - 1',
  solve: (i) => { let n = toInts(i)[0]; if (n < 1) return 'NO'; while (n % 3 === 0) n /= 3; return n === 1 ? 'YES' : 'NO'; },
  inputs: ['27', '0', '9', '45', '1', '243'] });

add({ title: 'Power of Four', difficulty: 'Easy', rating: 900, tags: ['Math', 'Bit Manipulation'],
  statement: 'Determine whether N is a power of four. Print `YES` or `NO`.',
  inFmt: 'A single integer N.', outFmt: '`YES` or `NO`.', constraints: '-2^31 <= N <= 2^31 - 1',
  solve: (i) => { let n = toInts(i)[0]; if (n < 1) return 'NO'; while (n % 4 === 0) n /= 4; return n === 1 ? 'YES' : 'NO'; },
  inputs: ['16', '5', '1', '64', '0', '8'] });

add({ title: 'Ugly Number Check', difficulty: 'Easy', rating: 900, tags: ['Math'],
  statement: 'A positive number is ugly if its only prime factors are 2, 3 or 5. Print `YES` if N is ugly, else `NO`.',
  inFmt: 'A single integer N.', outFmt: '`YES` or `NO`.', constraints: '-2^31 <= N <= 2^31 - 1',
  solve: (i) => { let n = toInts(i)[0]; if (n < 1) return 'NO'; for (const p of [2, 3, 5]) while (n % p === 0) n /= p; return n === 1 ? 'YES' : 'NO'; },
  inputs: ['6', '8', '14', '1', '30', '7'] });

add({ title: 'Plus One', difficulty: 'Easy', rating: 900, tags: ['Array', 'Math'],
  statement: 'A non-negative integer is represented as an array of its digits (most significant first). Add one to it and print the resulting digits, space-separated.',
  inFmt: ARR, outFmt: 'The resulting digits, space-separated.', constraints: '1 <= N <= 10000',
  solve: (i) => { const a = toInts(lines(i)[1]).join(''); return (BigInt(a) + 1n).toString().split('').join(' '); },
  inputs: ['3\n1 2 3', '3\n4 3 2', '1\n9', '4\n9 9 9 9', '1\n0', '2\n1 0'] });

// ════════════════════════════════════════════════════════════════════════════
//  STACK
// ════════════════════════════════════════════════════════════════════════════

add({ title: 'Next Greater Element', difficulty: 'Medium', rating: 1300, tags: ['Array', 'Stack', 'Monotonic Stack'],
  statement: 'For each element, find the first element to its right that is strictly greater than it. If none exists, use -1. Print the resulting array.',
  inFmt: ARR, outFmt: 'The next-greater values, space-separated.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); const res = Array(a.length).fill(-1); const st = []; for (let k = 0; k < a.length; k++) { while (st.length && a[st[st.length - 1]] < a[k]) res[st.pop()] = a[k]; st.push(k); } return res.join(' '); },
  inputs: ['4\n4 5 2 25', '3\n13 7 6', '1\n5', '5\n1 2 3 4 5', '5\n5 4 3 2 1', '4\n2 2 2 2'] });

add({ title: 'Daily Temperatures', difficulty: 'Medium', rating: 1400, tags: ['Array', 'Stack', 'Monotonic Stack'],
  statement: 'For each day, find how many days you must wait until a warmer temperature. If there is no future warmer day, use 0. Print the resulting array.',
  inFmt: ARR, outFmt: 'The wait counts, space-separated.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); const res = Array(a.length).fill(0); const st = []; for (let k = 0; k < a.length; k++) { while (st.length && a[st[st.length - 1]] < a[k]) { const j = st.pop(); res[j] = k - j; } st.push(k); } return res.join(' '); },
  inputs: ['8\n73 74 75 71 69 72 76 73', '4\n30 40 50 60', '3\n30 60 90', '1\n50', '5\n90 80 70 60 50', '4\n40 40 40 40'] });

add({ title: 'Largest Rectangle in Histogram', difficulty: 'Hard', rating: 1700, tags: ['Array', 'Stack', 'Monotonic Stack'],
  statement: 'Given the heights of adjacent unit-width bars, find the area of the largest rectangle that fits entirely under the histogram.',
  inFmt: ARR, outFmt: 'The largest rectangle area.', constraints: '1 <= N <= 100000',
  solve: (i) => { const h = toInts(lines(i)[1]); const st = []; let best = 0; for (let k = 0; k <= h.length; k++) { const cur = k === h.length ? 0 : h[k]; while (st.length && h[st[st.length - 1]] >= cur) { const height = h[st.pop()]; const width = st.length ? k - st[st.length - 1] - 1 : k; best = Math.max(best, height * width); } st.push(k); } return best; },
  inputs: ['6\n2 1 5 6 2 3', '2\n2 4', '1\n5', '5\n1 1 1 1 1', '4\n4 3 2 1', '5\n2 4 2 4 2'] });

add({ title: 'Evaluate Reverse Polish Notation', difficulty: 'Medium', rating: 1300, tags: ['Stack', 'Math'],
  statement: 'Evaluate an arithmetic expression given in Reverse Polish Notation. Valid operators are `+ - * /`; division truncates toward zero. Tokens are space-separated.',
  inFmt: 'A single line of space-separated tokens.', outFmt: 'The integer result.', constraints: '1 <= tokens <= 10000',
  solve: (i) => { const tk = (lines(i)[0] || '').trim().split(/\s+/); const st = []; for (const t of tk) { if ('+-*/'.includes(t) && t.length === 1) { const b = st.pop(), a = st.pop(); let r; if (t === '+') r = a + b; else if (t === '-') r = a - b; else if (t === '*') r = a * b; else r = Math.trunc(a / b); st.push(r); } else st.push(parseInt(t, 10)); } return st[0]; },
  inputs: ['2 1 + 3 *', '4 13 5 / +', '5', '10 6 9 3 + -11 * / * 17 + 5 +', '3 4 -', '6 2 /'] });

add({ title: 'Remove Adjacent Duplicates', difficulty: 'Easy', rating: 1100, tags: ['String', 'Stack'],
  statement: 'Repeatedly remove pairs of equal adjacent characters until none remain. Print the resulting string (it may be empty).',
  inFmt: 'A single string (no spaces).', outFmt: 'The reduced string.', constraints: '1 <= length <= 100000',
  solve: (i) => { const s = lines(i)[0] || ''; const st = []; for (const c of s) { if (st.length && st[st.length - 1] === c) st.pop(); else st.push(c); } return st.join(''); },
  inputs: ['abbaca', 'azxxzy', 'aaaa', 'abcd', 'aabbcc', 'abccba'] });

add({ title: 'Decode String', difficulty: 'Medium', rating: 1500, tags: ['String', 'Stack'],
  statement: 'Decode a string of the form k[encoded], where the bracketed part is repeated k times (nesting allowed). For example `3[a2[c]]` decodes to `accaccacc`.',
  inFmt: 'A single encoded string (no spaces).', outFmt: 'The decoded string.', constraints: '1 <= length <= 1000',
  solve: (i) => { const s = lines(i)[0] || ''; const numSt = [], strSt = []; let cur = '', num = 0; for (const c of s) { if (c >= '0' && c <= '9') num = num * 10 + (+c); else if (c === '[') { numSt.push(num); strSt.push(cur); num = 0; cur = ''; } else if (c === ']') { const k = numSt.pop(); cur = strSt.pop() + cur.repeat(k); } else cur += c; } return cur; },
  inputs: ['3[a]2[bc]', '3[a2[c]]', '2[abc]3[cd]ef', 'abc', '10[a]', '2[a2[b]]'] });

// ════════════════════════════════════════════════════════════════════════════
//  GREEDY / INTERVALS
// ════════════════════════════════════════════════════════════════════════════

add({ title: 'Maximum Non-overlapping Intervals', difficulty: 'Medium', rating: 1400, tags: ['Greedy', 'Sorting', 'Intervals'],
  statement: 'Given N intervals with start and end times, return the maximum number of intervals you can select so that no two overlap (an interval ending at time t and another starting at t do not overlap).',
  inFmt: 'Line 1: N. Next N lines: `start end`.', outFmt: 'The maximum count of non-overlapping intervals.', constraints: '1 <= N <= 100000',
  solve: (i) => { const L = lines(i); const n = toInts(L[0])[0]; const iv = []; for (let k = 1; k <= n; k++) iv.push(toInts(L[k])); iv.sort((a, b) => a[1] - b[1]); let cnt = 0, end = -Infinity; for (const [s, e] of iv) { if (s >= end) { cnt++; end = e; } } return cnt; },
  inputs: ['3\n1 3\n2 4\n3 5', '4\n1 2\n3 4\n0 6\n5 7', '1\n5 10', '3\n1 2\n2 3\n3 4', '2\n1 10\n2 3', '4\n1 3\n1 3\n1 3\n1 3'] });

add({ title: 'Assign Cookies', difficulty: 'Easy', rating: 1100, tags: ['Greedy', 'Sorting'],
  statement: 'Each child has a greed factor and each cookie a size. A child is content if assigned a cookie of size at least their greed factor. Each child gets at most one cookie. Return the maximum number of content children.',
  inFmt: 'Line 1: G (children) then greed factors on line 2. Line 3: C (cookies) then sizes on line 4.', outFmt: 'The maximum number of content children.', constraints: '1 <= G, C <= 100000',
  solve: (i) => { const L = lines(i); const g = toInts(L[1]).sort((a, b) => a - b); const s = toInts(L[3]).sort((a, b) => a - b); let ci = 0, cj = 0, cnt = 0; while (ci < g.length && cj < s.length) { if (s[cj] >= g[ci]) { cnt++; ci++; } cj++; } return cnt; },
  inputs: ['3\n1 2 3\n2\n1 1', '2\n1 2\n3\n1 2 3', '1\n5\n1\n3', '3\n1 1 1\n3\n1 1 1', '2\n10 9\n3\n5 6 7', '1\n1\n1\n1'] });

add({ title: 'Partition Labels', difficulty: 'Medium', rating: 1400, tags: ['String', 'Greedy', 'Two Pointers'],
  statement: 'Partition the string into as many parts as possible so that each letter appears in at most one part. Print the sizes of the parts in order, space-separated.',
  inFmt: 'A single string of lowercase letters.', outFmt: 'The sizes of the parts, space-separated.', constraints: '1 <= length <= 100000',
  solve: (i) => { const s = lines(i)[0] || ''; const last = {}; for (let k = 0; k < s.length; k++) last[s[k]] = k; const res = []; let start = 0, end = 0; for (let k = 0; k < s.length; k++) { end = Math.max(end, last[s[k]]); if (k === end) { res.push(k - start + 1); start = k + 1; } } return res.join(' '); },
  inputs: ['ababcbacadefegdehijhklij', 'eccbbbbdec', 'a', 'abcdef', 'aaaa', 'abab'] });

add({ title: 'Ferris Wheel', difficulty: 'Medium', rating: 1300, tags: ['Greedy', 'Two Pointers', 'Sorting'],
  statement: 'There are N children with given weights and gondolas that each hold at most two children with total weight at most X. Return the minimum number of gondolas needed.',
  inFmt: 'Line 1: N X. Line 2: N weights.', outFmt: 'The minimum number of gondolas.', constraints: '1 <= N <= 100000',
  solve: (i) => { const L = lines(i); const [, x] = toInts(L[0]); const w = toInts(L[1]).sort((a, b) => a - b); let lo = 0, hi = w.length - 1, g = 0; while (lo <= hi) { if (lo === hi) { g++; break; } if (w[lo] + w[hi] <= x) lo++; hi--; g++; } return g; },
  inputs: ['4 10\n7 2 3 9', '3 8\n5 5 5', '1 10\n5', '4 6\n1 2 3 4', '2 3\n2 2', '5 10\n1 2 3 4 5'] });

add({ title: 'Stick Lengths', difficulty: 'Medium', rating: 1300, tags: ['Greedy', 'Sorting', 'Math'],
  statement: 'You have N sticks of given lengths. In one move you can lengthen or shorten a stick by 1 (cost 1). Return the minimum total cost to make all sticks the same length.',
  inFmt: 'Line 1: N. Line 2: N lengths.', outFmt: 'The minimum total cost.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]).sort((x, y) => x - y); const med = a[Math.floor(a.length / 2)]; return a.reduce((s, x) => s + Math.abs(x - med), 0); },
  inputs: ['5\n2 3 1 5 2', '1\n7', '4\n1 2 3 4', '3\n5 5 5', '2\n1 100', '6\n1 1 1 9 9 9'] });

// ════════════════════════════════════════════════════════════════════════════
//  GRAPHS / GRID (BFS / DFS)
// ════════════════════════════════════════════════════════════════════════════

add({ title: 'Connected Components', difficulty: 'Medium', rating: 1400, tags: ['Graph', 'Union Find', 'DFS'],
  statement: 'An undirected graph has N nodes (numbered 0..N-1) and M edges. Return the number of connected components.',
  inFmt: 'Line 1: N M. Next M lines: `u v` (an edge).', outFmt: 'The number of connected components.', constraints: '1 <= N <= 100000',
  solve: (i) => { const L = lines(i); const [n, m] = toInts(L[0]); const par = Array.from({ length: n }, (_, k) => k); const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }; for (let k = 1; k <= m; k++) { const [u, v] = toInts(L[k]); par[find(u)] = find(v); } let c = 0; for (let k = 0; k < n; k++) if (find(k) === k) c++; return c; },
  inputs: ['5 3\n0 1\n1 2\n3 4', '4 0', '1 0', '3 3\n0 1\n1 2\n2 0', '6 2\n0 5\n2 3', '2 1\n0 1'] });

add({ title: 'Course Schedule', difficulty: 'Medium', rating: 1500, tags: ['Graph', 'Topological Sort', 'DFS'],
  statement: 'There are N courses (0..N-1) and prerequisite pairs `a b` meaning you must take b before a. Determine whether it is possible to finish all courses. Print `YES` or `NO`.',
  inFmt: 'Line 1: N M. Next M lines: `a b`.', outFmt: '`YES` if all courses can be finished, else `NO`.', constraints: '1 <= N <= 100000',
  solve: (i) => { const L = lines(i); const [n, m] = toInts(L[0]); const adj = Array.from({ length: n }, () => []); const indeg = Array(n).fill(0); for (let k = 1; k <= m; k++) { const [a, b] = toInts(L[k]); adj[b].push(a); indeg[a]++; } const q = []; for (let k = 0; k < n; k++) if (indeg[k] === 0) q.push(k); let seen = 0; while (q.length) { const u = q.shift(); seen++; for (const v of adj[u]) if (--indeg[v] === 0) q.push(v); } return seen === n ? 'YES' : 'NO'; },
  inputs: ['2 1\n1 0', '2 2\n1 0\n0 1', '1 0', '4 4\n1 0\n2 1\n3 2\n0 3', '3 2\n0 1\n0 2', '4 3\n1 0\n2 0\n3 1'] });

add({ title: 'Flood Fill', difficulty: 'Easy', rating: 1300, tags: ['Graph', 'DFS', 'BFS', 'Matrix'],
  statement: 'Given an image grid, a starting pixel (r, c) and a new colour, fill the connected region of pixels that share the starting pixel\'s original colour (4-directionally) with the new colour. Print the resulting grid.',
  inFmt: 'Line 1: M N. Next M lines: N integers. Last line: `r c newColor`.', outFmt: 'The M rows of the resulting grid.', constraints: '1 <= M, N <= 100',
  solve: (i) => { const L = lines(i); const [m, n] = toInts(L[0]); const g = []; for (let r = 0; r < m; r++) g.push(toInts(L[1 + r])); const [sr, sc, nc] = toInts(L[1 + m]); const old = g[sr][sc]; if (old !== nc) { const st = [[sr, sc]]; while (st.length) { const [r, c] = st.pop(); if (r < 0 || c < 0 || r >= m || c >= n || g[r][c] !== old) continue; g[r][c] = nc; st.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]); } } return g.map((row) => row.join(' ')).join('\n'); },
  inputs: ['2 2\n1 1\n1 1\n0 0 2', '3 3\n1 1 1\n1 1 0\n1 0 1\n1 1 2', '1 1\n0\n0 0 5', '2 3\n0 0 0\n0 1 1\n1 1 3', '2 2\n1 2\n3 4\n0 0 9', '3 1\n1\n1\n1\n0 0 7'] });

add({ title: 'Rotting Oranges', difficulty: 'Medium', rating: 1500, tags: ['Graph', 'BFS', 'Matrix'],
  statement: 'In a grid, 0 is empty, 1 is a fresh orange and 2 is rotten. Every minute, a rotten orange rots the fresh oranges 4-directionally adjacent to it. Return the number of minutes until no fresh orange remains, or -1 if some fresh orange can never rot.',
  inFmt: 'Line 1: M N. Next M lines: N values (0, 1 or 2).', outFmt: 'The minutes elapsed, or -1.', constraints: '1 <= M, N <= 100',
  solve: (i) => { const L = lines(i); const [m, n] = toInts(L[0]); const g = []; for (let r = 0; r < m; r++) g.push(toInts(L[1 + r])); let q = [], fresh = 0; for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) { if (g[r][c] === 2) q.push([r, c]); else if (g[r][c] === 1) fresh++; } let mins = 0; const D = [[1, 0], [-1, 0], [0, 1], [0, -1]]; while (q.length && fresh > 0) { const nq = []; for (const [r, c] of q) for (const [dr, dc] of D) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nc >= 0 && nr < m && nc < n && g[nr][nc] === 1) { g[nr][nc] = 2; fresh--; nq.push([nr, nc]); } } q = nq; mins++; } return fresh === 0 ? mins : -1; },
  inputs: ['3 3\n2 1 1\n1 1 0\n0 1 1', '3 3\n2 1 1\n0 1 1\n1 0 1', '1 1\n0', '1 2\n2 1', '2 2\n2 2\n2 2', '1 3\n1 1 1'] });

add({ title: 'Shortest Path in Grid', difficulty: 'Medium', rating: 1500, tags: ['Graph', 'BFS', 'Matrix'],
  statement: 'In a grid, 0 is an open cell and 1 is a wall. Starting at the top-left and moving 4-directionally through open cells, return the length (number of cells visited) of the shortest path to the bottom-right, or -1 if unreachable.',
  inFmt: 'Line 1: M N. Next M lines: N values (0 or 1).', outFmt: 'The shortest path length, or -1.', constraints: '1 <= M, N <= 200',
  solve: (i) => { const L = lines(i); const [m, n] = toInts(L[0]); const g = []; for (let r = 0; r < m; r++) g.push(toInts(L[1 + r])); if (g[0][0] === 1 || g[m - 1][n - 1] === 1) return -1; const dist = Array.from({ length: m }, () => Array(n).fill(-1)); dist[0][0] = 1; let q = [[0, 0]]; const D = [[1, 0], [-1, 0], [0, 1], [0, -1]]; while (q.length) { const nq = []; for (const [r, c] of q) for (const [dr, dc] of D) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nc >= 0 && nr < m && nc < n && g[nr][nc] === 0 && dist[nr][nc] === -1) { dist[nr][nc] = dist[r][c] + 1; nq.push([nr, nc]); } } q = nq; } return dist[m - 1][n - 1]; },
  inputs: ['3 3\n0 0 0\n1 1 0\n0 0 0', '2 2\n0 1\n1 0', '1 1\n0', '3 3\n0 0 0\n0 0 0\n0 0 0', '2 3\n0 0 0\n1 1 0', '1 4\n0 0 0 0'] });

// ════════════════════════════════════════════════════════════════════════════
//  SIMULATION / MISC (Codeforces / CSES style)
// ════════════════════════════════════════════════════════════════════════════

add({ title: 'Weird Algorithm', difficulty: 'Easy', rating: 900, tags: ['Simulation', 'Math'],
  statement: 'Start from N. If it is even, divide by two; if odd, multiply by three and add one. Repeat until you reach 1. Print all values on the way, space-separated, starting with N and ending with 1.',
  inFmt: 'A single integer N.', outFmt: 'The sequence of values, space-separated.', constraints: '1 <= N <= 1000000',
  solve: (i) => { let n = toInts(i)[0]; const out = [n]; while (n !== 1) { n = n % 2 === 0 ? n / 2 : 3 * n + 1; out.push(n); } return out.join(' '); },
  inputs: ['3', '1', '6', '7', '2', '10'] });

add({ title: 'Increasing Array', difficulty: 'Easy', rating: 1100, tags: ['Greedy', 'Array'],
  statement: 'In one move you may increase any element by 1. Return the minimum number of moves to make the array non-decreasing (each element at least the previous one).',
  inFmt: ARR, outFmt: 'The minimum number of moves.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); let moves = 0, prev = a[0]; for (let k = 1; k < a.length; k++) { if (a[k] < prev) moves += prev - a[k]; else prev = a[k]; } return moves; },
  inputs: ['5\n3 2 5 1 7', '1\n5', '3\n1 2 3', '4\n5 4 3 2', '2\n1 1', '4\n2 2 1 1'] });

add({ title: 'Distinct Numbers', difficulty: 'Easy', rating: 1000, tags: ['Sorting', 'Hash Set'],
  statement: 'Given a list of numbers, return how many distinct values it contains.',
  inFmt: ARR, outFmt: 'The number of distinct values.', constraints: '1 <= N <= 200000',
  solve: (i) => new Set(toInts(lines(i)[1])).size,
  inputs: ['5\n2 3 2 2 3', '1\n7', '4\n1 2 3 4', '5\n5 5 5 5 5', '3\n1 1 2', '6\n1 2 3 3 2 1'] });

add({ title: 'Repetitions', difficulty: 'Easy', rating: 1000, tags: ['String'],
  statement: 'Given a string of characters, return the length of the longest run consisting of a single repeated character.',
  inFmt: 'A single string (no spaces).', outFmt: 'The longest single-character run length.', constraints: '1 <= length <= 1000000',
  solve: (i) => { const s = lines(i)[0] || ''; let best = 1, cur = 1; for (let k = 1; k < s.length; k++) { cur = s[k] === s[k - 1] ? cur + 1 : 1; best = Math.max(best, cur); } return s.length ? best : 0; },
  inputs: ['ATTCGGGA', 'AAAA', 'ABAB', 'X', 'AABBBCC', 'GGGGGGA'] });

add({ title: 'Restaurant Customers', difficulty: 'Medium', rating: 1300, tags: ['Sorting', 'Sweep Line'],
  statement: 'Each customer arrives at time a and leaves at time b (with a < b). Return the maximum number of customers present at the same time.',
  inFmt: 'Line 1: N. Next N lines: `a b`.', outFmt: 'The maximum simultaneous customers.', constraints: '1 <= N <= 100000',
  solve: (i) => { const L = lines(i); const n = toInts(L[0])[0]; const ev = []; for (let k = 1; k <= n; k++) { const [a, b] = toInts(L[k]); ev.push([a, 1], [b, -1]); } ev.sort((x, y) => x[0] - y[0] || x[1] - y[1]); let cur = 0, best = 0; for (const [, d] of ev) { cur += d; best = Math.max(best, cur); } return best; },
  inputs: ['3\n5 8\n2 4\n3 9', '1\n1 2', '2\n1 5\n2 6', '3\n1 2\n2 3\n3 4', '4\n1 10\n2 9\n3 8\n4 7', '2\n1 2\n3 4'] });

add({ title: 'Sum of Two Values', difficulty: 'Easy', rating: 1200, tags: ['Array', 'Hash Map', 'Two Pointers'],
  statement: 'Given an array and a target X, find two distinct positions whose values sum to X. Print their 1-based indices (smaller first), or `IMPOSSIBLE` if no such pair exists. If several pairs exist, any valid one is accepted — the reference prints the pair with the smallest first index, then smallest second.',
  inFmt: 'Line 1: N X. Line 2: N integers.', outFmt: 'Two 1-based indices, or `IMPOSSIBLE`.', constraints: '1 <= N <= 5000',
  solve: (i) => { const L = lines(i); const [, x] = toInts(L[0]); const a = toInts(L[1]); for (let p = 0; p < a.length; p++) for (let q = p + 1; q < a.length; q++) if (a[p] + a[q] === x) return `${p + 1} ${q + 1}`; return 'IMPOSSIBLE'; },
  inputs: ['4 8\n2 7 5 1', '3 5\n1 1 1', '1 5\n5', '5 10\n1 2 3 4 6', '4 100\n1 2 3 4', '2 3\n1 2'] });

add({ title: 'Josephus Survivor', difficulty: 'Medium', rating: 1300, tags: ['Math', 'Simulation'],
  statement: 'N people numbered 1..N stand in a circle. Counting starts at person 1; every K-th person is removed until one remains. Return the position of the survivor (1-indexed).',
  inFmt: 'Two integers N and K on one line.', outFmt: 'The survivor\'s position.', constraints: '1 <= N <= 100000, 1 <= K <= 1000000000',
  solve: (i) => { const [n, k] = toInts(i); let r = 0; for (let m = 2; m <= n; m++) r = (r + k) % m; return r + 1; },
  inputs: ['7 3', '1 1', '5 2', '10 1', '6 4', '2 1'] });

add({ title: 'Tower of Hanoi Moves', difficulty: 'Easy', rating: 1000, tags: ['Math', 'Recursion'],
  statement: 'Return the minimum number of moves needed to solve the Tower of Hanoi puzzle with N disks (which equals 2^N − 1).',
  inFmt: 'A single integer N.', outFmt: 'The minimum number of moves.', constraints: '0 <= N <= 62',
  solve: (i) => ((1n << BigInt(toInts(i)[0])) - 1n).toString(),
  inputs: ['3', '1', '0', '10', '62', '5'] });

add({ title: 'Bulb Switcher', difficulty: 'Medium', rating: 1200, tags: ['Math'],
  statement: 'There are N bulbs, initially off. On round i you toggle every i-th bulb. After N rounds, return how many bulbs are on (this equals the number of perfect squares up to N).',
  inFmt: 'A single integer N.', outFmt: 'The number of bulbs that remain on.', constraints: '0 <= N <= 2000000000',
  solve: (i) => { const n = toInts(i)[0]; let lo = 0, hi = 100000, ans = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (m * m <= n) { ans = m; lo = m + 1; } else hi = m - 1; } return ans; },
  inputs: ['3', '1', '0', '100', '2000000000', '10'] });

// ════════════════════════════════════════════════════════════════════════════
//  MORE CLASSICS · BITS · MATRIX · NUMBER THEORY
// ════════════════════════════════════════════════════════════════════════════

add({ title: 'Number of 1 Bits', difficulty: 'Easy', rating: 900, tags: ['Bit Manipulation'],
  statement: 'Return the number of set bits (1s) in the binary representation of a non-negative integer N.',
  inFmt: 'A single integer N.', outFmt: 'The number of set bits.', constraints: '0 <= N <= 2000000000',
  solve: (i) => { let n = toInts(i)[0], c = 0; while (n > 0) { c += n & 1; n = Math.floor(n / 2); } return c; },
  inputs: ['11', '128', '0', '2147483647', '7', '1023'] });

add({ title: 'Hamming Distance', difficulty: 'Easy', rating: 1000, tags: ['Bit Manipulation'],
  statement: 'The Hamming distance between two integers is the number of bit positions at which the corresponding bits differ. Return it for A and B.',
  inFmt: 'Two integers A and B on one line.', outFmt: 'The Hamming distance.', constraints: '0 <= A, B <= 2000000000',
  solve: (i) => { let [a, b] = toInts(i), x = a ^ b, c = 0; x = x >>> 0; while (x > 0) { c += x & 1; x = Math.floor(x / 2); } return c; },
  inputs: ['1 4', '3 1', '0 0', '7 0', '10 20', '255 0'] });

add({ title: 'Kth Smallest Element', difficulty: 'Medium', rating: 1200, tags: ['Array', 'Sorting'],
  statement: 'Return the K-th smallest element in the array (1-indexed, counting duplicates).',
  inFmt: 'Line 1: N. Line 2: N integers. Line 3: K.', outFmt: 'The K-th smallest element.', constraints: '1 <= K <= N <= 100000',
  solve: (i) => { const L = lines(i); const a = toInts(L[1]).sort((x, y) => x - y); return a[toInts(L[2])[0] - 1]; },
  inputs: ['6\n3 2 1 5 6 4\n2', '5\n7 10 4 3 20\n3', '1\n1\n1', '5\n5 5 5 5 5\n3', '4\n9 1 5 3\n1', '4\n9 1 5 3\n4'] });

add({ title: 'Third Maximum Number', difficulty: 'Easy', rating: 1100, tags: ['Array', 'Sorting'],
  statement: 'Return the third distinct maximum value in the array. If it does not exist (fewer than three distinct values), return the maximum value instead.',
  inFmt: ARR, outFmt: 'The third distinct maximum, or the maximum.', constraints: '1 <= N <= 100000',
  solve: (i) => { const u = [...new Set(toInts(lines(i)[1]))].sort((a, b) => b - a); return u.length >= 3 ? u[2] : u[0]; },
  inputs: ['3\n3 2 1', '2\n1 2', '4\n2 2 3 1', '5\n5 4 3 2 1', '1\n7', '6\n1 1 2 2 3 3'] });

add({ title: 'Running Sum', difficulty: 'Easy', rating: 800, tags: ['Array', 'Prefix Sum'],
  statement: 'Return the running (prefix) sum of the array: element i of the answer is the sum of the first i+1 elements. Print it space-separated.',
  inFmt: ARR, outFmt: 'The running sums, space-separated.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); let s = 0; return a.map((x) => (s += x)).join(' '); },
  inputs: ['4\n1 2 3 4', '5\n1 1 1 1 1', '1\n5', '3\n3 1 2', '4\n-1 2 -3 4', '3\n10 20 30'] });

add({ title: 'Valid Mountain Array', difficulty: 'Easy', rating: 1100, tags: ['Array', 'Two Pointers'],
  statement: 'An array is a valid mountain if it has at least 3 elements, strictly increases to a single peak, then strictly decreases (the peak may not be the first or last element). Print `YES` or `NO`.',
  inFmt: ARR, outFmt: '`YES` or `NO`.', constraints: '1 <= N <= 100000',
  solve: (i) => { const a = toInts(lines(i)[1]); const n = a.length; if (n < 3) return 'NO'; let k = 0; while (k + 1 < n && a[k] < a[k + 1]) k++; if (k === 0 || k === n - 1) return 'NO'; while (k + 1 < n && a[k] > a[k + 1]) k++; return k === n - 1 ? 'YES' : 'NO'; },
  inputs: ['3\n0 3 2', '3\n3 5 5', '2\n1 2', '5\n0 2 3 4 1', '4\n1 2 3 4', '5\n1 3 2 4 1'] });

add({ title: 'GCD of Two Numbers', difficulty: 'Easy', rating: 1000, tags: ['Math', 'Number Theory'],
  statement: 'Return the greatest common divisor of two positive integers A and B.',
  inFmt: 'Two integers A and B on one line.', outFmt: 'gcd(A, B).', constraints: '1 <= A, B <= 1000000000',
  solve: (i) => { const [a, b] = toInts(i); return gcd(a, b); },
  inputs: ['12 18', '100 75', '17 5', '48 36', '7 7', '1 999'] });

add({ title: 'LCM of Two Numbers', difficulty: 'Easy', rating: 1100, tags: ['Math', 'Number Theory'],
  statement: 'Return the least common multiple of two positive integers A and B.',
  inFmt: 'Two integers A and B on one line.', outFmt: 'lcm(A, B).', constraints: '1 <= A, B <= 100000',
  solve: (i) => { const [a, b] = toInts(i); return (a / gcd(a, b)) * b; },
  inputs: ['4 6', '3 5', '12 8', '7 7', '10 100', '9 6'] });

add({ title: 'Count Primes Below N', difficulty: 'Medium', rating: 1300, tags: ['Math', 'Sieve'],
  statement: 'Count how many prime numbers are less than or equal to N.',
  inFmt: 'A single integer N.', outFmt: 'The number of primes ≤ N.', constraints: '1 <= N <= 1000000',
  solve: (i) => { const n = toInts(i)[0]; if (n < 2) return 0; const s = new Uint8Array(n + 1); let c = 0; for (let p = 2; p <= n; p++) { if (!s[p]) { c++; for (let m = p * p; m <= n; m += p) s[m] = 1; } } return c; },
  inputs: ['10', '2', '1', '100', '1000', '30'] });

add({ title: 'Palindrome Number', difficulty: 'Easy', rating: 900, tags: ['Math'],
  statement: 'Determine whether the integer N reads the same forwards and backwards. Negative numbers are never palindromes. Print `YES` or `NO`.',
  inFmt: 'A single integer N.', outFmt: '`YES` or `NO`.', constraints: '-2000000000 <= N <= 2000000000',
  solve: (i) => { const n = toInts(i)[0]; if (n < 0) return 'NO'; const s = String(n); return s === s.split('').reverse().join('') ? 'YES' : 'NO'; },
  inputs: ['121', '-121', '10', '0', '1331', '12321'] });

add({ title: 'Power of Two', difficulty: 'Easy', rating: 900, tags: ['Bit Manipulation', 'Math'],
  statement: 'Determine whether N is a power of two. Print `YES` or `NO`.',
  inFmt: 'A single integer N.', outFmt: '`YES` or `NO`.', constraints: '-2000000000 <= N <= 2000000000',
  solve: (i) => { const n = toInts(i)[0]; return n > 0 && (n & (n - 1)) === 0 ? 'YES' : 'NO'; },
  inputs: ['1', '16', '3', '1024', '0', '6'] });

add({ title: 'Transpose Matrix', difficulty: 'Easy', rating: 1000, tags: ['Matrix'],
  statement: 'Given an R×C matrix, print its transpose (a C×R matrix), one row per line with space-separated values.',
  inFmt: 'Line 1: R C. Next R lines: C integers.', outFmt: 'The transposed matrix, R columns become rows.', constraints: '1 <= R, C <= 200',
  solve: (i) => { const L = lines(i); const [r, c] = toInts(L[0]); const g = []; for (let k = 0; k < r; k++) g.push(toInts(L[1 + k])); const out = []; for (let cc = 0; cc < c; cc++) { const row = []; for (let rr = 0; rr < r; rr++) row.push(g[rr][cc]); out.push(row.join(' ')); } return out.join('\n'); },
  inputs: ['2 3\n1 2 3\n4 5 6', '2 2\n1 2\n3 4', '1 1\n5', '3 1\n1\n2\n3', '1 3\n7 8 9', '2 2\n1 0\n0 1'] });

add({ title: 'Matrix Diagonal Sum', difficulty: 'Easy', rating: 1000, tags: ['Matrix'],
  statement: 'Given an N×N matrix, return the sum of its two diagonals. If N is odd, the center element (counted by both diagonals) is added only once.',
  inFmt: 'Line 1: N. Next N lines: N integers.', outFmt: 'The diagonal sum.', constraints: '1 <= N <= 200',
  solve: (i) => { const L = lines(i); const n = toInts(L[0])[0]; const g = []; for (let k = 0; k < n; k++) g.push(toInts(L[1 + k])); let s = 0; for (let k = 0; k < n; k++) { s += g[k][k]; if (k !== n - 1 - k) s += g[k][n - 1 - k]; } return s; },
  inputs: ['3\n1 2 3\n4 5 6\n7 8 9', '2\n1 1\n1 1', '1\n5', '4\n1 1 1 1\n1 1 1 1\n1 1 1 1\n1 1 1 1', '3\n5 0 0\n0 5 0\n0 0 5', '2\n1 2\n3 4'] });

add({ title: 'Count Negatives in Matrix', difficulty: 'Easy', rating: 1000, tags: ['Matrix'],
  statement: 'Given an R×C matrix of integers, count how many of its entries are negative.',
  inFmt: 'Line 1: R C. Next R lines: C integers.', outFmt: 'The number of negative entries.', constraints: '1 <= R, C <= 300',
  solve: (i) => { const L = lines(i); const [r] = toInts(L[0]); let c = 0; for (let k = 0; k < r; k++) for (const v of toInts(L[1 + k])) if (v < 0) c++; return c; },
  inputs: ['3 4\n4 3 2 -1\n3 2 1 -1\n1 1 -1 -2', '2 2\n3 2\n1 0', '1 1\n-5', '2 3\n-1 -1 -1\n-1 -1 -1', '1 4\n1 2 3 4', '2 2\n0 -1\n-2 3'] });

add({ title: 'Spiral Matrix Order', difficulty: 'Medium', rating: 1300, tags: ['Matrix', 'Simulation'],
  statement: 'Given an R×C matrix, return all its elements in spiral order (starting top-left, going right, then down, then left, then up, spiralling inward). Print them space-separated on one line.',
  inFmt: 'Line 1: R C. Next R lines: C integers.', outFmt: 'The elements in spiral order, space-separated.', constraints: '1 <= R, C <= 100',
  solve: (i) => { const L = lines(i); const [r, c] = toInts(L[0]); const g = []; for (let k = 0; k < r; k++) g.push(toInts(L[1 + k])); const res = []; let top = 0, bot = r - 1, left = 0, right = c - 1; while (top <= bot && left <= right) { for (let j = left; j <= right; j++) res.push(g[top][j]); top++; for (let j = top; j <= bot; j++) res.push(g[j][right]); right--; if (top <= bot) { for (let j = right; j >= left; j--) res.push(g[bot][j]); bot--; } if (left <= right) { for (let j = bot; j >= top; j--) res.push(g[j][left]); left++; } } return res.join(' '); },
  inputs: ['3 3\n1 2 3\n4 5 6\n7 8 9', '3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12', '1 1\n5', '1 4\n1 2 3 4', '4 1\n1\n2\n3\n4', '2 2\n1 2\n3 4'] });

module.exports = { generatedProblems: problems };
