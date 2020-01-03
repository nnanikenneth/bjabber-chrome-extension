export function formatErrorMessage(initialErrorMessage, error) {
  if (typeof error === 'string') {
    return `${initialErrorMessage}: ${error}`;
  } else if (Object.prototype.hasOwnProperty.call(error, 'message')) {
    return `${initialErrorMessage}: ${error.message}`;
  }

  return `${initialErrorMessage}: ${JSON.stringify(error)}`;
}
