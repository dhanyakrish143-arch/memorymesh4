// Simplified SM-2-style scheduler
export function computeNextReview(s_coefficient, correct) {
  let newS = s_coefficient;
  let intervalDays;

  if (correct) {
    newS = s_coefficient * 1.3;
    intervalDays = Math.round(newS);
  } else {
    newS = Math.max(1.3, s_coefficient * 0.5);
    intervalDays = 1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  return { s_coefficient: newS, nextReviewDate };
}