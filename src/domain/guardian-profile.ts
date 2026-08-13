import { normalizePersonName } from './person-name';
import { normalizePhone } from './phone';
import { err, ok, type Result } from './result';

export interface GuardianProfileInput {
  fullName: unknown;
  phone?: unknown;
  whatsappEnabled?: unknown;
  relationLabel?: unknown;
}

export interface GuardianProfile {
  full_name: string;
  phone: string;
  whatsapp_enabled: string;
  relation_label: string;
}

export const GUARDIAN_NAME_REQUIRED_ERROR = {
  code: 'GUARDIAN_NAME_REQUIRED',
  message: 'Informe o nome completo do responsável.',
  retryable: false,
} as const;

export function validateGuardianProfile(
  input: GuardianProfileInput,
): Result<GuardianProfile> {
  const fullName =
    typeof input.fullName === 'string'
      ? normalizePersonName(input.fullName)
      : '';
  if (fullName.length < 2) {
    return err(GUARDIAN_NAME_REQUIRED_ERROR);
  }

  const phone = normalizePhone(input.phone);
  if (!phone.ok) {
    return err(phone.error);
  }

  const relation =
    typeof input.relationLabel === 'string'
      ? normalizePersonName(input.relationLabel)
      : '';

  return ok({
    full_name: fullName,
    phone: phone.data,
    whatsapp_enabled: input.whatsappEnabled === true ? 'true' : 'false',
    relation_label: relation,
  });
}
