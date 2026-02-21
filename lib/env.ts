function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const isNextProductionBuild =
  process.env.NEXT_PHASE === "phase-production-build";

function requireUrl(name: string): string {
  const value = requireEnv(name);

  try {
    const parsed = new URL(value);
    if (!parsed.protocol || !parsed.host) {
      throw new Error("invalid");
    }
  } catch {
    throw new Error(
      `[env] Invalid URL for ${name}: expected absolute URL, received "${value}"`,
    );
  }

  return value;
}

function requireSecretAtRuntime(name: string, minLength = 32): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    if (isNextProductionBuild) {
      // Allows route module evaluation during `next build` without leaking a real secret.
      return `build-time-placeholder-${name}`.padEnd(minLength, "_");
    }
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }

  if (value.length < minLength) {
    throw new Error(
      `[env] ${name} must be at least ${minLength} characters long`,
    );
  }

  return value;
}

export const env = {
  DATABASE_URL: optionalEnv("DATABASE_URL"),
  BETTER_AUTH_SECRET: requireSecretAtRuntime("BETTER_AUTH_SECRET"),
  BETTER_AUTH_BASE_URL: requireUrl("BETTER_AUTH_BASE_URL"),
} as const;
