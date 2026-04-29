const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email?.trim()) {
    return 'Email is required.';
  }

  if (!emailPattern.test(email.trim())) {
    return 'Enter a valid email address.';
  }

  return '';
}

export function validatePassword(password) {
  if (!password) {
    return 'Password is required.';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return 'Use upper, lower, and numeric characters.';
  }

  return '';
}

export function validateName(name, label) {
  if (!name?.trim()) {
    return `${label} is required.`;
  }

  if (name.trim().length < 2) {
    return `${label} must be at least 2 characters.`;
  }

  return '';
}
