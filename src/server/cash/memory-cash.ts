import {
  CASH_ADD_NOTE_REQUIRED_ERROR,
  CASH_KIND_ADDED,
  CASH_KIND_CHANGE,
  CASH_KIND_CREDIT_DEPOSIT,
  CASH_KIND_PAYMENT,
  CASH_KIND_RECEIVED,
  CASH_KIND_REMOVED,
  CASH_REMOVE_NOTE_REQUIRED_ERROR,
  CASH_SOURCE_ADDITION,
  CASH_SOURCE_PAYMENT,
  CASH_SOURCE_REMOVAL,
  CASH_SOURCE_SALE,
  CASH_STATUS_CLOSED,
  CASH_STATUS_OPEN,
  cashMovementSummary,
  cashSessionSummary,
  expectedCashCents,
  parseCashNote,
  parsePositiveCashCents,
  validateCashClose,
  validateCashMovement,
  validateCashOpen,
} from '../../domain/cash';
import { todayCivilSaoPaulo } from '../../domain/civil-date';
import { formatBrl } from '../../domain/money';
import { err, ok, type Result } from '../../domain/result';

const LOCAL_ACTOR_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000099';

export interface CashMovementView {
  id: string;
  kind: string;
  amountDeltaCents: number;
  amountLabel: string;
  summaryLabel: string;
  note: string;
  createdAt: string;
}

export interface CashSessionView {
  id: string;
  businessDate: string;
  status: typeof CASH_STATUS_OPEN | typeof CASH_STATUS_CLOSED;
  stale: boolean;
  openingFloatCents: number;
  openingFloatLabel: string;
  expectedCents: number;
  expectedLabel: string;
  countedCents: number | null;
  countedLabel: string | null;
  differenceCents: number | null;
  differenceLabel: string | null;
  closeNote: string;
  summaryLabel: string;
  movements: CashMovementView[];
}

export interface CashSetupView {
  businessDate: string;
  openSession: CashSessionView | null;
  recentSessions: CashSessionView[];
}

interface SessionRecord {
  id: string;
  business_date: string;
  status: string;
  opening_float_cents: string;
  opened_by: string;
  opened_at: string;
  closed_by: string;
  closed_at: string;
  expected_close_cents: string;
  counted_close_cents: string;
  difference_cents: string;
  close_note: string;
}

interface MovementRecord {
  id: string;
  cash_session_id: string;
  kind: string;
  amount_delta_cents: string;
  source_type: string;
  source_id: string;
  created_by: string;
  created_at: string;
  note: string;
}

function latestById<T extends { id: string }>(records: readonly T[]): T[] {
  const latest = new Map<string, T>();
  for (const record of records) {
    latest.set(record.id, record);
  }
  return [...latest.values()];
}

export class MemoryCash {
  private sessions: SessionRecord[] = [];
  private movements: MovementRecord[] = [];

  constructor(
    private readonly nowIso: () => string = () => new Date().toISOString(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  getSetup(): Result<CashSetupView> {
    const today = this.today();
    const sessions = latestById(this.sessions)
      .slice()
      .sort((left, right) =>
        right.business_date.localeCompare(left.business_date),
      );
    const open =
      sessions.find((item) => item.status === CASH_STATUS_OPEN) ?? null;
    return ok({
      businessDate: today,
      openSession: open ? this.toSession(open, today) : null,
      recentSessions: sessions.map((item) => this.toSession(item, today)),
    });
  }

  open(input: { openingFloatCents?: unknown }): Result<CashSetupView> {
    const today = this.today();
    const open = this.findOpen();
    const todaySession = this.findByDate(today);
    const planned = validateCashOpen({
      todayCivil: today,
      openingFloatCents: input.openingFloatCents,
      openSession: open ? { businessDate: open.business_date } : null,
      todaySession: todaySession ? { status: todaySession.status } : null,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    const now = this.nowIso();
    this.sessions.push({
      id: this.createId(),
      business_date: planned.data.business_date,
      status: CASH_STATUS_OPEN,
      opening_float_cents: String(planned.data.opening_float_cents),
      opened_by: LOCAL_ACTOR_ID,
      opened_at: now,
      closed_by: '',
      closed_at: '',
      expected_close_cents: '',
      counted_close_cents: '',
      difference_cents: '',
      close_note: '',
    });
    return this.getSetup();
  }

  addForChange(input: {
    amountCents: unknown;
    note: unknown;
  }): Result<CashSetupView> {
    const amount = parsePositiveCashCents(input.amountCents);
    if (!amount.ok) {
      return err(amount.error);
    }
    const note = parseCashNote(input.note, CASH_ADD_NOTE_REQUIRED_ERROR);
    if (!note.ok) {
      return err(note.error);
    }
    const recorded = this.recordMovement({
      kind: CASH_KIND_ADDED,
      amountDeltaCents: amount.data,
      sourceType: CASH_SOURCE_ADDITION,
      sourceId: '',
      note: note.data,
    });
    if (!recorded.ok) {
      return err(recorded.error);
    }
    return this.getSetup();
  }

  remove(input: {
    amountCents: unknown;
    note: unknown;
  }): Result<CashSetupView> {
    const amount = parsePositiveCashCents(input.amountCents);
    if (!amount.ok) {
      return err(amount.error);
    }
    const note = parseCashNote(input.note, CASH_REMOVE_NOTE_REQUIRED_ERROR);
    if (!note.ok) {
      return err(note.error);
    }
    const recorded = this.recordMovement({
      kind: CASH_KIND_REMOVED,
      amountDeltaCents: -amount.data,
      sourceType: CASH_SOURCE_REMOVAL,
      sourceId: '',
      note: note.data,
    });
    if (!recorded.ok) {
      return err(recorded.error);
    }
    return this.getSetup();
  }

  close(input: {
    countedCents: unknown;
    note?: unknown;
  }): Result<CashSetupView> {
    const open = this.findOpen();
    const planned = validateCashClose({
      openSession: open ? { expectedCents: this.expectedFor(open) } : null,
      countedCents: input.countedCents,
      note: input.note,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    if (!open) {
      return this.getSetup();
    }
    const now = this.nowIso();
    this.sessions.push({
      ...open,
      status: CASH_STATUS_CLOSED,
      closed_by: LOCAL_ACTOR_ID,
      closed_at: now,
      expected_close_cents: String(planned.data.expected_cents),
      counted_close_cents: String(planned.data.counted_cents),
      difference_cents: String(planned.data.difference_cents),
      close_note: planned.data.close_note,
    });
    return this.getSetup();
  }

  recordSaleCash(input: {
    saleId: string;
    tenderedCents: number;
    changeCents: number;
  }): Result<void> {
    const received = this.recordMovement({
      kind: CASH_KIND_RECEIVED,
      amountDeltaCents: input.tenderedCents,
      sourceType: CASH_SOURCE_SALE,
      sourceId: input.saleId,
      note: '',
    });
    if (!received.ok) {
      return err(received.error);
    }
    if (input.changeCents > 0) {
      const change = this.recordMovement({
        kind: CASH_KIND_CHANGE,
        amountDeltaCents: -input.changeCents,
        sourceType: CASH_SOURCE_SALE,
        sourceId: input.saleId,
        note: '',
      });
      if (!change.ok) {
        return err(change.error);
      }
    }
    return ok(undefined);
  }

  recordPaymentCash(input: {
    paymentId: string;
    amountCents: number;
  }): Result<void> {
    return this.recordMovement({
      kind: CASH_KIND_PAYMENT,
      amountDeltaCents: input.amountCents,
      sourceType: CASH_SOURCE_PAYMENT,
      sourceId: input.paymentId,
      note: '',
    });
  }

  recordCreditDepositCash(input: {
    paymentId: string;
    amountCents: number;
  }): Result<void> {
    return this.recordMovement({
      kind: CASH_KIND_CREDIT_DEPOSIT,
      amountDeltaCents: input.amountCents,
      sourceType: CASH_SOURCE_PAYMENT,
      sourceId: input.paymentId,
      note: '',
    });
  }

  assertCanMove(amountDeltaCents: number): Result<void> {
    const open = this.findOpen();
    const checked = validateCashMovement({
      todayCivil: this.today(),
      openSession: open
        ? {
            businessDate: open.business_date,
            expectedCents: this.expectedFor(open),
          }
        : null,
      amountDeltaCents,
    });
    if (!checked.ok) {
      return err(checked.error);
    }
    return ok(undefined);
  }

  private recordMovement(input: {
    kind: string;
    amountDeltaCents: number;
    sourceType: string;
    sourceId: string;
    note: string;
  }): Result<void> {
    const allowed = this.assertCanMove(input.amountDeltaCents);
    if (!allowed.ok) {
      return err(allowed.error);
    }
    const open = this.findOpen();
    if (!open) {
      return err({
        code: 'CASH_SESSION_REQUIRED',
        message:
          'Abra o caixa de hoje antes de movimentar dinheiro. PIX continua disponível sem caixa.',
        retryable: false,
      });
    }
    const movementId = this.createId();
    this.movements.push({
      id: movementId,
      cash_session_id: open.id,
      kind: input.kind,
      amount_delta_cents: String(input.amountDeltaCents),
      source_type: input.sourceType,
      source_id: input.sourceId || movementId,
      created_by: LOCAL_ACTOR_ID,
      created_at: this.nowIso(),
      note: input.note,
    });
    return ok(undefined);
  }

  private today(): string {
    return todayCivilSaoPaulo(this.nowIso());
  }

  private findOpen(): SessionRecord | null {
    return (
      latestById(this.sessions).find(
        (item) => item.status === CASH_STATUS_OPEN,
      ) ?? null
    );
  }

  private findByDate(businessDate: string): SessionRecord | null {
    return (
      latestById(this.sessions).find(
        (item) => item.business_date === businessDate,
      ) ?? null
    );
  }

  private expectedFor(session: SessionRecord): number {
    if (session.status === CASH_STATUS_CLOSED && session.expected_close_cents) {
      return Number(session.expected_close_cents);
    }
    const deltas = this.movements
      .filter((item) => item.cash_session_id === session.id)
      .map((item) => Number(item.amount_delta_cents));
    return expectedCashCents(Number(session.opening_float_cents), deltas);
  }

  private toSession(session: SessionRecord, today: string): CashSessionView {
    const expected = this.expectedFor(session);
    const counted =
      session.counted_close_cents === ''
        ? null
        : Number(session.counted_close_cents);
    const difference =
      session.difference_cents === '' ? null : Number(session.difference_cents);
    const opening = Number(session.opening_float_cents);
    return {
      id: session.id,
      businessDate: session.business_date,
      status:
        session.status === CASH_STATUS_CLOSED
          ? CASH_STATUS_CLOSED
          : CASH_STATUS_OPEN,
      stale:
        session.status === CASH_STATUS_OPEN && session.business_date < today,
      openingFloatCents: opening,
      openingFloatLabel: formatBrl(opening),
      expectedCents: expected,
      expectedLabel: formatBrl(expected),
      countedCents: counted,
      countedLabel: counted === null ? null : formatBrl(counted),
      differenceCents: difference,
      differenceLabel:
        difference === null
          ? null
          : difference === 0
            ? formatBrl(0)
            : `${difference > 0 ? '+' : '-'}${formatBrl(Math.abs(difference))}`,
      closeNote: session.close_note,
      summaryLabel: cashSessionSummary({
        status: session.status,
        businessDate: session.business_date,
        openingFloatCents: opening,
        expectedCents: expected,
        countedCents: counted,
        differenceCents: difference,
        todayCivil: today,
      }),
      movements: this.movements
        .filter((item) => item.cash_session_id === session.id)
        .slice()
        .reverse()
        .map((item) => {
          const delta = Number(item.amount_delta_cents);
          return {
            id: item.id,
            kind: item.kind,
            amountDeltaCents: delta,
            amountLabel: formatBrl(Math.abs(delta)),
            summaryLabel: cashMovementSummary(item.kind, delta),
            note: item.note,
            createdAt: item.created_at,
          };
        }),
    };
  }
}
