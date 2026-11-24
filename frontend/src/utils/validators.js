const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateTask(values) {
  const errors = {};
  if (!values.title?.trim()) {
    errors.title = 'Title is required.';
  } else if (values.title.trim().length > 120) {
    errors.title = 'Title must be 120 characters or fewer.';
  }
  if ((values.description || '').length > 2000) {
    errors.description = 'Description must be 2000 characters or fewer.';
  }
  if (!values.due_date) {
    errors.due_date = 'Due date is required.';
  } else if (values.start_date && values.due_date < values.start_date) {
    errors.due_date = 'Due date cannot be before the start date.';
  }
  if (!values.priority) errors.priority = 'Priority is required.';
  if (!values.status) errors.status = 'Status is required.';
  return errors;
}

export function validateRegister(values) {
  const errors = {};
  const name = values.name?.trim() || '';
  if (name.length < 2) errors.name = 'Enter your name (at least 2 characters).';
  if (!EMAIL_RE.test(values.email || '')) errors.email = 'Enter a valid email address.';
  if ((values.password || '').length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

export function validateLogin(values) {
  const errors = {};
  if (!EMAIL_RE.test(values.email || '')) errors.email = 'Enter a valid email address.';
  if (!values.password) errors.password = 'Password is required.';
  return errors;
}

export function validateProfile(values) {
  const errors = {};
  const name = values.name?.trim() || '';
  if (name.length < 2) errors.name = 'Enter your name (at least 2 characters).';
  if (!EMAIL_RE.test(values.email || '')) errors.email = 'Enter a valid email address.';
  return errors;
}

export function validatePasswordChange(values) {
  const errors = {};
  if (!values.current_password) errors.current_password = 'Current password is required.';
  if ((values.new_password || '').length < 8) {
    errors.new_password = 'New password must be at least 8 characters.';
  }
  if (values.new_password !== values.confirm_password) {
    errors.confirm_password = 'Passwords do not match.';
  }
  return errors;
}
