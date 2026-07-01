'use strict';

/**
 * contestScoring.js
 *
 * Updates a ContestEntry when a submission is judged during a contest.
 *
 * Scoring rules (ICPC-style):
 *  - A problem is worth `points` points when solved for the first time.
 *  - Penalty = minutes from contest start → acceptance time
 *              + 20 * number of wrong attempts before acceptance.
 *  - Subsequent correct submissions after the first AC are ignored.
 *  - Wrong/TLE/MLE/RE submissions before the first AC each add 20 penalty
 *    minutes but only once the problem is eventually solved.
 */

/**
 * Updates the ContestEntry for a user after their submission is judged.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {object} params
 * @param {string}  params.userId        - Submitting user's ID
 * @param {string}  params.contestId     - Contest ID
 * @param {string}  params.problemId     - Problem ID
 * @param {string}  params.verdict       - Final verdict ('ACCEPTED', 'WRONG_ANSWER', etc.)
 * @param {Date}    params.submittedAt   - Timestamp of this submission
 *
 * @returns {Promise<void>}
 */
async function updateContestEntry(prisma, { userId, contestId, problemId, verdict, submittedAt }) {
  // ------------------------------------------------------------------
  // 1. Fetch the ContestProblem to get the label and point value
  // ------------------------------------------------------------------
  const contestProblem = await prisma.contestProblem.findUnique({
    where: {
      contestId_problemId: { contestId, problemId },
    },
    include: {
      contest: {
        select: { startTime: true },
      },
    },
  });

  if (!contestProblem) {
    console.warn(
      `[contestScoring] ContestProblem not found for contestId=${contestId}, problemId=${problemId}`
    );
    return;
  }

  const { label, points, contest } = contestProblem;
  const contestStartTime = contest.startTime;

  // ------------------------------------------------------------------
  // 2. Fetch or create the ContestEntry for this user
  // ------------------------------------------------------------------
  let entry = await prisma.contestEntry.findUnique({
    where: {
      userId_contestId: { userId, contestId },
    },
  });

  if (!entry) {
    // Create a default entry; the user may not have registered but submitted
    entry = await prisma.contestEntry.create({
      data: {
        userId,
        contestId,
        score:        0,
        penalty:      0,
        solvedLabels: [],
      },
    });
  }

  // ------------------------------------------------------------------
  // 3. Check if this problem label is already solved
  //    If so, this submission has no effect on scoring.
  // ------------------------------------------------------------------
  if (entry.solvedLabels.includes(label)) {
    // Problem already accepted → nothing to update
    return;
  }

  // ------------------------------------------------------------------
  // 4. Count wrong attempts for this problem BEFORE this submission
  //    (excludes the current submission which we're processing now)
  // ------------------------------------------------------------------
  const wrongAttempts = await prisma.submission.count({
    where: {
      userId,
      problemId,
      contestId,
      status: {
        // Any non-AC verdict counts as a wrong attempt for penalty
        notIn: ['PENDING', 'RUNNING', 'ACCEPTED'],
      },
      // Only count submissions before this one
      createdAt: {
        lt: submittedAt instanceof Date ? submittedAt : new Date(submittedAt),
      },
    },
  });

  // ------------------------------------------------------------------
  // 5. If this submission is ACCEPTED, update score + penalty
  // ------------------------------------------------------------------
  if (verdict === 'ACCEPTED') {
    // Time penalty: minutes elapsed from contest start to acceptance
    const acceptedAt       = submittedAt instanceof Date ? submittedAt : new Date(submittedAt);
    const elapsedMs        = acceptedAt.getTime() - contestStartTime.getTime();
    const elapsedMinutes   = Math.max(0, Math.floor(elapsedMs / 60_000));

    // Wrong-attempt penalty: 20 min per wrong attempt before AC
    const wrongAttemptPenalty = wrongAttempts * 20;

    const problemPenalty = elapsedMinutes + wrongAttemptPenalty;

    // Update the entry: add points, accumulate penalty, mark label as solved
    await prisma.contestEntry.update({
      where: {
        userId_contestId: { userId, contestId },
      },
      data: {
        score:        { increment: points },
        penalty:      { increment: problemPenalty },
        solvedLabels: {
          // Prisma doesn't have a native "append to array" for scalar arrays;
          // we push via the set operation with the current list + new label.
          set: [...entry.solvedLabels, label],
        },
      },
    });

    console.log(
      `[contestScoring] User ${userId} solved problem ${label} in contest ${contestId}. ` +
      `+${points} pts, +${problemPenalty} penalty mins ` +
      `(${elapsedMinutes} elapsed + ${wrongAttemptPenalty} wrong-attempt penalty).`
    );
  }
  // For non-AC verdicts we don't update anything immediately.
  // The penalty for wrong attempts is only applied at the time of acceptance.
}

module.exports = { updateContestEntry };
