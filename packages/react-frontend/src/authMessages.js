export function formatAuthError(error, mode) {
  const status = error?.status;
  const code = error?.code;
  const message = error?.message || "Something went wrong.";

  if (
    status === 429 ||
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    /rate limit|too many requests/i.test(message)
  ) {
    if (mode === "signup") {
      return "Too many signup attempts. Wait a few minutes, or log in if this email already has an account.";
    }

    if (mode === "reset") {
      return "Too many password reset emails. Wait a few minutes and try again.";
    }

    return "Too many login attempts. Wait a minute and try again.";
  }

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    /already registered|already exists|already been registered/i.test(message)
  ) {
    return "That email already has an account. Log in, or reset your password if you forgot it.";
  }

  if (code === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return "Wrong email or password. If this email already has an account, reset your password.";
  }

  if (code === "email_not_confirmed" || /email not confirmed/i.test(message)) {
    return "This email is not confirmed yet. Check your inbox, or turn off Confirm email in Supabase Auth settings.";
  }

  if (code === "weak_password" || /password/i.test(code || "") && /weak|least/i.test(message)) {
    return "Choose a stronger password. Use at least 6 characters.";
  }

  return message;
}

export function describeSignupResult(data) {
  if (data.user?.identities && data.user.identities.length === 0) {
    return {
      alreadyExists: true,
      message:
        "That email already has an account. Log in, or reset your password if you forgot it.",
    };
  }

  if (!data.session) {
    return {
      needsConfirmation: true,
      message:
        "Account created. Check your email to confirm, then log in. If you do not get an email, turn off Confirm email in Supabase Auth settings.",
    };
  }

  return { signedIn: true };
}
