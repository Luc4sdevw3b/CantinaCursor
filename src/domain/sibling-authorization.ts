import { siblingStudentIds, type GuardianLinkRecord } from './guardian-link';
import { isImmutableId, isSheetRowNumber } from './ids';
import { err, ok, type Result } from './result';

export interface SiblingAuthorizationRecord {
  id: string;
  consumer_student_id: string;
  account_student_id: string;
  can_charge_account: string;
  can_use_account_credit: string;
  active: string;
  authorized_at: string;
  revoked_at: string;
  created_by: string;
  note: string;
}

export const SELF_AUTHORIZATION_ERROR = {
  code: 'SELF_AUTHORIZATION',
  message: 'Um aluno não autoriza a própria conta.',
  retryable: false,
} as const;

export const NOT_SIBLINGS_ERROR = {
  code: 'NOT_SIBLINGS',
  message: 'Só irmãos que compartilham responsável podem se autorizar.',
  retryable: false,
} as const;

export const AUTHORIZATION_REQUIRED_ERROR = {
  code: 'AUTHORIZATION_REQUIRED',
  message: 'Escolha lançar na conta ou usar o crédito do irmão.',
  retryable: false,
} as const;

export const INVALID_ID_ERROR = {
  code: 'INVALID_ID',
  message: 'ID deve ser UUID imutável, nunca número da linha.',
  retryable: false,
} as const;

function validId(id: string): boolean {
  return !isSheetRowNumber(id) && isImmutableId(id);
}

export function planSiblingAuthorization(input: {
  consumerStudentId: string;
  accountStudentId: string;
  canChargeAccount: boolean;
  canUseAccountCredit: boolean;
  createdBy: string;
  authorizedAt: string;
  note?: string;
  createId: () => string;
  links: readonly GuardianLinkRecord[];
}): Result<SiblingAuthorizationRecord> {
  if (
    !validId(input.consumerStudentId) ||
    !validId(input.accountStudentId) ||
    !validId(input.createdBy)
  ) {
    return err(INVALID_ID_ERROR);
  }
  if (input.consumerStudentId === input.accountStudentId) {
    return err(SELF_AUTHORIZATION_ERROR);
  }
  if (
    !siblingStudentIds(input.links, input.consumerStudentId).includes(
      input.accountStudentId,
    )
  ) {
    return err(NOT_SIBLINGS_ERROR);
  }
  if (!input.canChargeAccount && !input.canUseAccountCredit) {
    return err(AUTHORIZATION_REQUIRED_ERROR);
  }

  return ok({
    id: input.createId(),
    consumer_student_id: input.consumerStudentId,
    account_student_id: input.accountStudentId,
    can_charge_account: input.canChargeAccount ? 'true' : 'false',
    can_use_account_credit: input.canUseAccountCredit ? 'true' : 'false',
    active: 'true',
    authorized_at: input.authorizedAt,
    revoked_at: '',
    created_by: input.createdBy,
    note: input.note?.trim() ?? '',
  });
}

export function latestActiveAuthorizations(
  records: readonly SiblingAuthorizationRecord[],
): SiblingAuthorizationRecord[] {
  const latest = new Map<string, SiblingAuthorizationRecord>();
  for (const record of records) {
    latest.set(record.id, record);
  }
  return [...latest.values()].filter(
    (record) => record.active === 'true' && record.revoked_at === '',
  );
}

export const AUTHORIZATION_NOT_FOUND_ERROR = {
  code: 'AUTHORIZATION_NOT_FOUND',
  message: 'Autorização de irmão não encontrada.',
  retryable: false,
} as const;

export const SALE_ACCOUNT_UNAUTHORIZED_ERROR = {
  code: 'SALE_ACCOUNT_UNAUTHORIZED',
  message: 'Este aluno não pode lançar nesta conta.',
  retryable: false,
} as const;

export interface SaleChargeAuthorization {
  consumerStudentId: string;
  accountStudentId: string;
  canChargeAccount: boolean;
  canUseAccountCredit: boolean;
  active: boolean;
}

export function resolveSaleCharge(input: {
  consumerStudentId?: string | null;
  chargedStudentId?: string | null;
  authorizations: readonly SaleChargeAuthorization[];
}): Result<{ chargedStudentId: string; useAccountCredit: boolean }> {
  const consumerId = input.consumerStudentId || '';
  const requested = input.chargedStudentId || '';
  if (!consumerId) {
    if (requested) {
      return err(SALE_ACCOUNT_UNAUTHORIZED_ERROR);
    }
    return ok({ chargedStudentId: '', useAccountCredit: false });
  }
  const chargedId = requested || consumerId;
  if (chargedId === consumerId) {
    return ok({ chargedStudentId: consumerId, useAccountCredit: true });
  }
  const authorization = input.authorizations.find(
    (item) =>
      item.active &&
      item.canChargeAccount &&
      item.consumerStudentId === consumerId &&
      item.accountStudentId === chargedId,
  );
  if (!authorization) {
    return err(SALE_ACCOUNT_UNAUTHORIZED_ERROR);
  }
  return ok({
    chargedStudentId: chargedId,
    useAccountCredit: authorization.canUseAccountCredit,
  });
}

export function planSiblingRevocation(input: {
  id: string;
  revokedAt: string;
  existing: readonly SiblingAuthorizationRecord[];
}): Result<SiblingAuthorizationRecord> {
  if (!validId(input.id)) {
    return err(INVALID_ID_ERROR);
  }
  const current = latestActiveAuthorizations(input.existing).find(
    (record) => record.id === input.id,
  );
  if (!current) {
    return err(AUTHORIZATION_NOT_FOUND_ERROR);
  }
  return ok({
    ...current,
    active: 'false',
    revoked_at: input.revokedAt,
  });
}
