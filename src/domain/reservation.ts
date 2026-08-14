import {
  combineCivilTimeSaoPaulo,
  formatSaoPauloClock,
  parseCivilDate,
} from './civil-date';
import { isImmutableId, isSheetRowNumber } from './ids';
import { SOLD_OUT_LABEL } from './inventory';
import { formatBrl } from './money';
import { isRequestId } from './request-id';
import { err, ok, type Result } from './result';

export const RESERVATION_STATUS_RESERVED = 'reserved';
export const RESERVATION_STATUS_FULFILLED = 'fulfilled';
export const RESERVATION_STATUS_CANCELLED = 'cancelled';
export const RESERVATION_STATUS_NO_SHOW = 'no_show';
export const RESERVATION_PAYMENT_UNPAID = 'unpaid';
export const RESERVATION_CREATE_OPERATION = 'reservation.create';
export const RESERVATION_UPDATE_OPERATION = 'reservation.update';

export const RESERVATION_STATUSES = [
  RESERVATION_STATUS_RESERVED,
  RESERVATION_STATUS_FULFILLED,
  RESERVATION_STATUS_CANCELLED,
  RESERVATION_STATUS_NO_SHOW,
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const PUBLIC_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const PUBLIC_CODE_LENGTH = 6;
export const MAX_RESERVATION_ITEM_QUANTITY = 20;

export const INVALID_ID_ERROR = {
  code: 'INVALID_ID',
  message: 'ID deve ser UUID imutável, nunca número da linha.',
  retryable: false,
} as const;

export const SLOT_LABEL_REQUIRED_ERROR = {
  code: 'SLOT_LABEL_REQUIRED',
  message: 'Informe o nome do recreio.',
  retryable: false,
} as const;

export const SLOT_WINDOW_INVALID_ERROR = {
  code: 'SLOT_WINDOW_INVALID',
  message: 'O fim da retirada precisa ser depois do início.',
  retryable: false,
} as const;

export const SLOT_CUTOFF_AFTER_PICKUP_ERROR = {
  code: 'SLOT_CUTOFF_AFTER_PICKUP',
  message: 'O corte das reservas precisa ser até o início da retirada.',
  retryable: false,
} as const;

export const SLOT_NOT_FOUND_ERROR = {
  code: 'SLOT_NOT_FOUND',
  message: 'Recreio não encontrado.',
  retryable: false,
} as const;

export const SLOT_INACTIVE_ERROR = {
  code: 'SLOT_INACTIVE',
  message: 'Este recreio não está ativo.',
  retryable: false,
} as const;

export const RESERVATION_CUTOFF_PASSED_ERROR = {
  code: 'RESERVATION_CUTOFF_PASSED',
  message: 'O horário de corte deste recreio já passou.',
  retryable: false,
} as const;

export const RESERVATION_ITEMS_REQUIRED_ERROR = {
  code: 'RESERVATION_ITEMS_REQUIRED',
  message: 'Informe ao menos um item para reservar.',
  retryable: false,
} as const;

export const RESERVATION_REJECTED_ERROR = {
  code: 'RESERVATION_REJECTED',
  message: 'Não foi possível concluir a reserva.',
  retryable: false,
} as const;

export const RESERVATION_QUANTITY_INVALID_ERROR = {
  code: 'RESERVATION_QUANTITY_INVALID',
  message: 'A quantidade reservada precisa ser um inteiro entre 1 e 20.',
  retryable: false,
} as const;

export const PRODUCT_NOT_RESERVABLE_ERROR = {
  code: 'PRODUCT_NOT_RESERVABLE',
  message: 'Este produto não aceita reserva.',
  retryable: false,
} as const;

export const PRODUCT_INACTIVE_ERROR = {
  code: 'PRODUCT_INACTIVE',
  message: 'Produto inativo não entra em reserva nova.',
  retryable: false,
} as const;

export const RESERVATION_UNAVAILABLE_ERROR = {
  code: 'RESERVATION_UNAVAILABLE',
  message: 'Não há disponibilidade suficiente para esta reserva.',
  retryable: false,
} as const;

export const STUDENT_NAME_REQUIRED_ERROR = {
  code: 'RESERVATION_STUDENT_NAME_REQUIRED',
  message: 'Informe o nome para a retirada.',
  retryable: false,
} as const;

export const CLASSROOM_TEXT_REQUIRED_ERROR = {
  code: 'RESERVATION_CLASSROOM_REQUIRED',
  message: 'Informe a turma.',
  retryable: false,
} as const;

export const RESERVATION_NOT_FOUND_ERROR = {
  code: 'RESERVATION_NOT_FOUND',
  message: 'Reserva não encontrada.',
  retryable: false,
} as const;

export const RESERVATION_NOT_ACTIVE_ERROR = {
  code: 'RESERVATION_NOT_ACTIVE',
  message: 'Esta reserva já foi encerrada.',
  retryable: false,
} as const;

export const RESERVATION_REASON_REQUIRED_ERROR = {
  code: 'RESERVATION_REASON_REQUIRED',
  message: 'Informe o motivo.',
  retryable: false,
} as const;

export const RESERVATION_STUDENT_NOT_FOUND_ERROR = {
  code: 'STUDENT_NOT_FOUND',
  message: 'Aluno não encontrado.',
  retryable: false,
} as const;

export const RESERVATION_STUDENT_INACTIVE_ERROR = {
  code: 'STUDENT_INACTIVE',
  message: 'Aluno inativo não pode ser vinculado à reserva.',
  retryable: false,
} as const;

export const RESERVATION_PREPARED_UNSUPPORTED_ERROR = {
  code: 'RESERVATION_PREPARED_UNSUPPORTED',
  message:
    'Não existe estado Preparada. A reserva fica reservada até a retirada, o cancelamento ou a não retirada.',
  retryable: false,
} as const;

export const RESERVATION_PARTIAL_UNSUPPORTED_ERROR = {
  code: 'RESERVATION_PARTIAL_UNSUPPORTED',
  message:
    'Não há retirada parcial persistente. Cancele ou retire a reserva inteira.',
  retryable: false,
} as const;

export const INVALID_REQUEST_ID_ERROR = {
  code: 'INVALID_REQUEST_ID',
  message: 'request_id deve ser UUID, nunca número da linha.',
  retryable: false,
} as const;

export function parseImmutableId(value: unknown): Result<string> {
  if (
    typeof value !== 'string' ||
    isSheetRowNumber(value) ||
    !isImmutableId(value)
  ) {
    return err(INVALID_ID_ERROR);
  }
  return ok(value);
}

export function parseReservationRequestId(value: unknown): Result<string> {
  if (typeof value !== 'string' || !isRequestId(value)) {
    return err(INVALID_REQUEST_ID_ERROR);
  }
  return ok(value);
}

export function parseSlotLabel(value: unknown): Result<string> {
  if (typeof value !== 'string') {
    return err(SLOT_LABEL_REQUIRED_ERROR);
  }
  const label = value.trim().replace(/\s+/g, ' ');
  if (label.length < 2 || label.length > 40) {
    return err(SLOT_LABEL_REQUIRED_ERROR);
  }
  return ok(label);
}

export function parseReservationName(value: unknown): Result<string> {
  if (typeof value !== 'string') {
    return err(STUDENT_NAME_REQUIRED_ERROR);
  }
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 80) {
    return err(STUDENT_NAME_REQUIRED_ERROR);
  }
  return ok(name);
}

export function parseClassroomText(value: unknown): Result<string> {
  if (typeof value !== 'string') {
    return err(CLASSROOM_TEXT_REQUIRED_ERROR);
  }
  const classroom = value.trim().replace(/\s+/g, ' ');
  if (classroom.length < 1 || classroom.length > 40) {
    return err(CLASSROOM_TEXT_REQUIRED_ERROR);
  }
  return ok(classroom);
}

export function parseOptionalNote(value: unknown): Result<string> {
  if (value == null || value === '') {
    return ok('');
  }
  if (typeof value !== 'string') {
    return err(RESERVATION_REASON_REQUIRED_ERROR);
  }
  const note = value.trim().replace(/\s+/g, ' ');
  if (note.length > 200) {
    return err(RESERVATION_REASON_REQUIRED_ERROR);
  }
  return ok(note);
}

export function parseReservationReason(value: unknown): Result<string> {
  if (typeof value !== 'string') {
    return err(RESERVATION_REASON_REQUIRED_ERROR);
  }
  const reason = value.trim().replace(/\s+/g, ' ');
  if (reason.length < 2 || reason.length > 200) {
    return err(RESERVATION_REASON_REQUIRED_ERROR);
  }
  return ok(reason);
}

export function parseOptionalContact(value: unknown): Result<string> {
  if (value == null || value === '') {
    return ok('');
  }
  if (typeof value !== 'string') {
    return err(RESERVATION_REASON_REQUIRED_ERROR);
  }
  const contact = value.trim().replace(/\s+/g, ' ');
  if (contact.length > 40) {
    return err(RESERVATION_REASON_REQUIRED_ERROR);
  }
  return ok(contact);
}

export function parseItemQuantity(value: unknown): Result<number> {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_RESERVATION_ITEM_QUANTITY
  ) {
    return err(RESERVATION_QUANTITY_INVALID_ERROR);
  }
  return ok(value);
}

export function isReservationStatus(value: string): value is ReservationStatus {
  return RESERVATION_STATUSES.some((status) => status === value);
}

export function isActiveReservationStatus(status: string): boolean {
  return status === RESERVATION_STATUS_RESERVED;
}

export function reservationStatusLabel(status: string): string {
  if (status === RESERVATION_STATUS_FULFILLED) {
    return 'retirada';
  }
  if (status === RESERVATION_STATUS_CANCELLED) {
    return 'cancelada';
  }
  if (status === RESERVATION_STATUS_NO_SHOW) {
    return 'não retirada';
  }
  return 'reservada';
}

export function rejectPreparedStatus(value: unknown): Result<void> {
  if (typeof value === 'string' && value.trim().toLowerCase() === 'prepared') {
    return err(RESERVATION_PREPARED_UNSUPPORTED_ERROR);
  }
  return ok(undefined);
}

export function buildSlotTimes(input: {
  businessDate?: unknown;
  cutoffTime?: unknown;
  pickupStartTime?: unknown;
  pickupEndTime?: unknown;
  fallbackCivil: string;
}): Result<{
  businessDate: string;
  cutoffAt: string;
  pickupStartsAt: string;
  pickupEndsAt: string;
}> {
  const civil = parseCivilDate(input.businessDate || input.fallbackCivil);
  if (!civil.ok) {
    return err(civil.error);
  }
  const cutoff = combineCivilTimeSaoPaulo(
    civil.data,
    typeof input.cutoffTime === 'string' ? input.cutoffTime : '',
  );
  const start = combineCivilTimeSaoPaulo(
    civil.data,
    typeof input.pickupStartTime === 'string' ? input.pickupStartTime : '',
  );
  const end = combineCivilTimeSaoPaulo(
    civil.data,
    typeof input.pickupEndTime === 'string' ? input.pickupEndTime : '',
  );
  if (!cutoff.ok) {
    return err(cutoff.error);
  }
  if (!start.ok) {
    return err(start.error);
  }
  if (!end.ok) {
    return err(end.error);
  }
  if (Date.parse(end.data) <= Date.parse(start.data)) {
    return err(SLOT_WINDOW_INVALID_ERROR);
  }
  if (Date.parse(cutoff.data) > Date.parse(start.data)) {
    return err(SLOT_CUTOFF_AFTER_PICKUP_ERROR);
  }
  return ok({
    businessDate: civil.data,
    cutoffAt: cutoff.data,
    pickupStartsAt: start.data,
    pickupEndsAt: end.data,
  });
}

export function slotIsOpen(cutoffAt: string, nowIso: string): boolean {
  return Date.parse(nowIso) < Date.parse(cutoffAt);
}

export function slotSummaryLabel(input: {
  label: string;
  cutoffAt: string;
  pickupStartsAt: string;
  pickupEndsAt: string;
}): string {
  return `${input.label} • corte ${formatSaoPauloClock(input.cutoffAt)} • retirada ${formatSaoPauloClock(input.pickupStartsAt)}–${formatSaoPauloClock(input.pickupEndsAt)}`;
}

export function reservationSummaryLabel(input: {
  studentName: string;
  classroomText: string;
  itemNames: readonly string[];
  totalCents: number;
  slotLabel: string;
  status: string;
}): string {
  return `${input.studentName} • ${input.classroomText} • ${input.itemNames.join(', ')} • ${formatBrl(input.totalCents)} • ${input.slotLabel} • ${reservationStatusLabel(input.status)}`;
}

export function availabilitySummaryLabel(input: {
  productName: string;
  availableQuantity: number;
  reservedQuantity: number;
}): string {
  return `${input.productName} • disponível ${input.availableQuantity} • reservado ${input.reservedQuantity}`;
}

export function publicProductSummaryLabel(input: {
  name: string;
  priceCents: number;
  availableQuantity: number;
  soldOut: boolean;
}): string {
  if (input.soldOut) {
    return `${input.name} • ${formatBrl(input.priceCents)} • ${SOLD_OUT_LABEL}`;
  }
  return `${input.name} • ${formatBrl(input.priceCents)} • disponível ${input.availableQuantity}`;
}

export function publicReservationCodeLabel(code: string): string {
  return `Código ${code}`;
}

export function productionSummaryLabel(
  productName: string,
  quantity: number,
): string {
  return `${productName} • ${quantity}`;
}

export function linkedReservationStudentLabel(
  fullName: string,
  ageLabel: string,
): string {
  return `vinculada a ${fullName} • ${ageLabel}`;
}

export function reservationMatchesOwnerSearch(
  reservation: {
    studentNameText: string;
    classroomText: string;
    publicCode: string;
    slotLabel: string;
    summaryLabel: string;
    linkedStudentLabel: string;
  },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const haystack = [
    reservation.studentNameText,
    reservation.classroomText,
    reservation.publicCode,
    reservation.slotLabel,
    reservation.summaryLabel,
    reservation.linkedStudentLabel,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

export function buildProductionSummary(
  reservations: ReadonlyArray<{
    status: string;
    items: ReadonlyArray<{
      productId: string;
      productName: string;
      quantity: number;
    }>;
  }>,
): Array<{
  productId: string;
  productName: string;
  quantity: number;
  summaryLabel: string;
}> {
  const counts = new Map<string, { productName: string; quantity: number }>();
  for (const reservation of reservations) {
    if (reservation.status !== RESERVATION_STATUS_RESERVED) {
      continue;
    }
    for (const item of reservation.items) {
      const current = counts.get(item.productId) ?? {
        productName: item.productName,
        quantity: 0,
      };
      current.quantity += item.quantity;
      counts.set(item.productId, current);
    }
  }
  return [...counts.entries()]
    .map(([productId, row]) => ({
      productId,
      productName: row.productName,
      quantity: row.quantity,
      summaryLabel: productionSummaryLabel(row.productName, row.quantity),
    }))
    .sort((left, right) =>
      left.productName.localeCompare(right.productName, 'pt-BR'),
    );
}

export function rejectPublicHoneypot(value: unknown): Result<void> {
  if (typeof value === 'string' && value.trim()) {
    return err(RESERVATION_REJECTED_ERROR);
  }
  return ok(undefined);
}

export function createPublicCode(random: () => number = Math.random): string {
  let code = '';
  for (let index = 0; index < PUBLIC_CODE_LENGTH; index += 1) {
    const pick = Math.floor(random() * PUBLIC_CODE_ALPHABET.length);
    code += PUBLIC_CODE_ALPHABET[pick] ?? 'A';
  }
  return code;
}
