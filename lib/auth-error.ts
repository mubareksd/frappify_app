const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Access denied. Please contact your administrator.",
  AccountLocked: "Your account is locked. Please contact support.",
  AuthServiceUnavailable:
    "Sign-in service is currently unavailable. Please try again shortly.",
  Configuration:
    "Authentication is temporarily unavailable due to a server configuration issue.",
  CredentialsSignin: "Invalid site ID, username, or password.",
  InvalidAuthResponse:
    "Received an unexpected response from the sign-in service. Please try again.",
  InvalidCredentials: "Invalid site ID, username, or password.",
  MissingCredentials: "Site ID and username are required.",
  MissingPassword: "Password is required.",
  SessionExpired: "Your session has expired. Please sign in again.",
  TooManyRequests:
    "Too many sign-in attempts. Please wait a moment and try again.",
};

export function getAuthErrorMessage(error: string | null | undefined): string {
  if (!error) {
    return "Unable to sign in right now. Please try again.";
  }

  return AUTH_ERROR_MESSAGES[error] ?? "Unable to sign in right now. Please try again.";
}
