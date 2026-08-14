import {
  CREDIT_GUARDIAN_REQUIRED_ERROR,
  CREDIT_INSUFFICIENT_ERROR,
  CREDIT_KIND_DEPOSIT,
  CREDIT_KIND_REFUND,
  CREDIT_KIND_REVERSAL,
  CREDIT_KIND_SALE,
  CREDIT_OWNER_GUARDIAN,
  CREDIT_OWNER_STUDENT,
  CREDIT_SOURCE_OPERATION_REVERSAL,
  CREDIT_SOURCE_PAYMENT,
  CREDIT_SOURCE_REFUND,
  CREDIT_SOURCE_SALE,
  CREDIT_STUDENT_REQUIRED_ERROR,
  creditSummaryLabel,
  planCreditDeposit,
  planCreditRefund,
} from '../../domain/credit';
import {
  agendaBucket,
  dueDateShortcuts,
  formatCivilDisplay,
  todayCivilSaoPaulo,
} from '../../domain/civil-date';
import {
  INVENTORY_SALE_KIND,
  INVENTORY_SALE_RETURN_KIND,
} from '../../domain/inventory';
import { formatBrl } from '../../domain/money';
import { resolveSaleCharge } from '../../domain/sibling-authorization';
import {
  familyPaymentSummaryLabel,
  parsePaymentMethod,
  PAYMENT_METHOD_CASH,
  PAYMENT_METHOD_PIX,
  PAYMENT_CHILD_NOT_LINKED_ERROR,
  PAYMENT_GUARDIAN_REQUIRED_ERROR,
  PAYMENT_MODE_OLDEST_FIRST,
  PAYMENT_STATUS_COMPLETED,
  PAYMENT_STATUS_REVERSED,
  PAYMENT_STUDENT_REQUIRED_ERROR,
  paymentSummaryLabel,
  planFamilyPayment,
  planPaymentAllocations,
  type PaymentMethod,
} from '../../domain/payment';
import {
  dueDateLabelForDates,
  dueDateHistoryLabel,
  FIADO_STUDENT_REQUIRED_ERROR,
  planDueDateChange,
  planFiadoInstallments,
  planInterestCharge,
  RECEIVABLE_CHARGE_PRINCIPAL,
  RECEIVABLE_NOT_FOUND_ERROR,
  RECEIVABLE_REASON_SALE,
  RECEIVABLE_SETTLED_ERROR,
  RECEIVABLE_STATUS_OPEN,
  RECEIVABLE_STATUS_REVERSED,
  receivableSummaryLabel,
  type FiadoInstallmentInput,
} from '../../domain/receivable';
import { err, ok, type AppError, type Result } from '../../domain/result';
import {
  ANONYMOUS_SALE_LABEL,
  DEFAULT_PIX_COPY_TEXT,
  PAYMENT_FIADO,
  SALE_ITEMS_REQUIRED_ERROR,
  SALE_STATUS_PAID,
  SALE_STATUS_REVERSED,
  SETTLEMENT_CHANGE,
  SETTLEMENT_CASH,
  SETTLEMENT_CREDIT,
  SETTLEMENT_FIADO,
  SETTLEMENT_GUARDIAN_CREDIT,
  paymentKindFromSettlements,
  planSaleLine,
  planSaleTotals,
  planSettlements,
  saleSummaryLabel,
  type PaymentKind,
  type SaleLineInput,
} from '../../domain/sale';
import type { MemoryCatalog } from '../products/memory-catalog';
import type { MemoryStock } from '../inventory/memory-stock';
import type { MemoryRoster } from '../students/memory-roster';
import type { MemoryCash } from '../cash/memory-cash';
import type { MemoryReservations } from '../reservations/memory-reservations';
import {
  reservationHeldQuantity,
  RESERVATION_PICKUP_EXCEEDS_ERROR,
  RESERVED_OVERRIDE_FORBIDDEN_ERROR,
  RESERVED_OVERRIDE_MISMATCH_ERROR,
  RESERVED_OVERRIDE_REQUIRED_ERROR,
} from '../../domain/reservation';
import {
  CREDIT_REFUND_ALREADY_REVERSED_ERROR,
  CREDIT_REFUND_NOT_FOUND_ERROR,
  PAYMENT_ALREADY_REVERSED_ERROR,
  PAYMENT_NOT_FOUND_ERROR,
  REVERSAL_CREDIT_USED_ERROR,
  REVERSAL_CREDIT_WITH_DEBT_ERROR,
  REVERSAL_DIFFERENT_METHOD_ERROR,
  REVERSAL_EFFECT_CASH_RECOVERY,
  REVERSAL_EFFECT_CASH_REFUND,
  REVERSAL_EFFECT_CREDIT_REMOVE,
  REVERSAL_EFFECT_CREDIT_RESTORE,
  REVERSAL_EFFECT_DEBT_CANCELLED,
  REVERSAL_EFFECT_DEBT_REOPENED,
  REVERSAL_EFFECT_PIX_RECOVERY,
  REVERSAL_EFFECT_PIX_REFUND,
  REVERSAL_EFFECT_STOCK_RETURN,
  REVERSAL_NEGATIVE_CREDIT_ERROR,
  REVERSAL_NO_EXTERNAL_REFUND_ERROR,
  REVERSAL_OPERATION_CREDIT_REFUND,
  REVERSAL_OPERATION_PAYMENT,
  REVERSAL_OPERATION_SALE,
  REVERSAL_PAYMENTS_FIRST_ERROR,
  REVERSAL_REFUND_METHOD_REQUIRED_ERROR,
  REVERSAL_STOCK_DAY_REQUIRED_ERROR,
  SALE_ALREADY_REVERSED_ERROR,
  SALE_NOT_FOUND_ERROR,
  externalAmountFromSettlements,
  originalMethodsFromSettlements,
  parseDifferentMethodConfirmed,
  parseNullableReversalRefundMethod,
  parseReturnItemsToStock,
  parseReversalReason,
  parseReversalRefundMethod,
  paymentDestinationLabel,
  requiresDifferentMethodConfirmation,
  reversalEffectSummary,
  type ReversalEffectType,
  type ReversalOperationType,
  type ReversalRefundMethod,
} from '../../domain/reversal';

const LOCAL_ACTOR_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000099';

export interface SaleItemView {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountAmountCents: number;
  lineNetCents: number;
}

export interface SaleSettlementView {
  kind: string;
  amountCents: number;
}

export interface SaleView {
  id: string;
  consumerStudentId: string | null;
  consumerLabel: string;
  status: typeof SALE_STATUS_PAID | typeof SALE_STATUS_REVERSED;
  paymentKind: PaymentKind;
  grossTotalCents: number;
  discountTotalCents: number;
  netTotalCents: number;
  netLabel: string;
  cashTenderedCents: number;
  changeCents: number;
  changeLabel: string | null;
  dueDateLabel: string | null;
  settlements: SaleSettlementView[];
  items: SaleItemView[];
  summaryLabel: string;
  sourceReservationId: string | null;
  createdAt: string;
}

export interface ReceivableView {
  id: string;
  chargedStudentId: string;
  studentLabel: string;
  sourceSaleId: string;
  dueDate: string;
  dueDateLabel: string;
  amountCents: number;
  amountLabel: string;
  remainingCents: number;
  remainingLabel: string;
  status: typeof RECEIVABLE_STATUS_OPEN;
  bucket: 'overdue' | 'today' | 'upcoming';
  summaryLabel: string;
}

export interface PaymentView {
  id: string;
  payerStudentId: string;
  studentLabel: string;
  method: PaymentMethod;
  amountCents: number;
  amountLabel: string;
  status: typeof PAYMENT_STATUS_COMPLETED | typeof PAYMENT_STATUS_REVERSED;
  summaryLabel: string;
  createdAt: string;
}

export interface ReversibleSaleView {
  id: string;
  displayName: string;
  amountCents: number;
  externalAmountCents: number;
  originalMethods: ReversalRefundMethod[];
  hasTrackedItems: boolean;
  status: typeof SALE_STATUS_PAID | typeof SALE_STATUS_REVERSED;
  createdAt: string;
}

export interface ReversiblePaymentView {
  id: string;
  payerName: string;
  amountCents: number;
  method: PaymentMethod;
  destinationLabel: string;
  status: typeof PAYMENT_STATUS_COMPLETED | typeof PAYMENT_STATUS_REVERSED;
  createdAt: string;
}

export interface ReversibleCreditRefundView {
  id: string;
  ownerName: string;
  amountCents: number;
  method: ReversalRefundMethod;
  ownerType: typeof CREDIT_OWNER_STUDENT | typeof CREDIT_OWNER_GUARDIAN;
  reversed: boolean;
  createdAt: string;
}

export interface ReversalEffectView {
  type: ReversalEffectType;
  amountDeltaCents: number | null;
  quantityDelta: number | null;
  summaryLabel: string;
}

export interface ReversalRecordView {
  id: string;
  operationType: ReversalOperationType;
  operationId: string;
  reason: string;
  refundMethod: ReversalRefundMethod | null;
  differentMethodConfirmed: boolean;
  returnedToStock: boolean | null;
  createdByName: string;
  createdAt: string;
  effects: ReversalEffectView[];
}

export interface ReversalsSetupView {
  sales: ReversibleSaleView[];
  payments: ReversiblePaymentView[];
  creditRefunds: ReversibleCreditRefundView[];
  recentReversals: ReversalRecordView[];
}

export interface CreditView {
  id: string;
  ownerType: typeof CREDIT_OWNER_STUDENT | typeof CREDIT_OWNER_GUARDIAN;
  studentId: string | null;
  guardianId: string | null;
  ownerLabel: string;
  balanceCents: number;
  balanceLabel: string;
  summaryLabel: string;
}

export interface DueDateHistoryView {
  receivableId: string;
  studentLabel: string;
  oldDueDate: string;
  oldDueDateLabel: string;
  newDueDate: string;
  newDueDateLabel: string;
  reason: string;
  summaryLabel: string;
}

export interface ReceivableAgendaView {
  overdue: ReceivableView[];
  today: ReceivableView[];
  upcoming: ReceivableView[];
  dueDateHistory: DueDateHistoryView[];
}

interface SaleRecord {
  id: string;
  consumer_student_id: string;
  charged_student_id: string;
  status: string;
  gross_total_cents: string;
  discount_total_cents: string;
  net_total_cents: string;
  source_reservation_id: string;
  created_by: string;
  created_at: string;
  reversal_id: string;
}

interface SaleItemRecord {
  id: string;
  sale_id: string;
  product_id: string;
  item_kind: string;
  description_snapshot: string;
  quantity: string;
  unit_price_cents: string;
  discount_kind: string;
  discount_input: string;
  discount_amount_cents: string;
  line_net_total_cents: string;
}

interface SettlementRecord {
  id: string;
  sale_id: string;
  kind: string;
  amount_cents: string;
  related_entity_id: string;
  created_at: string;
}

interface ReceivableRecord {
  id: string;
  charged_student_id: string;
  source_sale_id: string;
  due_date: string;
  status: string;
  created_by: string;
  created_at: string;
}

interface ReceivableChargeRecord {
  id: string;
  receivable_id: string;
  kind: string;
  amount_cents: string;
  reason_code: string;
  note: string;
  created_by: string;
  created_at: string;
  reversal_id: string;
}

interface PaymentRecord {
  id: string;
  payer_guardian_id: string;
  payer_student_id: string;
  method: PaymentMethod;
  amount_received_cents: string;
  status: string;
  created_by: string;
  created_at: string;
  note: string;
}

interface PaymentAllocationRecord {
  payment_id: string;
  receivable_id: string;
  student_id: string;
  amount_cents: string;
}

interface PaymentCreditAllocationRecord {
  payment_id: string;
  credit_account_id: string;
  amount_cents: string;
}

interface CreditAccountRecord {
  id: string;
  owner_type: typeof CREDIT_OWNER_STUDENT | typeof CREDIT_OWNER_GUARDIAN;
  owner_student_id: string;
  owner_guardian_id: string;
  active: string;
  created_at: string;
}

interface CreditAccountStudentRecord {
  credit_account_id: string;
  student_id: string;
  can_use: string;
  active: string;
}

interface CreditMovementRecord {
  credit_account_id: string;
  kind: string;
  amount_delta_cents: string;
  source_type: string;
  source_id: string;
  student_id: string;
  created_by: string;
  created_at: string;
  note: string;
}

interface DueDateHistoryRecord {
  receivable_id: string;
  old_due_date: string;
  new_due_date: string;
  reason: string;
  changed_by: string;
  changed_at: string;
}

interface OperationReversalRecord {
  id: string;
  operation_type: ReversalOperationType;
  operation_id: string;
  reason: string;
  original_methods: string;
  refund_method: string;
  different_method_confirmed: string;
  returned_to_stock: string;
  created_by: string;
  created_at: string;
}

interface ReversalEffectRecord {
  id: string;
  reversal_id: string;
  effect_type: ReversalEffectType;
  entity_type: string;
  entity_id: string;
  amount_delta_cents: string;
  quantity_delta: string;
}

function fail(error: AppError): never {
  throw new Error(`${error.code}: ${error.message}`);
}

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) {
    fail(result.error);
  }
  return result.data;
}

function latestById<T extends { id: string }>(records: readonly T[]): T[] {
  const latest = new Map<string, T>();
  for (const record of records) {
    latest.set(record.id, record);
  }
  return [...latest.values()];
}

export class MemorySales {
  private sales: SaleRecord[] = [];
  private items: SaleItemRecord[] = [];
  private settlements: SettlementRecord[] = [];
  private receivables: ReceivableRecord[] = [];
  private charges: ReceivableChargeRecord[] = [];
  private payments: PaymentRecord[] = [];
  private allocations: PaymentAllocationRecord[] = [];
  private creditAccounts: CreditAccountRecord[] = [];
  private creditAccountStudents: CreditAccountStudentRecord[] = [];
  private creditMovements: CreditMovementRecord[] = [];
  private paymentCreditAllocations: PaymentCreditAllocationRecord[] = [];
  private dueDateHistory: DueDateHistoryRecord[] = [];
  private operationReversals: OperationReversalRecord[] = [];
  private reversalEffects: ReversalEffectRecord[] = [];

  constructor(
    private readonly catalog: MemoryCatalog,
    private readonly stock: MemoryStock,
    private readonly roster: MemoryRoster,
    private readonly cash: MemoryCash,
    private readonly nowIso: () => string = () => new Date().toISOString(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  private reservations: MemoryReservations | null = null;

  bindReservations(reservations: MemoryReservations): void {
    this.reservations = reservations;
  }

  getPixCopyText(): Result<{ text: string }> {
    return ok({ text: DEFAULT_PIX_COPY_TEXT });
  }

  getDueDateShortcuts(): Result<{
    today: string;
    tomorrow: string;
    nextFriday: string;
    plus7: string;
  }> {
    return ok(dueDateShortcuts(todayCivilSaoPaulo(this.nowIso())));
  }

  listSales(): Result<SaleView[]> {
    return ok(
      latestById(this.sales)
        .slice()
        .reverse()
        .map((sale) => this.toSale(sale)),
    );
  }

  listReceivables(): Result<ReceivableAgendaView> {
    const today = todayCivilSaoPaulo(this.nowIso());
    const overdue: ReceivableView[] = [];
    const dueToday: ReceivableView[] = [];
    const upcoming: ReceivableView[] = [];
    for (const receivable of latestById(this.receivables)) {
      if (this.remainingCents(receivable.id) <= 0) {
        continue;
      }
      const view = this.toReceivable(receivable, today);
      if (view.bucket === 'overdue') {
        overdue.push(view);
      } else if (view.bucket === 'today') {
        dueToday.push(view);
      } else {
        upcoming.push(view);
      }
    }
    overdue.sort((left, right) => left.dueDate.localeCompare(right.dueDate));
    dueToday.sort((left, right) => left.dueDate.localeCompare(right.dueDate));
    upcoming.sort((left, right) => left.dueDate.localeCompare(right.dueDate));
    return ok({
      overdue,
      today: dueToday,
      upcoming,
      dueDateHistory: this.dueDateHistory
        .slice()
        .reverse()
        .map((item) => this.toDueDateHistory(item)),
    });
  }

  listPayments(): Result<PaymentView[]> {
    return ok(
      latestById(this.payments)
        .slice()
        .reverse()
        .map((payment) => this.toPayment(payment)),
    );
  }

  createPayment(input: {
    studentId?: string | null;
    amountCents: unknown;
    method: unknown;
    mode: unknown;
    selectedReceivableIds?: readonly string[];
    allocations?: readonly { receivableId?: unknown; amountCents?: unknown }[];
  }): Result<PaymentView> {
    if (!input.studentId) {
      return err(PAYMENT_STUDENT_REQUIRED_ERROR);
    }
    const student = this.roster.getStudent(input.studentId);
    if (!student.ok) {
      return err(student.error);
    }
    const method = parsePaymentMethod(input.method);
    if (!method.ok) {
      return err(method.error);
    }
    const planned = planPaymentAllocations({
      amountCents: input.amountCents,
      mode: input.mode,
      receivables: this.receivables
        .filter((item) => item.charged_student_id === student.data.id)
        .map((item) => ({
          id: item.id,
          charged_student_id: item.charged_student_id,
          due_date: item.due_date,
          created_at: item.created_at,
          remaining_cents: this.remainingCents(item.id),
        })),
      selectedReceivableIds: input.selectedReceivableIds,
      allocations: input.allocations,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    if (method.data === PAYMENT_METHOD_CASH) {
      const allowed = this.cash.assertCanMove(Number(input.amountCents));
      if (!allowed.ok) {
        return err(allowed.error);
      }
    }
    const now = this.nowIso();
    const payment: PaymentRecord = {
      id: this.createId(),
      payer_guardian_id: '',
      payer_student_id: student.data.id,
      method: method.data,
      amount_received_cents: String(input.amountCents),
      status: PAYMENT_STATUS_COMPLETED,
      created_by: LOCAL_ACTOR_ID,
      created_at: now,
      note: '',
    };
    this.payments.push(payment);
    for (const row of planned.data) {
      this.allocations.push({
        payment_id: payment.id,
        receivable_id: row.receivable_id,
        student_id: row.student_id,
        amount_cents: row.amount_cents,
      });
    }
    if (method.data === PAYMENT_METHOD_CASH) {
      const recorded = this.cash.recordPaymentCash({
        paymentId: payment.id,
        amountCents: Number(input.amountCents),
      });
      if (!recorded.ok) {
        return err(recorded.error);
      }
    }
    return ok(this.toPayment(payment));
  }

  createFamilyPayment(input: {
    guardianId?: string | null;
    studentId?: string | null;
    amountCents: unknown;
    method: unknown;
    mode: unknown;
    selectedReceivableIds?: readonly string[];
    allocations?: readonly { receivableId?: unknown; amountCents?: unknown }[];
  }): Result<PaymentView> {
    if (!input.guardianId) {
      return err(PAYMENT_GUARDIAN_REQUIRED_ERROR);
    }
    const guardian = this.roster.getGuardian(input.guardianId);
    if (!guardian.ok) {
      return err(guardian.error);
    }
    const method = parsePaymentMethod(input.method);
    if (!method.ok) {
      return err(method.error);
    }
    const linkedStudentIds = new Set(
      this.roster
        .listActiveGuardianLinks()
        .filter((link) => link.guardianId === guardian.data.id)
        .map((link) => link.studentId),
    );
    if (input.mode === PAYMENT_MODE_OLDEST_FIRST && input.studentId) {
      if (!linkedStudentIds.has(input.studentId)) {
        return err(PAYMENT_CHILD_NOT_LINKED_ERROR);
      }
    }
    const planned = planFamilyPayment({
      amountCents: input.amountCents,
      mode: input.mode,
      studentId: input.studentId,
      receivables: this.receivables
        .filter((item) => linkedStudentIds.has(item.charged_student_id))
        .map((item) => ({
          id: item.id,
          charged_student_id: item.charged_student_id,
          due_date: item.due_date,
          created_at: item.created_at,
          remaining_cents: this.remainingCents(item.id),
        })),
      selectedReceivableIds: input.selectedReceivableIds,
      allocations: input.allocations,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    const receivedCents =
      planned.data.allocations.reduce(
        (total, row) => total + Number(row.amount_cents),
        0,
      ) + planned.data.creditCents;
    if (method.data === PAYMENT_METHOD_CASH) {
      const allowed = this.cash.assertCanMove(receivedCents);
      if (!allowed.ok) {
        return err(allowed.error);
      }
    }
    const now = this.nowIso();
    const payment: PaymentRecord = {
      id: this.createId(),
      payer_guardian_id: guardian.data.id,
      payer_student_id: '',
      method: method.data,
      amount_received_cents: String(receivedCents),
      status: PAYMENT_STATUS_COMPLETED,
      created_by: LOCAL_ACTOR_ID,
      created_at: now,
      note: '',
    };
    this.payments.push(payment);
    for (const row of planned.data.allocations) {
      this.allocations.push({
        payment_id: payment.id,
        receivable_id: row.receivable_id,
        student_id: row.student_id,
        amount_cents: row.amount_cents,
      });
    }
    if (planned.data.creditCents > 0) {
      const account = this.ensureGuardianCreditAccount(guardian.data.id, now);
      this.creditMovements.push({
        credit_account_id: account.id,
        kind: CREDIT_KIND_DEPOSIT,
        amount_delta_cents: String(planned.data.creditCents),
        source_type: CREDIT_SOURCE_PAYMENT,
        source_id: payment.id,
        student_id: '',
        created_by: LOCAL_ACTOR_ID,
        created_at: now,
        note: '',
      });
      this.paymentCreditAllocations.push({
        payment_id: payment.id,
        credit_account_id: account.id,
        amount_cents: String(planned.data.creditCents),
      });
    }
    if (method.data === PAYMENT_METHOD_CASH) {
      const recorded = this.cash.recordPaymentCash({
        paymentId: payment.id,
        amountCents: receivedCents,
      });
      if (!recorded.ok) {
        return err(recorded.error);
      }
    }
    return ok(this.toPayment(payment));
  }

  listCreditAccounts(): Result<CreditView[]> {
    const personal = this.creditAccounts
      .filter((account) => account.owner_type === CREDIT_OWNER_STUDENT)
      .slice()
      .reverse()
      .map((account) => this.toCredit(account));
    const guardians = this.creditAccounts
      .filter((account) => account.owner_type === CREDIT_OWNER_GUARDIAN)
      .slice()
      .reverse()
      .map((account) => this.toCredit(account));
    return ok([...personal, ...guardians]);
  }

  depositPersonalCredit(input: {
    studentId?: string | null;
    amountCents: unknown;
    method: unknown;
  }): Result<CreditView> {
    if (!input.studentId) {
      return err(CREDIT_STUDENT_REQUIRED_ERROR);
    }
    const student = this.roster.getStudent(input.studentId);
    if (!student.ok) {
      return err(student.error);
    }
    const method = parsePaymentMethod(input.method);
    if (!method.ok) {
      return err(method.error);
    }
    const planned = planCreditDeposit({
      amountCents: input.amountCents,
      receivables: this.receivables
        .filter((item) => item.charged_student_id === student.data.id)
        .map((item) => ({
          id: item.id,
          charged_student_id: item.charged_student_id,
          due_date: item.due_date,
          created_at: item.created_at,
          remaining_cents: this.remainingCents(item.id),
        })),
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    if (method.data === PAYMENT_METHOD_CASH) {
      const allowed = this.cash.assertCanMove(Number(input.amountCents));
      if (!allowed.ok) {
        return err(allowed.error);
      }
    }
    const now = this.nowIso();
    const payment: PaymentRecord = {
      id: this.createId(),
      payer_guardian_id: '',
      payer_student_id: student.data.id,
      method: method.data,
      amount_received_cents: String(input.amountCents),
      status: PAYMENT_STATUS_COMPLETED,
      created_by: LOCAL_ACTOR_ID,
      created_at: now,
      note: '',
    };
    this.payments.push(payment);
    for (const row of planned.data.allocations) {
      this.allocations.push({
        payment_id: payment.id,
        receivable_id: row.receivable_id,
        student_id: row.student_id,
        amount_cents: row.amount_cents,
      });
    }
    const account = this.ensurePersonalCreditAccount(student.data.id, now);
    if (planned.data.creditCents > 0) {
      this.creditMovements.push({
        credit_account_id: account.id,
        kind: CREDIT_KIND_DEPOSIT,
        amount_delta_cents: String(planned.data.creditCents),
        source_type: CREDIT_SOURCE_PAYMENT,
        source_id: payment.id,
        student_id: student.data.id,
        created_by: LOCAL_ACTOR_ID,
        created_at: now,
        note: '',
      });
      this.paymentCreditAllocations.push({
        payment_id: payment.id,
        credit_account_id: account.id,
        amount_cents: String(planned.data.creditCents),
      });
    }
    if (method.data === PAYMENT_METHOD_CASH) {
      const recorded = this.cash.recordCreditDepositCash({
        paymentId: payment.id,
        amountCents: Number(input.amountCents),
      });
      if (!recorded.ok) {
        return err(recorded.error);
      }
    }
    return ok(this.toCredit(account));
  }

  refundPersonalCredit(input: {
    studentId?: string | null;
    amountCents: unknown;
    reason: unknown;
  }): Result<CreditView> {
    if (!input.studentId) {
      return err(CREDIT_STUDENT_REQUIRED_ERROR);
    }
    const student = this.roster.getStudent(input.studentId);
    if (!student.ok) {
      return err(student.error);
    }
    const account = this.findPersonalCreditAccount(student.data.id);
    const planned = planCreditRefund({
      amountCents: input.amountCents,
      balanceCents: account ? this.creditBalanceCents(account.id) : 0,
      reason: input.reason,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    if (!account) {
      return err(CREDIT_INSUFFICIENT_ERROR);
    }
    this.creditMovements.push({
      credit_account_id: account.id,
      kind: CREDIT_KIND_REFUND,
      amount_delta_cents: String(-Number(planned.data.amount_cents)),
      source_type: CREDIT_SOURCE_REFUND,
      source_id: this.createId(),
      student_id: student.data.id,
      created_by: LOCAL_ACTOR_ID,
      created_at: this.nowIso(),
      note: planned.data.note,
    });
    return ok(this.toCredit(account));
  }

  depositGuardianCredit(input: {
    guardianId?: string | null;
    amountCents: unknown;
    method: unknown;
  }): Result<CreditView> {
    if (!input.guardianId) {
      return err(CREDIT_GUARDIAN_REQUIRED_ERROR);
    }
    const guardian = this.roster.getGuardian(input.guardianId);
    if (!guardian.ok) {
      return err(guardian.error);
    }
    const method = parsePaymentMethod(input.method);
    if (!method.ok) {
      return err(method.error);
    }
    const autoSettleStudentIds = new Set(
      this.roster
        .listActiveGuardianLinks()
        .filter(
          (link) =>
            link.guardianId === guardian.data.id &&
            link.autoSettleDebtFromGuardianCredit,
        )
        .map((link) => link.studentId),
    );
    const planned = planCreditDeposit({
      amountCents: input.amountCents,
      receivables: this.receivables
        .filter((item) => autoSettleStudentIds.has(item.charged_student_id))
        .map((item) => ({
          id: item.id,
          charged_student_id: item.charged_student_id,
          due_date: item.due_date,
          created_at: item.created_at,
          remaining_cents: this.remainingCents(item.id),
        })),
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    if (method.data === PAYMENT_METHOD_CASH) {
      const allowed = this.cash.assertCanMove(Number(input.amountCents));
      if (!allowed.ok) {
        return err(allowed.error);
      }
    }
    const now = this.nowIso();
    const payment: PaymentRecord = {
      id: this.createId(),
      payer_guardian_id: guardian.data.id,
      payer_student_id: '',
      method: method.data,
      amount_received_cents: String(input.amountCents),
      status: PAYMENT_STATUS_COMPLETED,
      created_by: LOCAL_ACTOR_ID,
      created_at: now,
      note: '',
    };
    this.payments.push(payment);
    for (const row of planned.data.allocations) {
      this.allocations.push({
        payment_id: payment.id,
        receivable_id: row.receivable_id,
        student_id: row.student_id,
        amount_cents: row.amount_cents,
      });
    }
    const account = this.ensureGuardianCreditAccount(guardian.data.id, now);
    if (planned.data.creditCents > 0) {
      this.creditMovements.push({
        credit_account_id: account.id,
        kind: CREDIT_KIND_DEPOSIT,
        amount_delta_cents: String(planned.data.creditCents),
        source_type: CREDIT_SOURCE_PAYMENT,
        source_id: payment.id,
        student_id: '',
        created_by: LOCAL_ACTOR_ID,
        created_at: now,
        note: '',
      });
      this.paymentCreditAllocations.push({
        payment_id: payment.id,
        credit_account_id: account.id,
        amount_cents: String(planned.data.creditCents),
      });
    }
    if (method.data === PAYMENT_METHOD_CASH) {
      const recorded = this.cash.recordCreditDepositCash({
        paymentId: payment.id,
        amountCents: Number(input.amountCents),
      });
      if (!recorded.ok) {
        return err(recorded.error);
      }
    }
    return ok(this.toCredit(account));
  }

  refundGuardianCredit(input: {
    guardianId?: string | null;
    amountCents: unknown;
    reason: unknown;
  }): Result<CreditView> {
    if (!input.guardianId) {
      return err(CREDIT_GUARDIAN_REQUIRED_ERROR);
    }
    const guardian = this.roster.getGuardian(input.guardianId);
    if (!guardian.ok) {
      return err(guardian.error);
    }
    const account = this.findGuardianCreditAccount(guardian.data.id);
    const planned = planCreditRefund({
      amountCents: input.amountCents,
      balanceCents: account ? this.creditBalanceCents(account.id) : 0,
      reason: input.reason,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    if (!account) {
      return err(CREDIT_INSUFFICIENT_ERROR);
    }
    this.creditMovements.push({
      credit_account_id: account.id,
      kind: CREDIT_KIND_REFUND,
      amount_delta_cents: String(-Number(planned.data.amount_cents)),
      source_type: CREDIT_SOURCE_REFUND,
      source_id: this.createId(),
      student_id: '',
      created_by: LOCAL_ACTOR_ID,
      created_at: this.nowIso(),
      note: planned.data.note,
    });
    return ok(this.toCredit(account));
  }

  getReversalsSetup(): Result<ReversalsSetupView> {
    return ok(this.toReversalsSetup());
  }

  reverseSale(input: {
    saleId?: string | null;
    refundMethod?: unknown;
    confirmDifferentMethod?: unknown;
    returnItemsToStock?: unknown;
    reason?: unknown;
  }): Result<ReversalsSetupView> {
    const sale = latestById(this.sales).find(
      (item) => item.id === input.saleId,
    );
    if (!sale) {
      return err(SALE_NOT_FOUND_ERROR);
    }
    if (sale.status === SALE_STATUS_REVERSED) {
      return err(SALE_ALREADY_REVERSED_ERROR);
    }
    const reason = parseReversalReason(input.reason);
    if (!reason.ok) {
      return err(reason.error);
    }
    const returnItems = parseReturnItemsToStock(input.returnItemsToStock);
    if (!returnItems.ok) {
      return err(returnItems.error);
    }
    const refundMethod = parseNullableReversalRefundMethod(input.refundMethod);
    if (!refundMethod.ok) {
      return err(refundMethod.error);
    }
    const confirmed = parseDifferentMethodConfirmed(
      input.confirmDifferentMethod,
    );
    if (!confirmed.ok) {
      return err(confirmed.error);
    }
    const settlementRows = this.settlements.filter(
      (item) => item.sale_id === sale.id,
    );
    const settlements = settlementRows.map((item) => ({
      kind: item.kind,
      amountCents: Number(item.amount_cents),
    }));
    const originalMethods = originalMethodsFromSettlements(settlements);
    const externalAmountCents = externalAmountFromSettlements(settlements);
    if (externalAmountCents > 0 && refundMethod.data === null) {
      return err(REVERSAL_REFUND_METHOD_REQUIRED_ERROR);
    }
    if (externalAmountCents === 0 && refundMethod.data !== null) {
      return err(REVERSAL_NO_EXTERNAL_REFUND_ERROR);
    }
    const different = requiresDifferentMethodConfirmation({
      originalMethods,
      refundMethod: refundMethod.data,
      externalAmountCents,
    });
    if (different && !confirmed.data) {
      return err(REVERSAL_DIFFERENT_METHOD_ERROR);
    }
    const saleReceivables = latestById(this.receivables).filter(
      (item) => item.source_sale_id === sale.id,
    );
    for (const receivable of saleReceivables) {
      if (this.paidCents(receivable.id) > 0) {
        return err(REVERSAL_PAYMENTS_FIRST_ERROR);
      }
    }
    const trackedReturns = this.trackedReturnQuantities(sale.id);
    if (returnItems.data && trackedReturns.size > 0) {
      const sample = [...trackedReturns.keys()][0];
      if (!sample) {
        return err(REVERSAL_STOCK_DAY_REQUIRED_ERROR);
      }
      const available = this.stock.availableQuantity(sample);
      if (!available.ok) {
        return err(REVERSAL_STOCK_DAY_REQUIRED_ERROR);
      }
    }
    if (refundMethod.data === PAYMENT_METHOD_CASH && externalAmountCents > 0) {
      const allowed = this.cash.assertCanMove(-externalAmountCents);
      if (!allowed.ok) {
        return err(allowed.error);
      }
    }
    const creditMovements = this.creditMovements.filter(
      (item) =>
        item.source_type === CREDIT_SOURCE_SALE && item.source_id === sale.id,
    );
    for (const movement of creditMovements) {
      const account = this.creditAccounts.find(
        (item) => item.id === movement.credit_account_id,
      );
      if (
        !account ||
        account.owner_type !== CREDIT_OWNER_STUDENT ||
        !account.owner_student_id
      ) {
        continue;
      }
      const future =
        this.creditBalanceCents(account.id) +
        Math.abs(Number(movement.amount_delta_cents));
      if (future < 0) {
        return err(REVERSAL_NEGATIVE_CREDIT_ERROR);
      }
      if (future > 0) {
        const allowed = this.assertStudentCanReceiveCredit(
          account.owner_student_id,
          sale.id,
        );
        if (!allowed.ok) {
          return err(allowed.error);
        }
      }
    }
    const now = this.nowIso();
    const reversalId = this.createId();
    this.operationReversals.push({
      id: reversalId,
      operation_type: REVERSAL_OPERATION_SALE,
      operation_id: sale.id,
      reason: reason.data,
      original_methods: originalMethods.join(','),
      refund_method: refundMethod.data ?? '',
      different_method_confirmed: different ? 'true' : 'false',
      returned_to_stock: returnItems.data ? 'true' : 'false',
      created_by: LOCAL_ACTOR_ID,
      created_at: now,
    });
    this.sales.push({
      ...sale,
      status: SALE_STATUS_REVERSED,
      reversal_id: reversalId,
    });
    for (const receivable of saleReceivables) {
      this.receivables.push({
        ...receivable,
        status: RECEIVABLE_STATUS_REVERSED,
      });
      this.addEffect({
        reversalId,
        type: REVERSAL_EFFECT_DEBT_CANCELLED,
        entityType: 'receivable',
        entityId: receivable.id,
        amountDeltaCents: -this.chargeCents(receivable.id),
        quantityDelta: null,
      });
    }
    for (const movement of creditMovements) {
      const restored = Math.abs(Number(movement.amount_delta_cents));
      this.creditMovements.push({
        credit_account_id: movement.credit_account_id,
        kind: CREDIT_KIND_REVERSAL,
        amount_delta_cents: String(restored),
        source_type: CREDIT_SOURCE_OPERATION_REVERSAL,
        source_id: reversalId,
        student_id: movement.student_id,
        created_by: LOCAL_ACTOR_ID,
        created_at: now,
        note: reason.data,
      });
      this.addEffect({
        reversalId,
        type: REVERSAL_EFFECT_CREDIT_RESTORE,
        entityType: 'credit_account',
        entityId: movement.credit_account_id,
        amountDeltaCents: restored,
        quantityDelta: null,
      });
    }
    if (externalAmountCents > 0 && refundMethod.data) {
      const outgoing = this.recordOutgoingRefund({
        reversalId,
        amountCents: externalAmountCents,
        method: refundMethod.data,
        reason: reason.data,
      });
      if (!outgoing.ok) {
        return err(outgoing.error);
      }
    }
    if (returnItems.data) {
      for (const [productId, quantity] of trackedReturns) {
        const moved = this.stock.recordSourceMovement({
          productId,
          quantityDelta: quantity,
          kind: INVENTORY_SALE_RETURN_KIND,
          sourceType: CREDIT_SOURCE_OPERATION_REVERSAL,
          sourceId: reversalId,
          reason: reason.data,
        });
        if (!moved.ok) {
          return err(moved.error);
        }
        this.addEffect({
          reversalId,
          type: REVERSAL_EFFECT_STOCK_RETURN,
          entityType: 'product',
          entityId: productId,
          amountDeltaCents: null,
          quantityDelta: quantity,
        });
      }
    }
    return ok(this.toReversalsSetup());
  }

  reversePayment(input: {
    paymentId?: string | null;
    refundMethod?: unknown;
    confirmDifferentMethod?: unknown;
    reason?: unknown;
  }): Result<ReversalsSetupView> {
    const payment = latestById(this.payments).find(
      (item) => item.id === input.paymentId,
    );
    if (!payment) {
      return err(PAYMENT_NOT_FOUND_ERROR);
    }
    if (payment.status === PAYMENT_STATUS_REVERSED) {
      return err(PAYMENT_ALREADY_REVERSED_ERROR);
    }
    const reason = parseReversalReason(input.reason);
    if (!reason.ok) {
      return err(reason.error);
    }
    const refundMethod = parseReversalRefundMethod(input.refundMethod);
    if (!refundMethod.ok) {
      return err(refundMethod.error);
    }
    const confirmed = parseDifferentMethodConfirmed(
      input.confirmDifferentMethod,
    );
    if (!confirmed.ok) {
      return err(confirmed.error);
    }
    const different = payment.method !== refundMethod.data;
    if (different && !confirmed.data) {
      return err(REVERSAL_DIFFERENT_METHOD_ERROR);
    }
    const deposits = this.creditMovements.filter(
      (item) =>
        item.source_type === CREDIT_SOURCE_PAYMENT &&
        item.source_id === payment.id &&
        item.kind === CREDIT_KIND_DEPOSIT,
    );
    for (const movement of deposits) {
      const next =
        this.creditBalanceCents(movement.credit_account_id) -
        Number(movement.amount_delta_cents);
      if (next < 0) {
        return err(REVERSAL_CREDIT_USED_ERROR);
      }
      const account = this.creditAccounts.find(
        (item) => item.id === movement.credit_account_id,
      );
      if (
        next > 0 &&
        account?.owner_type === CREDIT_OWNER_STUDENT &&
        account.owner_student_id
      ) {
        const allowed = this.assertStudentCanReceiveCredit(
          account.owner_student_id,
          undefined,
          payment.id,
        );
        if (!allowed.ok) {
          return err(allowed.error);
        }
      }
    }
    if (payment.payer_student_id) {
      const account = this.findPersonalCreditAccount(payment.payer_student_id);
      const depositForPayer = deposits
        .filter((item) => item.student_id === payment.payer_student_id)
        .reduce((total, item) => total + Number(item.amount_delta_cents), 0);
      const future = account
        ? this.creditBalanceCents(account.id) - depositForPayer
        : 0;
      if (future > 0) {
        const allowed = this.assertStudentCanReceiveCredit(
          payment.payer_student_id,
          undefined,
          payment.id,
        );
        if (!allowed.ok) {
          return err(allowed.error);
        }
      }
    }
    const amountCents = Number(payment.amount_received_cents);
    if (refundMethod.data === PAYMENT_METHOD_CASH) {
      const allowed = this.cash.assertCanMove(-amountCents);
      if (!allowed.ok) {
        return err(allowed.error);
      }
    }
    const now = this.nowIso();
    const reversalId = this.createId();
    this.operationReversals.push({
      id: reversalId,
      operation_type: REVERSAL_OPERATION_PAYMENT,
      operation_id: payment.id,
      reason: reason.data,
      original_methods: payment.method,
      refund_method: refundMethod.data,
      different_method_confirmed: different ? 'true' : 'false',
      returned_to_stock: '',
      created_by: LOCAL_ACTOR_ID,
      created_at: now,
    });
    this.payments.push({
      ...payment,
      status: PAYMENT_STATUS_REVERSED,
    });
    for (const movement of deposits) {
      this.creditMovements.push({
        credit_account_id: movement.credit_account_id,
        kind: CREDIT_KIND_REVERSAL,
        amount_delta_cents: String(-Number(movement.amount_delta_cents)),
        source_type: CREDIT_SOURCE_OPERATION_REVERSAL,
        source_id: reversalId,
        student_id: movement.student_id,
        created_by: LOCAL_ACTOR_ID,
        created_at: now,
        note: reason.data,
      });
      this.addEffect({
        reversalId,
        type:
          Number(movement.amount_delta_cents) > 0
            ? REVERSAL_EFFECT_CREDIT_REMOVE
            : REVERSAL_EFFECT_CREDIT_RESTORE,
        entityType: 'credit_account',
        entityId: movement.credit_account_id,
        amountDeltaCents: -Number(movement.amount_delta_cents),
        quantityDelta: null,
      });
    }
    const seenReceivables = new Set<string>();
    for (const allocation of this.allocations.filter(
      (item) => item.payment_id === payment.id,
    )) {
      if (seenReceivables.has(allocation.receivable_id)) {
        continue;
      }
      seenReceivables.add(allocation.receivable_id);
      const receivable = latestById(this.receivables).find(
        (item) => item.id === allocation.receivable_id,
      );
      if (!receivable || receivable.status === RECEIVABLE_STATUS_REVERSED) {
        continue;
      }
      this.addEffect({
        reversalId,
        type: REVERSAL_EFFECT_DEBT_REOPENED,
        entityType: 'receivable',
        entityId: allocation.receivable_id,
        amountDeltaCents: Number(allocation.amount_cents),
        quantityDelta: null,
      });
    }
    const outgoing = this.recordOutgoingRefund({
      reversalId,
      amountCents,
      method: refundMethod.data,
      reason: reason.data,
    });
    if (!outgoing.ok) {
      return err(outgoing.error);
    }
    return ok(this.toReversalsSetup());
  }

  reverseCreditRefund(input: {
    creditMovementId?: string | null;
    recoveryMethod?: unknown;
    confirmDifferentMethod?: unknown;
    reason?: unknown;
  }): Result<ReversalsSetupView> {
    const refund = this.creditMovements.find(
      (item) =>
        item.kind === CREDIT_KIND_REFUND &&
        item.source_id === input.creditMovementId,
    );
    if (!refund || !refund.source_id) {
      return err(CREDIT_REFUND_NOT_FOUND_ERROR);
    }
    if (
      this.operationReversals.some(
        (item) =>
          item.operation_type === REVERSAL_OPERATION_CREDIT_REFUND &&
          item.operation_id === refund.source_id,
      )
    ) {
      return err(CREDIT_REFUND_ALREADY_REVERSED_ERROR);
    }
    const reason = parseReversalReason(input.reason);
    if (!reason.ok) {
      return err(reason.error);
    }
    const recoveryMethod = parseReversalRefundMethod(input.recoveryMethod);
    if (!recoveryMethod.ok) {
      return err(recoveryMethod.error);
    }
    const confirmed = parseDifferentMethodConfirmed(
      input.confirmDifferentMethod,
    );
    if (!confirmed.ok) {
      return err(confirmed.error);
    }
    const originalMethod = PAYMENT_METHOD_PIX;
    const different = originalMethod !== recoveryMethod.data;
    if (different && !confirmed.data) {
      return err(REVERSAL_DIFFERENT_METHOD_ERROR);
    }
    const amountCents = Math.abs(Number(refund.amount_delta_cents));
    if (recoveryMethod.data === PAYMENT_METHOD_CASH) {
      const allowed = this.cash.assertCanMove(amountCents);
      if (!allowed.ok) {
        return err(allowed.error);
      }
    }
    const account = this.creditAccounts.find(
      (item) => item.id === refund.credit_account_id,
    );
    if (
      account?.owner_type === CREDIT_OWNER_STUDENT &&
      account.owner_student_id
    ) {
      const debtCheck = this.assertStudentCanReceiveCredit(
        account.owner_student_id,
      );
      if (!debtCheck.ok) {
        return err(debtCheck.error);
      }
    }
    const now = this.nowIso();
    const reversalId = this.createId();
    this.operationReversals.push({
      id: reversalId,
      operation_type: REVERSAL_OPERATION_CREDIT_REFUND,
      operation_id: refund.source_id,
      reason: reason.data,
      original_methods: originalMethod,
      refund_method: recoveryMethod.data,
      different_method_confirmed: different ? 'true' : 'false',
      returned_to_stock: '',
      created_by: LOCAL_ACTOR_ID,
      created_at: now,
    });
    this.creditMovements.push({
      credit_account_id: refund.credit_account_id,
      kind: CREDIT_KIND_REVERSAL,
      amount_delta_cents: String(amountCents),
      source_type: CREDIT_SOURCE_OPERATION_REVERSAL,
      source_id: reversalId,
      student_id: refund.student_id,
      created_by: LOCAL_ACTOR_ID,
      created_at: now,
      note: reason.data,
    });
    this.addEffect({
      reversalId,
      type: REVERSAL_EFFECT_CREDIT_RESTORE,
      entityType: 'credit_account',
      entityId: refund.credit_account_id,
      amountDeltaCents: amountCents,
      quantityDelta: null,
    });
    if (recoveryMethod.data === PAYMENT_METHOD_CASH) {
      const recorded = this.cash.recordReversalCash({
        reversalId,
        amountDeltaCents: amountCents,
        note: reason.data,
      });
      if (!recorded.ok) {
        return err(recorded.error);
      }
      this.addEffect({
        reversalId,
        type: REVERSAL_EFFECT_CASH_RECOVERY,
        entityType: 'credit_movement',
        entityId: refund.source_id,
        amountDeltaCents: amountCents,
        quantityDelta: null,
      });
    } else {
      this.addEffect({
        reversalId,
        type: REVERSAL_EFFECT_PIX_RECOVERY,
        entityType: 'credit_movement',
        entityId: refund.source_id,
        amountDeltaCents: amountCents,
        quantityDelta: null,
      });
    }
    return ok(this.toReversalsSetup());
  }

  addReceivableInterest(input: {
    receivableId?: string | null;
    kind: unknown;
    amountCents?: unknown;
    percent?: unknown;
    reason: unknown;
  }): Result<ReceivableView> {
    const receivable = this.findOpenReceivable(input.receivableId);
    if (!receivable.ok) {
      return err(receivable.error);
    }
    const planned = planInterestCharge({
      remainingCents: this.remainingCents(receivable.data.id),
      kind: input.kind,
      amountCents: input.amountCents,
      percent: input.percent,
      reason: input.reason,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    const now = this.nowIso();
    this.charges.push({
      id: this.createId(),
      receivable_id: receivable.data.id,
      kind: planned.data.kind,
      amount_cents: planned.data.amount_cents,
      reason_code: planned.data.reason_code,
      note: planned.data.note,
      created_by: LOCAL_ACTOR_ID,
      created_at: now,
      reversal_id: '',
    });
    return ok(
      this.toReceivable(receivable.data, todayCivilSaoPaulo(this.nowIso())),
    );
  }

  renegotiateReceivable(input: {
    receivableId?: string | null;
    dueDate: unknown;
    reason: unknown;
  }): Result<ReceivableView> {
    const receivable = this.findOpenReceivable(input.receivableId);
    if (!receivable.ok) {
      return err(receivable.error);
    }
    const planned = planDueDateChange({
      oldDueDate: receivable.data.due_date,
      newDueDate: input.dueDate,
      reason: input.reason,
    });
    if (!planned.ok) {
      return err(planned.error);
    }
    const now = this.nowIso();
    this.dueDateHistory.push({
      receivable_id: receivable.data.id,
      old_due_date: planned.data.old_due_date,
      new_due_date: planned.data.new_due_date,
      reason: planned.data.reason,
      changed_by: LOCAL_ACTOR_ID,
      changed_at: now,
    });
    receivable.data.due_date = planned.data.new_due_date;
    return ok(
      this.toReceivable(receivable.data, todayCivilSaoPaulo(this.nowIso())),
    );
  }

  createSale(input: {
    consumerStudentId?: string | null;
    chargedStudentId?: string | null;
    items: SaleLineInput[];
    paymentKind: string;
    pixAmountCents?: unknown;
    cashTenderedCents?: unknown;
    installments?: readonly FiadoInstallmentInput[];
    actorIsOwner: boolean;
    sourceReservationId?: string | null;
    overrideReservationId?: string | null;
  }): Result<SaleView> {
    if (!input.items.length) {
      return err(SALE_ITEMS_REQUIRED_ERROR);
    }
    const products = unwrap(
      this.catalog.listProducts({ includeInactive: true }),
    );
    const planned = [];
    for (const item of input.items) {
      const product = item.productId
        ? (products.find((entry) => entry.id === item.productId) ?? null)
        : null;
      const line = planSaleLine({
        item,
        product,
        actorIsOwner: input.actorIsOwner,
      });
      if (!line.ok) {
        return err(line.error);
      }
      planned.push(line.data);
    }
    const needed = new Map<string, number>();
    for (const line of planned) {
      if (!line.stock_tracked || !line.product_id) {
        continue;
      }
      needed.set(
        line.product_id,
        (needed.get(line.product_id) ?? 0) + Number(line.quantity),
      );
    }
    const sourceReservation = input.sourceReservationId
      ? this.reservations?.peekActiveForSale(input.sourceReservationId)
      : null;
    if (sourceReservation && !sourceReservation.ok) {
      return err(sourceReservation.error);
    }
    let overrideReservationId = '';
    for (const [productId, quantity] of needed) {
      const available = this.stock.availableQuantity(productId);
      if (!available.ok) {
        return err(available.error);
      }
      if (sourceReservation?.ok) {
        const held = reservationHeldQuantity(
          sourceReservation.data.items,
          productId,
        );
        if (held < quantity) {
          return err(RESERVATION_PICKUP_EXCEEDS_ERROR);
        }
        if (available.data + held < quantity) {
          return err({
            code: 'INSUFFICIENT_STOCK',
            message: 'Não há estoque suficiente para esta venda.',
            retryable: false,
          });
        }
        continue;
      }
      if (available.data >= quantity) {
        continue;
      }
      const physical = this.stock.physicalQuantity(productId);
      if (!physical.ok) {
        return err(physical.error);
      }
      if (physical.data < quantity) {
        return err({
          code: 'INSUFFICIENT_STOCK',
          message: 'Não há estoque suficiente para esta venda.',
          retryable: false,
        });
      }
      if (!input.actorIsOwner) {
        return err(RESERVED_OVERRIDE_FORBIDDEN_ERROR);
      }
      if (!input.overrideReservationId) {
        return err(RESERVED_OVERRIDE_REQUIRED_ERROR);
      }
      const override = this.reservations?.peekActiveForSale(
        input.overrideReservationId,
      );
      if (!override?.ok) {
        return err(override?.error ?? RESERVED_OVERRIDE_MISMATCH_ERROR);
      }
      const overflow = quantity - available.data;
      if (reservationHeldQuantity(override.data.items, productId) < overflow) {
        return err(RESERVED_OVERRIDE_MISMATCH_ERROR);
      }
      overrideReservationId = override.data.id;
    }
    let consumerStudentId = input.consumerStudentId;
    if (!consumerStudentId && sourceReservation?.ok) {
      consumerStudentId = sourceReservation.data.linkedStudentId;
    }
    let consumerId = '';
    if (consumerStudentId) {
      const student = this.roster.getStudent(consumerStudentId);
      if (!student.ok) {
        return err(student.error);
      }
      if (!student.data.active) {
        return err({
          code: 'STUDENT_INACTIVE',
          message: 'Aluno inativo não entra em venda nova.',
          retryable: false,
        });
      }
      consumerId = student.data.id;
    }
    const authorizations = unwrap(this.roster.listSiblingAuthorizations());
    const charge = resolveSaleCharge({
      consumerStudentId: consumerId || null,
      chargedStudentId: input.chargedStudentId,
      authorizations,
    });
    if (!charge.ok) {
      return err(charge.error);
    }
    const chargedId = charge.data.chargedStudentId;
    const totals = planSaleTotals(planned);
    const personalSources = this.personalCreditSources(
      consumerId,
      chargedId,
      charge.data.useAccountCredit,
    );
    const usableGuardianCredits =
      chargedId && (chargedId === consumerId || charge.data.useAccountCredit)
        ? this.usableGuardianCredits(chargedId)
        : [];
    const creditBalanceCents =
      input.paymentKind === PAYMENT_FIADO
        ? personalSources.reduce((total, item) => total + item.balance, 0)
        : 0;
    const guardianCreditCents =
      input.paymentKind === PAYMENT_FIADO
        ? usableGuardianCredits.reduce((total, item) => total + item.balance, 0)
        : 0;
    const settlements = planSettlements({
      paymentKind: input.paymentKind,
      netTotalCents: Number(totals.net_total_cents),
      pixAmountCents: input.pixAmountCents,
      cashTenderedCents: input.cashTenderedCents,
      creditBalanceCents,
      guardianCreditCents,
    });
    if (!settlements.ok) {
      return err(settlements.error);
    }
    const cashTendered = settlements.data.cashTenderedCents;
    const changeCents = settlements.data.changeCents;
    if (cashTendered > 0 || changeCents > 0) {
      const allowed = this.cash.assertCanMove(cashTendered - changeCents);
      if (!allowed.ok) {
        return err(allowed.error);
      }
    }
    let installments: Array<{ due_date: string; amount_cents: string }> = [];
    if (settlements.data.paymentKind === PAYMENT_FIADO) {
      if (!chargedId) {
        return err(FIADO_STUDENT_REQUIRED_ERROR);
      }
      const fiadoCents = settlements.data.rows
        .filter((row) => row.kind === SETTLEMENT_FIADO)
        .reduce((total, row) => total + Number(row.amount_cents), 0);
      if (fiadoCents > 0) {
        const plannedFiado = planFiadoInstallments({
          netTotalCents: fiadoCents,
          installments: input.installments ?? [],
        });
        if (!plannedFiado.ok) {
          return err(plannedFiado.error);
        }
        installments = plannedFiado.data;
      }
    }
    const now = this.nowIso();
    const sale: SaleRecord = {
      id: this.createId(),
      consumer_student_id: consumerId,
      charged_student_id: chargedId,
      status: SALE_STATUS_PAID,
      gross_total_cents: totals.gross_total_cents,
      discount_total_cents: totals.discount_total_cents,
      net_total_cents: totals.net_total_cents,
      source_reservation_id: sourceReservation?.ok
        ? sourceReservation.data.id
        : '',
      created_by: LOCAL_ACTOR_ID,
      created_at: now,
      reversal_id: '',
    };
    this.sales.push(sale);
    for (const line of planned) {
      this.items.push({
        id: this.createId(),
        sale_id: sale.id,
        product_id: line.product_id,
        item_kind: line.item_kind,
        description_snapshot: line.description_snapshot,
        quantity: line.quantity,
        unit_price_cents: line.unit_price_cents,
        discount_kind: line.discount_kind,
        discount_input: line.discount_input,
        discount_amount_cents: line.discount_amount_cents,
        line_net_total_cents: line.line_net_total_cents,
      });
    }
    for (const row of settlements.data.rows) {
      this.settlements.push({
        id: this.createId(),
        sale_id: sale.id,
        kind: row.kind,
        amount_cents: row.amount_cents,
        related_entity_id: '',
        created_at: now,
      });
    }
    for (const installment of installments) {
      const receivableId = this.createId();
      this.receivables.push({
        id: receivableId,
        charged_student_id: chargedId,
        source_sale_id: sale.id,
        due_date: installment.due_date,
        status: RECEIVABLE_STATUS_OPEN,
        created_by: LOCAL_ACTOR_ID,
        created_at: now,
      });
      this.charges.push({
        id: this.createId(),
        receivable_id: receivableId,
        kind: RECEIVABLE_CHARGE_PRINCIPAL,
        amount_cents: installment.amount_cents,
        reason_code: RECEIVABLE_REASON_SALE,
        note: '',
        created_by: LOCAL_ACTOR_ID,
        created_at: now,
        reversal_id: '',
      });
    }
    const personalUsedCents = settlements.data.rows
      .filter((row) => row.kind === SETTLEMENT_CREDIT)
      .reduce((total, row) => total + Number(row.amount_cents), 0);
    const guardianUsedCents = settlements.data.rows
      .filter((row) => row.kind === SETTLEMENT_GUARDIAN_CREDIT)
      .reduce((total, row) => total + Number(row.amount_cents), 0);
    if (personalUsedCents > 0) {
      let leftover = personalUsedCents;
      for (const item of personalSources) {
        if (leftover <= 0) {
          break;
        }
        const used = Math.min(item.balance, leftover);
        if (used <= 0) {
          continue;
        }
        this.creditMovements.push({
          credit_account_id: item.account.id,
          kind: CREDIT_KIND_SALE,
          amount_delta_cents: String(-used),
          source_type: CREDIT_SOURCE_SALE,
          source_id: sale.id,
          student_id: item.studentId,
          created_by: LOCAL_ACTOR_ID,
          created_at: now,
          note: '',
        });
        leftover -= used;
      }
    }
    if (guardianUsedCents > 0) {
      let leftover = guardianUsedCents;
      for (const item of usableGuardianCredits) {
        if (leftover <= 0) {
          break;
        }
        const used = Math.min(item.balance, leftover);
        if (used <= 0) {
          continue;
        }
        this.creditMovements.push({
          credit_account_id: item.account.id,
          kind: CREDIT_KIND_SALE,
          amount_delta_cents: String(-used),
          source_type: CREDIT_SOURCE_SALE,
          source_id: sale.id,
          student_id: chargedId,
          created_by: LOCAL_ACTOR_ID,
          created_at: now,
          note: '',
        });
        leftover -= used;
      }
    }
    for (const [productId, quantity] of needed) {
      const moved = this.stock.recordSourceMovement({
        productId,
        quantityDelta: -quantity,
        kind: INVENTORY_SALE_KIND,
        sourceType: 'sale',
        sourceId: sale.id,
        reason: 'venda',
      });
      if (!moved.ok) {
        return err(moved.error);
      }
    }
    if (cashTendered > 0 || changeCents > 0) {
      const recorded = this.cash.recordSaleCash({
        saleId: sale.id,
        tenderedCents: cashTendered,
        changeCents,
      });
      if (!recorded.ok) {
        return err(recorded.error);
      }
    }
    if (sourceReservation?.ok) {
      const fulfilled = this.reservations?.fulfillFromSale(
        sourceReservation.data.id,
      );
      if (fulfilled && !fulfilled.ok) {
        return err(fulfilled.error);
      }
    } else if (overrideReservationId) {
      const cancelled = this.reservations?.cancelForWalkInOverride(
        overrideReservationId,
      );
      if (cancelled && !cancelled.ok) {
        return err(cancelled.error);
      }
    }
    return ok(this.toSale(sale));
  }

  private dueDatesForSale(saleId: string): string[] {
    return this.receivables
      .filter((item) => item.source_sale_id === saleId)
      .map((item) => item.due_date);
  }

  private remainingCents(
    receivableId: string,
    ignorePaymentId?: string,
  ): number {
    const receivable = latestById(this.receivables).find(
      (item) => item.id === receivableId,
    );
    if (!receivable || receivable.status === RECEIVABLE_STATUS_REVERSED) {
      return 0;
    }
    const charged = this.chargeCents(receivableId);
    const reversedPaymentIds = new Set(
      latestById(this.payments)
        .filter((item) => item.status === PAYMENT_STATUS_REVERSED)
        .map((item) => item.id),
    );
    if (ignorePaymentId) {
      reversedPaymentIds.add(ignorePaymentId);
    }
    const allocated = this.allocations
      .filter(
        (item) =>
          item.receivable_id === receivableId &&
          !reversedPaymentIds.has(item.payment_id),
      )
      .reduce((total, item) => total + Number(item.amount_cents), 0);
    return charged - allocated;
  }

  private chargeCents(receivableId: string): number {
    return this.charges
      .filter((item) => item.receivable_id === receivableId)
      .reduce((total, item) => total + Number(item.amount_cents), 0);
  }

  private paidCents(receivableId: string): number {
    return this.chargeCents(receivableId) - this.remainingCents(receivableId);
  }

  private trackedReturnQuantities(saleId: string): Map<string, number> {
    const products = unwrap(
      this.catalog.listProducts({ includeInactive: true }),
    );
    const quantities = new Map<string, number>();
    for (const item of this.items.filter((row) => row.sale_id === saleId)) {
      if (!item.product_id) {
        continue;
      }
      const product = products.find((entry) => entry.id === item.product_id);
      if (!product?.stockTracked) {
        continue;
      }
      quantities.set(
        item.product_id,
        (quantities.get(item.product_id) ?? 0) + Number(item.quantity),
      );
    }
    return quantities;
  }

  private addEffect(input: {
    reversalId: string;
    type: ReversalEffectType;
    entityType: string;
    entityId: string;
    amountDeltaCents: number | null;
    quantityDelta: number | null;
  }): void {
    this.reversalEffects.push({
      id: this.createId(),
      reversal_id: input.reversalId,
      effect_type: input.type,
      entity_type: input.entityType,
      entity_id: input.entityId,
      amount_delta_cents:
        input.amountDeltaCents === null ? '' : String(input.amountDeltaCents),
      quantity_delta:
        input.quantityDelta === null ? '' : String(input.quantityDelta),
    });
  }

  private recordOutgoingRefund(input: {
    reversalId: string;
    amountCents: number;
    method: ReversalRefundMethod;
    reason: string;
  }): Result<void> {
    if (input.method === PAYMENT_METHOD_CASH) {
      const recorded = this.cash.recordReversalCash({
        reversalId: input.reversalId,
        amountDeltaCents: -input.amountCents,
        note: input.reason,
      });
      if (!recorded.ok) {
        return err(recorded.error);
      }
      this.addEffect({
        reversalId: input.reversalId,
        type: REVERSAL_EFFECT_CASH_REFUND,
        entityType: 'operation_reversal',
        entityId: input.reversalId,
        amountDeltaCents: -input.amountCents,
        quantityDelta: null,
      });
      return ok(undefined);
    }
    this.addEffect({
      reversalId: input.reversalId,
      type: REVERSAL_EFFECT_PIX_REFUND,
      entityType: 'operation_reversal',
      entityId: input.reversalId,
      amountDeltaCents: -input.amountCents,
      quantityDelta: null,
    });
    return ok(undefined);
  }

  private studentRemainingDebt(
    studentId: string,
    exceptSaleId?: string,
    ignorePaymentId?: string,
  ): number {
    return latestById(this.receivables)
      .filter(
        (item) =>
          item.charged_student_id === studentId &&
          item.source_sale_id !== exceptSaleId,
      )
      .reduce(
        (total, item) => total + this.remainingCents(item.id, ignorePaymentId),
        0,
      );
  }

  private assertStudentCanReceiveCredit(
    studentId: string,
    exceptSaleId?: string,
    ignorePaymentId?: string,
  ): Result<void> {
    if (
      this.studentRemainingDebt(studentId, exceptSaleId, ignorePaymentId) > 0
    ) {
      return err(REVERSAL_CREDIT_WITH_DEBT_ERROR);
    }
    return ok(undefined);
  }

  private toReversalsSetup(): ReversalsSetupView {
    const products = unwrap(
      this.catalog.listProducts({ includeInactive: true }),
    );
    const reversedRefundIds = new Set(
      this.operationReversals
        .filter(
          (item) => item.operation_type === REVERSAL_OPERATION_CREDIT_REFUND,
        )
        .map((item) => item.operation_id),
    );
    return {
      sales: latestById(this.sales)
        .slice()
        .reverse()
        .map((sale) => {
          const view = this.toSale(sale);
          const settlements = view.settlements.map((item) => ({
            kind: item.kind,
            amountCents: item.amountCents,
          }));
          return {
            id: sale.id,
            displayName: `${view.consumerLabel} • ${view.items.map((item) => item.description).join(', ')}`,
            amountCents: view.netTotalCents,
            externalAmountCents: externalAmountFromSettlements(settlements),
            originalMethods: originalMethodsFromSettlements(settlements),
            hasTrackedItems: this.items.some(
              (item) =>
                item.sale_id === sale.id &&
                Boolean(
                  products.find((product) => product.id === item.product_id)
                    ?.stockTracked,
                ),
            ),
            status: view.status,
            createdAt: sale.created_at,
          };
        }),
      payments: latestById(this.payments)
        .slice()
        .reverse()
        .map((payment) => {
          const debtCents = this.allocations
            .filter((item) => item.payment_id === payment.id)
            .reduce((total, item) => total + Number(item.amount_cents), 0);
          const creditCents = this.paymentCreditAllocations
            .filter((item) => item.payment_id === payment.id)
            .reduce((total, item) => total + Number(item.amount_cents), 0);
          return {
            id: payment.id,
            payerName: payment.payer_guardian_id
              ? this.guardianLabel(payment.payer_guardian_id)
              : this.studentLabel(payment.payer_student_id),
            amountCents: Number(payment.amount_received_cents),
            method: payment.method,
            destinationLabel: paymentDestinationLabel({
              debtCents,
              creditCents,
            }),
            status:
              payment.status === PAYMENT_STATUS_REVERSED
                ? PAYMENT_STATUS_REVERSED
                : PAYMENT_STATUS_COMPLETED,
            createdAt: payment.created_at,
          };
        }),
      creditRefunds: this.creditMovements
        .filter(
          (item) => item.kind === CREDIT_KIND_REFUND && item.source_id !== '',
        )
        .slice()
        .reverse()
        .map((item) => {
          const account = this.creditAccounts.find(
            (entry) => entry.id === item.credit_account_id,
          );
          const ownerType =
            account?.owner_type === CREDIT_OWNER_GUARDIAN
              ? CREDIT_OWNER_GUARDIAN
              : CREDIT_OWNER_STUDENT;
          return {
            id: item.source_id,
            ownerName:
              ownerType === CREDIT_OWNER_GUARDIAN
                ? this.guardianLabel(account?.owner_guardian_id ?? '')
                : this.studentLabel(
                    item.student_id || account?.owner_student_id || '',
                  ),
            amountCents: Math.abs(Number(item.amount_delta_cents)),
            method: PAYMENT_METHOD_PIX,
            ownerType,
            reversed: reversedRefundIds.has(item.source_id),
            createdAt: item.created_at,
          };
        }),
      recentReversals: this.operationReversals
        .slice()
        .reverse()
        .map((item) => this.toReversalRecord(item)),
    };
  }

  private toReversalRecord(item: OperationReversalRecord): ReversalRecordView {
    const effects = this.reversalEffects
      .filter((effect) => effect.reversal_id === item.id)
      .map((effect) => {
        const amountDeltaCents =
          effect.amount_delta_cents === ''
            ? null
            : Number(effect.amount_delta_cents);
        const quantityDelta =
          effect.quantity_delta === '' ? null : Number(effect.quantity_delta);
        return {
          type: effect.effect_type,
          amountDeltaCents,
          quantityDelta,
          summaryLabel: reversalEffectSummary({
            type: effect.effect_type,
            amountDeltaCents,
            quantityDelta,
          }),
        };
      });
    return {
      id: item.id,
      operationType: item.operation_type,
      operationId: item.operation_id,
      reason: item.reason,
      refundMethod:
        item.refund_method === PAYMENT_METHOD_PIX ||
        item.refund_method === PAYMENT_METHOD_CASH
          ? item.refund_method
          : null,
      differentMethodConfirmed: item.different_method_confirmed === 'true',
      returnedToStock:
        item.returned_to_stock === ''
          ? null
          : item.returned_to_stock === 'true',
      createdByName: 'Dona',
      createdAt: item.created_at,
      effects,
    };
  }

  private findPersonalCreditAccount(
    studentId: string,
  ): CreditAccountRecord | null {
    return (
      this.creditAccounts.find(
        (account) =>
          account.owner_type === CREDIT_OWNER_STUDENT &&
          account.owner_student_id === studentId &&
          account.active === 'true',
      ) ?? null
    );
  }

  private findGuardianCreditAccount(
    guardianId: string,
  ): CreditAccountRecord | null {
    return (
      this.creditAccounts.find(
        (account) =>
          account.owner_type === CREDIT_OWNER_GUARDIAN &&
          account.owner_guardian_id === guardianId &&
          account.active === 'true',
      ) ?? null
    );
  }

  private usableGuardianCredits(studentId: string): Array<{
    account: CreditAccountRecord;
    balance: number;
  }> {
    return this.roster
      .listActiveGuardianLinks()
      .filter(
        (link) => link.studentId === studentId && link.canUseGuardianCredit,
      )
      .slice()
      .sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary))
      .flatMap((link) => {
        const account = this.findGuardianCreditAccount(link.guardianId);
        if (!account) {
          return [];
        }
        const balance = this.creditBalanceCents(account.id);
        return balance > 0 ? [{ account, balance }] : [];
      });
  }

  private creditBalanceCents(accountId: string): number {
    return this.creditMovements
      .filter((item) => item.credit_account_id === accountId)
      .reduce((total, item) => total + Number(item.amount_delta_cents), 0);
  }

  private personalCreditSources(
    consumerId: string,
    chargedId: string,
    useAccountCredit: boolean,
  ): Array<{
    studentId: string;
    account: CreditAccountRecord;
    balance: number;
  }> {
    if (!chargedId || !consumerId) {
      return [];
    }
    const studentIds: string[] = [];
    if (chargedId === consumerId) {
      studentIds.push(consumerId);
      const authorizations = unwrap(this.roster.listSiblingAuthorizations());
      for (const item of authorizations) {
        if (
          item.active &&
          item.canUseAccountCredit &&
          item.consumerStudentId === consumerId &&
          !studentIds.includes(item.accountStudentId)
        ) {
          studentIds.push(item.accountStudentId);
        }
      }
    } else if (useAccountCredit) {
      studentIds.push(chargedId);
    }
    const sources = [];
    for (const studentId of studentIds) {
      const account = this.findPersonalCreditAccount(studentId);
      if (!account) {
        continue;
      }
      const balance = this.creditBalanceCents(account.id);
      if (balance > 0) {
        sources.push({ studentId, account, balance });
      }
    }
    return sources;
  }

  private ensurePersonalCreditAccount(
    studentId: string,
    now: string,
  ): CreditAccountRecord {
    const existing = this.findPersonalCreditAccount(studentId);
    if (existing) {
      return existing;
    }
    const account: CreditAccountRecord = {
      id: this.createId(),
      owner_type: CREDIT_OWNER_STUDENT,
      owner_student_id: studentId,
      owner_guardian_id: '',
      active: 'true',
      created_at: now,
    };
    this.creditAccounts.push(account);
    this.creditAccountStudents.push({
      credit_account_id: account.id,
      student_id: studentId,
      can_use: 'true',
      active: 'true',
    });
    return account;
  }

  private ensureGuardianCreditAccount(
    guardianId: string,
    now: string,
  ): CreditAccountRecord {
    const existing = this.findGuardianCreditAccount(guardianId);
    if (existing) {
      return existing;
    }
    const account: CreditAccountRecord = {
      id: this.createId(),
      owner_type: CREDIT_OWNER_GUARDIAN,
      owner_student_id: '',
      owner_guardian_id: guardianId,
      active: 'true',
      created_at: now,
    };
    this.creditAccounts.push(account);
    this.syncGuardianCreditStudents(account.id, guardianId);
    return account;
  }

  private syncGuardianCreditStudents(
    accountId: string,
    guardianId: string,
  ): void {
    for (const link of this.roster
      .listActiveGuardianLinks()
      .filter((item) => item.guardianId === guardianId)) {
      this.creditAccountStudents.push({
        credit_account_id: accountId,
        student_id: link.studentId,
        can_use: link.canUseGuardianCredit ? 'true' : 'false',
        active: 'true',
      });
    }
  }

  private toCredit(account: CreditAccountRecord): CreditView {
    const ownerLabel =
      account.owner_type === CREDIT_OWNER_GUARDIAN
        ? this.guardianLabel(account.owner_guardian_id)
        : this.studentLabel(account.owner_student_id);
    const balanceCents = this.creditBalanceCents(account.id);
    const balanceLabel = formatBrl(balanceCents);
    return {
      id: account.id,
      ownerType: account.owner_type,
      studentId: account.owner_student_id || null,
      guardianId: account.owner_guardian_id || null,
      ownerLabel,
      balanceCents,
      balanceLabel,
      summaryLabel: creditSummaryLabel({
        studentLabel: ownerLabel,
        balanceLabel,
      }),
    };
  }

  private findOpenReceivable(
    receivableId: string | null | undefined,
  ): Result<ReceivableRecord> {
    if (!receivableId) {
      return err(RECEIVABLE_NOT_FOUND_ERROR);
    }
    const receivable = this.receivables.find(
      (item) => item.id === receivableId,
    );
    if (!receivable) {
      return err(RECEIVABLE_NOT_FOUND_ERROR);
    }
    if (this.remainingCents(receivable.id) <= 0) {
      return err(RECEIVABLE_SETTLED_ERROR);
    }
    return ok(receivable);
  }

  private studentLabel(studentId: string): string {
    const student = unwrap(this.roster.getStudent(studentId));
    return `${student.fullName} • ${student.ageLabel}`;
  }

  private guardianLabel(guardianId: string): string {
    const guardian = unwrap(this.roster.getGuardian(guardianId));
    const relation = guardian.relationLabel
      ? ` • ${guardian.relationLabel}`
      : '';
    return `${guardian.fullName}${relation}`;
  }

  private toDueDateHistory(item: DueDateHistoryRecord): DueDateHistoryView {
    const receivable = this.receivables.find(
      (entry) => entry.id === item.receivable_id,
    );
    const studentLabel = receivable
      ? this.studentLabel(receivable.charged_student_id)
      : '';
    const oldDueDateLabel = formatCivilDisplay(item.old_due_date);
    const newDueDateLabel = formatCivilDisplay(item.new_due_date);
    return {
      receivableId: item.receivable_id,
      studentLabel,
      oldDueDate: item.old_due_date,
      oldDueDateLabel,
      newDueDate: item.new_due_date,
      newDueDateLabel,
      reason: item.reason,
      summaryLabel: dueDateHistoryLabel({
        studentLabel,
        oldDueDateLabel,
        newDueDateLabel,
        reason: item.reason,
      }),
    };
  }

  private toReceivable(
    receivable: ReceivableRecord,
    today: string,
  ): ReceivableView {
    const remainingCents = this.remainingCents(receivable.id);
    const student = unwrap(
      this.roster.getStudent(receivable.charged_student_id),
    );
    const studentLabel = `${student.fullName} • ${student.ageLabel}`;
    const dueDateLabel = formatCivilDisplay(receivable.due_date);
    const remainingLabel = formatBrl(remainingCents);
    return {
      id: receivable.id,
      chargedStudentId: receivable.charged_student_id,
      studentLabel,
      sourceSaleId: receivable.source_sale_id,
      dueDate: receivable.due_date,
      dueDateLabel,
      amountCents: remainingCents,
      amountLabel: remainingLabel,
      remainingCents,
      remainingLabel,
      status: RECEIVABLE_STATUS_OPEN,
      bucket: agendaBucket(receivable.due_date, today),
      summaryLabel: receivableSummaryLabel({
        studentLabel,
        amountLabel: remainingLabel,
        dueDateLabel,
      }),
    };
  }

  private toPayment(payment: PaymentRecord): PaymentView {
    const amountCents = Number(payment.amount_received_cents);
    const amountLabel = formatBrl(amountCents);
    if (payment.payer_guardian_id) {
      const guardianLabel = this.guardianLabel(payment.payer_guardian_id);
      const childLines = this.familyPaymentChildLines(payment.id);
      const creditCents = this.paymentCreditAllocations
        .filter((item) => item.payment_id === payment.id)
        .reduce((total, item) => total + Number(item.amount_cents), 0);
      return {
        id: payment.id,
        payerStudentId: '',
        studentLabel: guardianLabel,
        method: payment.method,
        amountCents,
        amountLabel,
        status:
          payment.status === PAYMENT_STATUS_REVERSED
            ? PAYMENT_STATUS_REVERSED
            : PAYMENT_STATUS_COMPLETED,
        summaryLabel: familyPaymentSummaryLabel({
          guardianLabel,
          amountLabel,
          method: payment.method,
          childLines,
          creditLabel: creditCents > 0 ? formatBrl(creditCents) : null,
        }),
        createdAt: payment.created_at,
      };
    }
    const student = unwrap(this.roster.getStudent(payment.payer_student_id));
    const studentLabel = `${student.fullName} • ${student.ageLabel}`;
    return {
      id: payment.id,
      payerStudentId: payment.payer_student_id,
      studentLabel,
      method: payment.method,
      amountCents,
      amountLabel,
      status:
        payment.status === PAYMENT_STATUS_REVERSED
          ? PAYMENT_STATUS_REVERSED
          : PAYMENT_STATUS_COMPLETED,
      summaryLabel: paymentSummaryLabel({
        studentLabel,
        amountLabel,
        method: payment.method,
      }),
      createdAt: payment.created_at,
    };
  }

  private familyPaymentChildLines(
    paymentId: string,
  ): Array<{ studentLabel: string; amountLabel: string }> {
    const order: string[] = [];
    const sums = new Map<string, number>();
    for (const row of this.allocations.filter(
      (item) => item.payment_id === paymentId,
    )) {
      if (!sums.has(row.student_id)) {
        order.push(row.student_id);
        sums.set(row.student_id, 0);
      }
      sums.set(
        row.student_id,
        (sums.get(row.student_id) ?? 0) + Number(row.amount_cents),
      );
    }
    return order.map((studentId) => ({
      studentLabel: this.studentLabel(studentId),
      amountLabel: formatBrl(sums.get(studentId) ?? 0),
    }));
  }

  private toSale(sale: SaleRecord): SaleView {
    const items = this.items
      .filter((item) => item.sale_id === sale.id)
      .map((item) => ({
        id: item.id,
        description: item.description_snapshot,
        quantity: Number(item.quantity),
        unitPriceCents: Number(item.unit_price_cents),
        discountAmountCents: Number(item.discount_amount_cents),
        lineNetCents: Number(item.line_net_total_cents),
      }));
    const netTotalCents = Number(sale.net_total_cents);
    const settlementRows = this.settlements.filter(
      (item) => item.sale_id === sale.id,
    );
    const paymentKind = paymentKindFromSettlements(settlementRows);
    const cashTenderedCents = settlementRows
      .filter((item) => item.kind === SETTLEMENT_CASH)
      .reduce((total, item) => total + Number(item.amount_cents), 0);
    const changeCents = Math.abs(
      settlementRows
        .filter((item) => item.kind === SETTLEMENT_CHANGE)
        .reduce((total, item) => total + Number(item.amount_cents), 0),
    );
    let consumerLabel = ANONYMOUS_SALE_LABEL;
    if (sale.consumer_student_id) {
      const student = unwrap(this.roster.getStudent(sale.consumer_student_id));
      consumerLabel = `${student.fullName} • ${student.ageLabel}`;
    }
    const accountLabel =
      sale.charged_student_id &&
      sale.charged_student_id !== sale.consumer_student_id
        ? this.studentLabel(sale.charged_student_id)
        : null;
    const dueDateLabel = dueDateLabelForDates(this.dueDatesForSale(sale.id));
    const netLabel = formatBrl(netTotalCents);
    const changeLabel = changeCents > 0 ? formatBrl(changeCents) : null;
    const creditCents = settlementRows
      .filter((item) => item.kind === SETTLEMENT_CREDIT)
      .reduce((total, item) => total + Number(item.amount_cents), 0);
    const guardianCreditCents = settlementRows
      .filter((item) => item.kind === SETTLEMENT_GUARDIAN_CREDIT)
      .reduce((total, item) => total + Number(item.amount_cents), 0);
    const creditLabel = creditCents > 0 ? formatBrl(creditCents) : null;
    const guardianCreditLabel =
      guardianCreditCents > 0 ? formatBrl(guardianCreditCents) : null;
    return {
      id: sale.id,
      consumerStudentId: sale.consumer_student_id || null,
      consumerLabel,
      status:
        sale.status === SALE_STATUS_REVERSED
          ? SALE_STATUS_REVERSED
          : SALE_STATUS_PAID,
      paymentKind,
      grossTotalCents: Number(sale.gross_total_cents),
      discountTotalCents: Number(sale.discount_total_cents),
      netTotalCents,
      netLabel,
      cashTenderedCents,
      changeCents,
      changeLabel,
      dueDateLabel,
      settlements: settlementRows.map((item) => ({
        kind: item.kind,
        amountCents: Number(item.amount_cents),
      })),
      items,
      summaryLabel: saleSummaryLabel({
        consumerLabel,
        descriptions: items.map((item) => item.description),
        netLabel,
        paymentKind,
        changeLabel,
        dueDateLabel,
        creditLabel,
        guardianCreditLabel,
        accountLabel,
      }),
      sourceReservationId: sale.source_reservation_id || null,
      createdAt: sale.created_at,
    };
  }
}
