// Standard BKT parameters
const P_TRANSIT = 0.1; // chance of learning after a review
const P_GUESS = 0.2;   // chance of guessing right without knowing
const P_SLIP = 0.1;    // chance of getting it wrong despite knowing

export function updateMastery(p_l, correct) {
  let p_correct_given_l = 1 - P_SLIP;
  let p_correct_given_not_l = P_GUESS;

  let p_l_given_evidence;
  if (correct) {
    const numerator = p_l * p_correct_given_l;
    const denominator = numerator + (1 - p_l) * p_correct_given_not_l;
    p_l_given_evidence = numerator / denominator;
  } else {
    const numerator = p_l * P_SLIP;
    const denominator = numerator + (1 - p_l) * (1 - P_GUESS);
    p_l_given_evidence = numerator / denominator;
  }

  // Apply learning transition
  const newP_l = p_l_given_evidence + (1 - p_l_given_evidence) * P_TRANSIT;
  return Math.min(Math.max(newP_l, 0), 1);
}