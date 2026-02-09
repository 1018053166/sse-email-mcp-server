function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateEmailAddresses(emails) {
  if (!Array.isArray(emails)) {
    return { valid: false, error: 'Email addresses must be an array' };
  }

  for (const email of emails) {
    if (!isValidEmail(email)) {
      return { valid: false, error: `Invalid email address: ${email}` };
    }
  }

  return { valid: true };
}

module.exports = {
  isValidEmail,
  validateEmailAddresses
};
