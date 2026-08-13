export const ENVIRONMENTS = ['LOCAL', 'DEV', 'E2E', 'PROD'] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export function isEnvironment(
  value: string | null | undefined,
): value is Environment {
  return ENVIRONMENTS.some((environment) => environment === value);
}

export function isDestructiveTestEnvironment(
  environment: string | null | undefined,
): boolean {
  return environment === 'E2E';
}
