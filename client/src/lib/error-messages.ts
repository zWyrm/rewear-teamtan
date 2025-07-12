// User-friendly error message mapping
export const ERROR_MESSAGES = {
  // Authentication errors
  "Invalid credentials": "Username or password is incorrect. Please check your login details.",
  "Username already exists": "This username is already taken. Please choose a different one.",
  "Email already exists": "This email is already registered. Please use a different email address.",
  "User not found": "We couldn't find an account with those details. Please check your information.",
  "Password too weak": "Your password needs to be stronger. Please use at least 8 characters with a mix of letters and numbers.",
  
  // Network errors
  "Failed to fetch": "Connection problem. Please check your internet connection and try again.",
  "Network error": "Connection problem. Please check your internet connection and try again.",
  
  // Server errors
  "Internal server error": "Something went wrong on our end. Please try again in a few minutes.",
  "Service unavailable": "The service is temporarily unavailable. Please try again later.",
  
  // Validation errors
  "Validation failed": "Please check your information and try again.",
  "Required field missing": "Please fill in all required fields.",
  
  // Default fallbacks
  "Request failed": "Something went wrong. Please try again.",
  "Unknown error": "An unexpected error occurred. Please try again.",
};

export function getUserFriendlyErrorMessage(technicalError: string): string {
  // Clean up the technical error message
  const cleanError = technicalError.replace(/^\d+:\s*/, ''); // Remove status codes like "401: "
  
  // Look for exact matches first
  if (ERROR_MESSAGES[cleanError as keyof typeof ERROR_MESSAGES]) {
    return ERROR_MESSAGES[cleanError as keyof typeof ERROR_MESSAGES];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (cleanError.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // If no match found, return a generic user-friendly message
  return "Something went wrong. Please try again or contact support if the problem continues.";
}