export function generatePassword(options = {}) {
  const {
    length = 12,
    symbols = true,
    numbers = true,
    uppercase = true,
    lowercase = true
  } = options;

  const targetLength = Math.max(1, Math.min(128, Number(length) || 12));

  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const NUM = '0123456789';
  const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?/';

  // Build pools based on options
  const pools = [];
  if (lowercase) pools.push(LOWER);
  if (uppercase) pools.push(UPPER);
  if (numbers) pools.push(NUM);
  if (symbols) pools.push(SYMBOLS);
  if (pools.length === 0) pools.push(LOWER); // default to lowercase if none selected

  const allChars = pools.join('');

  // helper
  function randInt(max) { return Math.floor(Math.random() * max); }
  function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

  // Guarantee at least one from each pool (category)
  const guaranteed = pools.map(pool => pool[randInt(pool.length)]);
  shuffle(guaranteed);
  const maxGuarantee = Math.min(targetLength, guaranteed.length);
  let passwordChars = guaranteed.slice(0, maxGuarantee);

  // Fill the rest
  const remaining = targetLength - passwordChars.length;
  for (let i = 0; i < remaining; i++) {
     passwordChars.push(allChars[randInt(allChars.length)]);
  }

  passwordChars = shuffle(passwordChars);
  const password = passwordChars.join('');

  // Strength calculation
  const categoriesUsed = pools.length;
  let strength = 0;
  if (targetLength >= 8) strength += 20;
  if (targetLength >= 12) strength += 25;
  if (targetLength >= 16) strength += 15;
  const categoryScoreMap = {1: 10, 2: 25, 3: 40, 4: 60};
  strength += categoryScoreMap[Math.min(4, categoriesUsed)] || 0;
  if (strength > 100) strength = 100;
  const intStrength = Math.round(strength);

  // Feedback
  const feedback = [];
  if (targetLength < 12) feedback.push('Increase password length for stronger security.');
  if (categoriesUsed < 3) feedback.push('Add more character types (uppercase letters, numbers, and symbols) to improve strength.');
  if (categoriesUsed === 1) feedback.push('Use more character categories to reduce predictability.');

  // presence of symbol
  const hasSymbol = password.split('').some(ch => SYMBOLS.includes(ch));
  if (symbols && !hasSymbol) {
    feedback.push('Consider including at least one symbol to strengthen the password.');
  }

  return { password, strength: intStrength, feedback };
}
