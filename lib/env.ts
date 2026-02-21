function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return value;
}

function requireUrl(name: string): string {
  const value = requireEnv(name);

  try {
    const parsed = new URL(value);
    if (!parsed.protocol || !parsed.host) {
      throw new Error("invalid");
    }
  } catch {
    throw new Error(
      `[env] Invalid URL for ${name}: expected absolute URL, received \"${value}\"`,
    );
  }

  return value;
}

function requireSecret(name: string, minLength = 32): string {
  const value = requireEnv(name);

  if (value.length < minLength) {
    throw new Error(
      `[env] ${name} must be at least ${minLength} characters long`,
    );
  }

  return value;
}

export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  BETTER_AUTH_SECRET: requireSecret("BETTER_AUTH_SECRET"),
  BETTER_AUTH_BASE_URL: requireUrl("BETTER_AUTH_BASE_URL"),
} as const;
