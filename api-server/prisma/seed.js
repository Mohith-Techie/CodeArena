/**
 * CodeArena Database Seed
 * Seeds 15 coding problems with full descriptions, constraints, and test cases.
 *
 * Run with: npm run db:seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Problems Data ────────────────────────────────────────────────────────────

const problems = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Two Sum
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    rating: 800,
    description: `## Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

### Examples

**Example 1:**
\`\`\`
Input:
4
2 7 11 15
9

Output:
0 1
\`\`\`
Explanation: nums[0] + nums[1] = 2 + 7 = 9, so return [0, 1].

**Example 2:**
\`\`\`
Input:
3
3 2 4
6

Output:
1 2
\`\`\`

**Example 3:**
\`\`\`
Input:
2
3 3
6

Output:
0 1
\`\`\``,
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    examples: [
      { input: '4\n2 7 11 15\n9', output: '0 1', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
      { input: '3\n3 2 4\n6', output: '1 2', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
    ],
    tags: ['Array', 'Hash Map'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isSample: true, orderIndex: 0 },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2', isSample: true, orderIndex: 1 },
      { input: '2\n3 3\n6', expectedOutput: '0 1', isSample: false, orderIndex: 2 },
      { input: '5\n1 5 3 7 2\n9', expectedOutput: '1 3', isSample: false, orderIndex: 3 },
      { input: '6\n-1 -2 -3 -4 -5 -6\n-8', expectedOutput: '2 5', isSample: false, orderIndex: 4 },
      { input: '4\n0 4 3 0\n0', expectedOutput: '0 3', isSample: false, orderIndex: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Palindrome Check
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Palindrome Check',
    slug: 'palindrome-check',
    difficulty: 'Easy',
    rating: 900,
    description: `## Palindrome Check

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.

A string is a palindrome when it reads the same forward and backward.

Only alphanumeric characters are considered. Uppercase letters are treated the same as lowercase.

### Examples

**Example 1:**
\`\`\`
Input: racecar
Output: true
\`\`\`

**Example 2:**
\`\`\`
Input: hello
Output: false
\`\`\`

**Example 3:**
\`\`\`
Input: A man a plan a canal Panama
Output: true
\`\`\`
Explanation: After filtering non-alphanumeric chars and lowercasing: "amanaplanacanalpanama"`,
    constraints: '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
    examples: [
      { input: 'racecar', output: 'true', explanation: 'Reads the same forwards and backwards' },
      { input: 'hello', output: 'false', explanation: '"olleh" != "hello"' },
    ],
    tags: ['String', 'Two Pointers'],
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: [
      { input: 'racecar', expectedOutput: 'true', isSample: true, orderIndex: 0 },
      { input: 'hello', expectedOutput: 'false', isSample: true, orderIndex: 1 },
      { input: 'A man a plan a canal Panama', expectedOutput: 'true', isSample: false, orderIndex: 2 },
      { input: 'Was it a car or a cat I saw', expectedOutput: 'true', isSample: false, orderIndex: 3 },
      { input: 'race a car', expectedOutput: 'false', isSample: false, orderIndex: 4 },
      { input: 'a', expectedOutput: 'true', isSample: false, orderIndex: 5 },
      { input: 'ab', expectedOutput: 'false', isSample: false, orderIndex: 6 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Fibonacci Number
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Fibonacci Number',
    slug: 'fibonacci-number',
    difficulty: 'Easy',
    rating: 900,
    description: `## Fibonacci Number

The **Fibonacci numbers**, commonly denoted \`F(n)\`, form a sequence called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. That is:

\`\`\`
F(0) = 0, F(1) = 1
F(n) = F(n - 1) + F(n - 2), for n > 1
\`\`\`

Given \`n\`, calculate \`F(n)\`.

### Examples

**Example 1:**
\`\`\`
Input: 2
Output: 1
\`\`\`
Explanation: F(2) = F(1) + F(0) = 1 + 0 = 1.

**Example 2:**
\`\`\`
Input: 10
Output: 55
\`\`\``,
    constraints: '0 <= n <= 30',
    examples: [
      { input: '2', output: '1', explanation: 'F(2) = F(1) + F(0) = 1 + 0 = 1' },
      { input: '10', output: '55', explanation: 'The 10th Fibonacci number' },
    ],
    tags: ['Dynamic Programming', 'Recursion', 'Math'],
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: [
      { input: '2', expectedOutput: '1', isSample: true, orderIndex: 0 },
      { input: '10', expectedOutput: '55', isSample: true, orderIndex: 1 },
      { input: '0', expectedOutput: '0', isSample: false, orderIndex: 2 },
      { input: '1', expectedOutput: '1', isSample: false, orderIndex: 3 },
      { input: '15', expectedOutput: '610', isSample: false, orderIndex: 4 },
      { input: '20', expectedOutput: '6765', isSample: false, orderIndex: 5 },
      { input: '30', expectedOutput: '832040', isSample: false, orderIndex: 6 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. FizzBuzz
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'FizzBuzz',
    slug: 'fizzbuzz',
    difficulty: 'Easy',
    rating: 800,
    description: `## FizzBuzz

Given an integer \`n\`, print numbers from 1 to \`n\` with the following rules:

- If the number is divisible by 3, print \`"Fizz"\`
- If the number is divisible by 5, print \`"Buzz"\`
- If the number is divisible by both 3 and 5, print \`"FizzBuzz"\`
- Otherwise, print the number itself

Print one value per line.

### Example

\`\`\`
Input: 15

Output:
1
2
Fizz
4
Buzz
Fizz
7
8
Fizz
Buzz
11
Fizz
13
14
FizzBuzz
\`\`\``,
    constraints: '1 <= n <= 10^4',
    examples: [
      {
        input: '15',
        output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
        explanation: 'Standard FizzBuzz for n=15',
      },
    ],
    tags: ['Math', 'String', 'Simulation'],
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: [
      {
        input: '15',
        expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
        isSample: true,
        orderIndex: 0,
      },
      { input: '1', expectedOutput: '1', isSample: true, orderIndex: 1 },
      { input: '3', expectedOutput: '1\n2\nFizz', isSample: false, orderIndex: 2 },
      { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isSample: false, orderIndex: 3 },
      {
        input: '20',
        expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz',
        isSample: false,
        orderIndex: 4,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Valid Parentheses
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    rating: 1100,
    description: `## Valid Parentheses

Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Examples

**Example 1:**
\`\`\`
Input: ()
Output: true
\`\`\`

**Example 2:**
\`\`\`
Input: ()[]{} 
Output: true
\`\`\`

**Example 3:**
\`\`\`
Input: (]
Output: false
\`\`\``,
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses only \'()[]{}\' ',
    examples: [
      { input: '()', output: 'true' },
      { input: '()[]{}', output: 'true' },
      { input: '(]', output: 'false' },
    ],
    tags: ['Stack', 'String'],
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: [
      { input: '()', expectedOutput: 'true', isSample: true, orderIndex: 0 },
      { input: '()[]{} ', expectedOutput: 'true', isSample: true, orderIndex: 1 },
      { input: '(]', expectedOutput: 'false', isSample: false, orderIndex: 2 },
      { input: '([)]', expectedOutput: 'false', isSample: false, orderIndex: 3 },
      { input: '{[]}', expectedOutput: 'true', isSample: false, orderIndex: 4 },
      { input: '', expectedOutput: 'true', isSample: false, orderIndex: 5 },
      { input: '((((', expectedOutput: 'false', isSample: false, orderIndex: 6 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Binary Search
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy',
    rating: 1000,
    description: `## Binary Search

Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, return its index. Otherwise, return \`-1\`.

You must write an algorithm with **O(log n)** runtime complexity.

### Input Format
- Line 1: n (size of array)
- Line 2: n space-separated integers (sorted ascending)
- Line 3: target

### Examples

**Example 1:**
\`\`\`
Input:
6
-1 0 3 5 9 12
9

Output:
4
\`\`\`

**Example 2:**
\`\`\`
Input:
6
-1 0 3 5 9 12
2

Output:
-1
\`\`\``,
    constraints: '1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll the integers in nums are unique.\nnums is sorted in ascending order.',
    examples: [
      { input: '6\n-1 0 3 5 9 12\n9', output: '4' },
      { input: '6\n-1 0 3 5 9 12\n2', output: '-1' },
    ],
    tags: ['Binary Search', 'Array'],
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: [
      { input: '6\n-1 0 3 5 9 12\n9', expectedOutput: '4', isSample: true, orderIndex: 0 },
      { input: '6\n-1 0 3 5 9 12\n2', expectedOutput: '-1', isSample: true, orderIndex: 1 },
      { input: '1\n5\n5', expectedOutput: '0', isSample: false, orderIndex: 2 },
      { input: '5\n1 3 5 7 9\n7', expectedOutput: '3', isSample: false, orderIndex: 3 },
      { input: '5\n1 3 5 7 9\n6', expectedOutput: '-1', isSample: false, orderIndex: 4 },
      { input: '3\n1 2 3\n1', expectedOutput: '0', isSample: false, orderIndex: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Reverse String
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Reverse String',
    slug: 'reverse-string',
    difficulty: 'Easy',
    rating: 800,
    description: `## Reverse String

Write a function that reverses a string.

The input is a single string. Output the reversed string on a single line.

### Examples

**Example 1:**
\`\`\`
Input: hello
Output: olleh
\`\`\`

**Example 2:**
\`\`\`
Input: Hannah
Output: hannaH
\`\`\``,
    constraints: '1 <= s.length <= 10^5\ns[i] is a printable ASCII character.',
    examples: [
      { input: 'hello', output: 'olleh' },
      { input: 'Hannah', output: 'hannaH' },
    ],
    tags: ['String', 'Two Pointers'],
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isSample: true, orderIndex: 0 },
      { input: 'Hannah', expectedOutput: 'hannaH', isSample: true, orderIndex: 1 },
      { input: 'a', expectedOutput: 'a', isSample: false, orderIndex: 2 },
      { input: 'abcde', expectedOutput: 'edcba', isSample: false, orderIndex: 3 },
      { input: 'CodeArena', expectedOutput: 'anerAedoC', isSample: false, orderIndex: 4 },
      { input: '12345', expectedOutput: '54321', isSample: false, orderIndex: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Merge Two Sorted Arrays
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Merge Two Sorted Arrays',
    slug: 'merge-two-sorted-arrays',
    difficulty: 'Medium',
    rating: 1200,
    description: `## Merge Two Sorted Arrays

You are given two integer arrays \`nums1\` and \`nums2\`, sorted in non-decreasing order.

Merge \`nums2\` into \`nums1\` as one sorted array and print the result.

### Input Format
- Line 1: m (size of nums1)
- Line 2: m space-separated integers (nums1)
- Line 3: n (size of nums2)
- Line 4: n space-separated integers (nums2)

### Output Format
Print the merged sorted array space-separated.

### Examples

**Example 1:**
\`\`\`
Input:
3
1 2 3
3
2 5 6

Output:
1 2 2 3 5 6
\`\`\`

**Example 2:**
\`\`\`
Input:
1
1
1
2

Output:
1 2
\`\`\``,
    constraints: '0 <= m, n <= 200\n1 <= m + n <= 200\n-10^9 <= nums1[i], nums2[j] <= 10^9',
    examples: [
      { input: '3\n1 2 3\n3\n2 5 6', output: '1 2 2 3 5 6' },
      { input: '1\n1\n1\n2', output: '1 2' },
    ],
    tags: ['Array', 'Two Pointers', 'Sorting'],
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: [
      { input: '3\n1 2 3\n3\n2 5 6', expectedOutput: '1 2 2 3 5 6', isSample: true, orderIndex: 0 },
      { input: '1\n1\n1\n2', expectedOutput: '1 2', isSample: true, orderIndex: 1 },
      { input: '0\n\n1\n1', expectedOutput: '1', isSample: false, orderIndex: 2 },
      { input: '3\n1 3 5\n3\n2 4 6', expectedOutput: '1 2 3 4 5 6', isSample: false, orderIndex: 3 },
      { input: '4\n-5 -3 0 4\n3\n-2 1 6', expectedOutput: '-5 -3 -2 0 1 4 6', isSample: false, orderIndex: 4 },
      { input: '2\n1 1\n2\n1 1', expectedOutput: '1 1 1 1', isSample: false, orderIndex: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. Longest Common Subsequence
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Longest Common Subsequence',
    slug: 'longest-common-subsequence',
    difficulty: 'Medium',
    rating: 1500,
    description: `## Longest Common Subsequence

Given two strings \`text1\` and \`text2\`, return the **length** of their longest common subsequence. If there is no common subsequence, return \`0\`.

A **subsequence** is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.

A **common subsequence** of two strings is a subsequence that is common to both strings.

### Input Format
- Line 1: text1
- Line 2: text2

### Examples

**Example 1:**
\`\`\`
Input:
abcde
ace

Output:
3
\`\`\`
Explanation: The LCS is "ace" with length 3.

**Example 2:**
\`\`\`
Input:
abc
abc

Output:
3
\`\`\``,
    constraints: '1 <= text1.length, text2.length <= 1000\ntext1 and text2 consist of only lowercase English characters.',
    examples: [
      { input: 'abcde\nace', output: '3', explanation: 'LCS is "ace"' },
      { input: 'abc\nabc', output: '3', explanation: 'LCS is "abc"' },
    ],
    tags: ['Dynamic Programming', 'String'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    testCases: [
      { input: 'abcde\nace', expectedOutput: '3', isSample: true, orderIndex: 0 },
      { input: 'abc\nabc', expectedOutput: '3', isSample: true, orderIndex: 1 },
      { input: 'abc\ndef', expectedOutput: '0', isSample: false, orderIndex: 2 },
      { input: 'oxcpqrsvwf\nshmtulqrypy', expectedOutput: '2', isSample: false, orderIndex: 3 },
      { input: 'bsbininm\njmjkbkjkv', expectedOutput: '1', isSample: false, orderIndex: 4 },
      { input: 'abcba\nabcbca', expectedOutput: '5', isSample: false, orderIndex: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. Number of Islands
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: 'Medium',
    rating: 1400,
    description: `## Number of Islands

Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

### Input Format
- Line 1: m n (rows and columns)
- Lines 2 to m+1: each row of the grid (space-separated 0s and 1s)

### Examples

**Example 1:**
\`\`\`
Input:
4 5
1 1 1 1 0
1 1 0 1 0
1 1 0 0 0
0 0 0 0 0

Output:
1
\`\`\`

**Example 2:**
\`\`\`
Input:
4 5
1 1 0 0 0
1 1 0 0 0
0 0 1 0 0
0 0 0 1 1

Output:
3
\`\`\``,
    constraints: 'm == grid.length\nn == grid[i].length\n1 <= m, n <= 300\ngrid[i][j] is \'0\' or \'1\'',
    examples: [
      { input: '4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0', output: '1' },
      { input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1', output: '3' },
    ],
    tags: ['Graph', 'BFS', 'DFS', 'Union Find', 'Matrix'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    testCases: [
      { input: '4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0', expectedOutput: '1', isSample: true, orderIndex: 0 },
      { input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1', expectedOutput: '3', isSample: true, orderIndex: 1 },
      { input: '1 1\n1', expectedOutput: '1', isSample: false, orderIndex: 2 },
      { input: '1 1\n0', expectedOutput: '0', isSample: false, orderIndex: 3 },
      { input: '3 3\n1 0 1\n0 1 0\n1 0 1', expectedOutput: '5', isSample: false, orderIndex: 4 },
      { input: '2 5\n1 0 1 0 1\n0 1 0 1 0', expectedOutput: '5', isSample: false, orderIndex: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. Maximum Subarray (Kadane's Algorithm)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'Medium',
    rating: 1300,
    description: `## Maximum Subarray

Given an integer array \`nums\`, find the **subarray** with the largest sum, and return its sum.

### Input Format
- Line 1: n (size of array)
- Line 2: n space-separated integers

### Examples

**Example 1:**
\`\`\`
Input:
9
-2 1 -3 4 -1 2 1 -5 4

Output:
6
\`\`\`
Explanation: The subarray [4,-1,2,1] has the largest sum 6.

**Example 2:**
\`\`\`
Input:
1
1

Output:
1
\`\`\`

**Example 3:**
\`\`\`
Input:
5
5 4 -1 7 8

Output:
23
\`\`\``,
    constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
    examples: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6', explanation: '[4,-1,2,1] has sum 6' },
      { input: '1\n1', output: '1' },
    ],
    tags: ['Array', 'Dynamic Programming', 'Divide and Conquer'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isSample: true, orderIndex: 0 },
      { input: '1\n1', expectedOutput: '1', isSample: true, orderIndex: 1 },
      { input: '5\n5 4 -1 7 8', expectedOutput: '23', isSample: false, orderIndex: 2 },
      { input: '3\n-2 -1 -3', expectedOutput: '-1', isSample: false, orderIndex: 3 },
      { input: '8\n1 -1 2 3 -4 2 1 -1', expectedOutput: '6', isSample: false, orderIndex: 4 },
      { input: '6\n-1 -2 -3 -4 -5 -6', expectedOutput: '-1', isSample: false, orderIndex: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. Climbing Stairs
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    rating: 1000,
    description: `## Climbing Stairs

You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?

### Examples

**Example 1:**
\`\`\`
Input: 2
Output: 2
\`\`\`
Explanation: There are two ways to climb to the top:
1. 1 step + 1 step
2. 2 steps

**Example 2:**
\`\`\`
Input: 3
Output: 3
\`\`\`
Explanation: There are three ways to climb to the top:
1. 1 step + 1 step + 1 step
2. 1 step + 2 steps
3. 2 steps + 1 step`,
    constraints: '1 <= n <= 45',
    examples: [
      { input: '2', output: '2', explanation: '2 distinct ways to climb 2 stairs' },
      { input: '3', output: '3', explanation: '3 distinct ways to climb 3 stairs' },
    ],
    tags: ['Dynamic Programming', 'Math', 'Memoization'],
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: [
      { input: '2', expectedOutput: '2', isSample: true, orderIndex: 0 },
      { input: '3', expectedOutput: '3', isSample: true, orderIndex: 1 },
      { input: '1', expectedOutput: '1', isSample: false, orderIndex: 2 },
      { input: '5', expectedOutput: '8', isSample: false, orderIndex: 3 },
      { input: '10', expectedOutput: '89', isSample: false, orderIndex: 4 },
      { input: '45', expectedOutput: '1836311903', isSample: false, orderIndex: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. Trapping Rain Water
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: 'Hard',
    rating: 1800,
    description: `## Trapping Rain Water

Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### Input Format
- Line 1: n (size of height array)
- Line 2: n space-separated non-negative integers

### Examples

**Example 1:**
\`\`\`
Input:
12
0 1 0 2 1 0 1 3 2 1 2 1

Output:
6
\`\`\`
Explanation: 6 units of rain water are trapped.

**Example 2:**
\`\`\`
Input:
6
4 2 0 3 2 5

Output:
9
\`\`\``,
    constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
    examples: [
      { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', output: '6' },
      { input: '6\n4 2 0 3 2 5', output: '9' },
    ],
    tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack', 'Monotonic Stack'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    testCases: [
      { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6', isSample: true, orderIndex: 0 },
      { input: '6\n4 2 0 3 2 5', expectedOutput: '9', isSample: true, orderIndex: 1 },
      { input: '1\n0', expectedOutput: '0', isSample: false, orderIndex: 2 },
      { input: '2\n1 0', expectedOutput: '0', isSample: false, orderIndex: 3 },
      { input: '5\n3 0 0 0 3', expectedOutput: '9', isSample: false, orderIndex: 4 },
      { input: '6\n1 2 3 4 5 6', expectedOutput: '0', isSample: false, orderIndex: 5 },
      { input: '6\n6 5 4 3 2 1', expectedOutput: '0', isSample: false, orderIndex: 6 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. Edit Distance
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Edit Distance',
    slug: 'edit-distance',
    difficulty: 'Hard',
    rating: 1900,
    description: `## Edit Distance

Given two strings \`word1\` and \`word2\`, return the **minimum number of operations** required to convert \`word1\` to \`word2\`.

You have the following three operations permitted on a word:
- Insert a character
- Delete a character
- Replace a character

### Input Format
- Line 1: word1
- Line 2: word2

### Examples

**Example 1:**
\`\`\`
Input:
horse
ros

Output:
3
\`\`\`
Explanation:
- horse → rorse (replace 'h' with 'r')
- rorse → rose (delete 'r')
- rose → ros (delete 'e')

**Example 2:**
\`\`\`
Input:
intention
execution

Output:
5
\`\`\``,
    constraints: '0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters.',
    examples: [
      { input: 'horse\nros', output: '3', explanation: '3 operations to convert horse to ros' },
      { input: 'intention\nexecution', output: '5' },
    ],
    tags: ['String', 'Dynamic Programming'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    testCases: [
      { input: 'horse\nros', expectedOutput: '3', isSample: true, orderIndex: 0 },
      { input: 'intention\nexecution', expectedOutput: '5', isSample: true, orderIndex: 1 },
      { input: 'abc\nabc', expectedOutput: '0', isSample: false, orderIndex: 2 },
      { input: 'abc\n', expectedOutput: '3', isSample: false, orderIndex: 3 },
      { input: '\nabc', expectedOutput: '3', isSample: false, orderIndex: 4 },
      { input: 'kitten\nsitting', expectedOutput: '3', isSample: false, orderIndex: 5 },
      { input: 'sunday\nsaturday', expectedOutput: '3', isSample: false, orderIndex: 6 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. Median of Two Sorted Arrays
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    difficulty: 'Hard',
    rating: 2200,
    description: `## Median of Two Sorted Arrays

Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return the **median** of the two sorted arrays.

The overall run time complexity should be **O(log (m+n))**.

### Input Format
- Line 1: m (size of nums1)
- Line 2: m space-separated integers (nums1, sorted)
- Line 3: n (size of nums2)
- Line 4: n space-separated integers (nums2, sorted)

### Output Format
Print the median. If the median is a whole number, print without decimal (e.g., \`2\`). Otherwise print with one decimal place (e.g., \`2.5\`).

### Examples

**Example 1:**
\`\`\`
Input:
2
1 3
1
2

Output:
2
\`\`\`
Explanation: merged array = [1, 2, 3], median is 2.

**Example 2:**
\`\`\`
Input:
2
1 2
2
3 4

Output:
2.5
\`\`\`
Explanation: merged array = [1, 2, 3, 4], median is (2 + 3) / 2 = 2.5.`,
    constraints: 'nums1.length == m\nnums2.length == n\n0 <= m, n <= 1000\n0 <= m + n\n-10^6 <= nums1[i], nums2[j] <= 10^6',
    examples: [
      { input: '2\n1 3\n1\n2', output: '2', explanation: 'Merged: [1, 2, 3], median = 2' },
      { input: '2\n1 2\n2\n3 4', output: '2.5', explanation: 'Merged: [1, 2, 3, 4], median = 2.5' },
    ],
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    testCases: [
      { input: '2\n1 3\n1\n2', expectedOutput: '2', isSample: true, orderIndex: 0 },
      { input: '2\n1 2\n2\n3 4', expectedOutput: '2.5', isSample: true, orderIndex: 1 },
      { input: '0\n\n1\n1', expectedOutput: '1', isSample: false, orderIndex: 2 },
      { input: '1\n2\n0\n', expectedOutput: '2', isSample: false, orderIndex: 3 },
      { input: '3\n1 3 5\n3\n2 4 6', expectedOutput: '3.5', isSample: false, orderIndex: 4 },
      { input: '4\n1 2 3 4\n4\n5 6 7 8', expectedOutput: '4.5', isSample: false, orderIndex: 5 },
      { input: '3\n1 2 3\n3\n4 5 6', expectedOutput: '3.5', isSample: false, orderIndex: 6 },
    ],
  },
];

// ─── Sample Users ─────────────────────────────────────────────────────────────

const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@codearena.dev',
    password: 'Admin@12345',
    rating: 2400,
    maxRating: 2450,
    rank: 'Grandmaster',
    country: 'US',
    bio: 'CodeArena administrator and problem setter.',
  },
  {
    username: 'tourist',
    email: 'tourist@codearena.dev',
    password: 'Tourist@12345',
    rating: 3500,
    maxRating: 3500,
    rank: 'Grandmaster',
    country: 'BY',
    bio: 'Top competitive programmer.',
  },
  {
    username: 'alice',
    email: 'alice@codearena.dev',
    password: 'Alice@12345',
    rating: 1750,
    maxRating: 1800,
    rank: 'Expert',
    country: 'IN',
    bio: 'Loves algorithms and data structures.',
  },
  {
    username: 'bob',
    email: 'bob@codearena.dev',
    password: 'Bob@12345',
    rating: 1350,
    maxRating: 1400,
    rank: 'Specialist',
    country: 'DE',
    bio: 'Learning competitive programming.',
  },
];

// ─── Seed Function ────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ── Seed Users ──────────────────────────────────────────────────────────────
  console.log('Creating sample users...');
  const createdUsers = [];

  for (const userData of sampleUsers) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        username: userData.username,
        email: userData.email,
        passwordHash,
        rating: userData.rating,
        maxRating: userData.maxRating,
        rank: userData.rank,
        country: userData.country,
        bio: userData.bio,
      },
    });
    createdUsers.push(user);
    console.log(`  ✓ User: ${user.username} (${user.email})`);
  }

  // ── Seed Problems ────────────────────────────────────────────────────────────
  console.log('\nCreating problems...');

  for (const problemData of problems) {
    const { testCases, ...problemFields } = problemData;

    // Check if already exists
    const existing = await prisma.problem.findUnique({ where: { slug: problemFields.slug } });
    if (existing) {
      console.log(`  ⏭  Skipping (exists): ${problemFields.title}`);
      continue;
    }

    const problem = await prisma.problem.create({
      data: {
        ...problemFields,
        testCases: {
          create: testCases,
        },
      },
    });

    console.log(
      `  ✓ Problem: ${problem.title} [${problem.difficulty}] — ${testCases.length} test cases`
    );
  }

  // ── Seed Sample Contest ───────────────────────────────────────────────────────
  console.log('\nCreating sample contest...');

  const twoSum = await prisma.problem.findUnique({ where: { slug: 'two-sum' } });
  const fibonacci = await prisma.problem.findUnique({ where: { slug: 'fibonacci-number' } });
  const maxSubarray = await prisma.problem.findUnique({ where: { slug: 'maximum-subarray' } });
  const editDistance = await prisma.problem.findUnique({ where: { slug: 'edit-distance' } });

  if (twoSum && fibonacci && maxSubarray && editDistance) {
    const existingContest = await prisma.contest.findFirst({
      where: { title: 'CodeArena Round #1' },
    });

    if (!existingContest) {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      const endTime = new Date(Date.now() + 26 * 60 * 60 * 1000);   // 26 hours from now

      const contest = await prisma.contest.create({
        data: {
          title: 'CodeArena Round #1',
          description:
            'Welcome to the first CodeArena rated round! Solve problems ranging from Easy to Hard in 2 hours. Best of luck!',
          startTime,
          endTime,
          isRated: true,
          problems: {
            create: [
              { problemId: twoSum.id, label: 'A', points: 500 },
              { problemId: fibonacci.id, label: 'B', points: 750 },
              { problemId: maxSubarray.id, label: 'C', points: 1000 },
              { problemId: editDistance.id, label: 'D', points: 1500 },
            ],
          },
        },
      });

      console.log(`  ✓ Contest: ${contest.title}`);
    } else {
      console.log(`  ⏭  Skipping (exists): CodeArena Round #1`);
    }
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Sample credentials:');
  console.log('  admin@codearena.dev  / Admin@12345');
  console.log('  alice@codearena.dev  / Alice@12345');
  console.log('  bob@codearena.dev    / Bob@12345');
}

// ─── Execute ──────────────────────────────────────────────────────────────────

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
