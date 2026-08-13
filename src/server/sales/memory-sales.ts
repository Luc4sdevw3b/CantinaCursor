import {
  CREDIT_GUARDIAN_REQUIRED_ERROR,
  CREDIT_INSUFFICIENT_ERROR,
  CREDIT_KIND_DEPOSIT,
  CREDIT_KIND_REFUND,
  CREDIT_KIND_SALE,
  CREDIT_OWNER_GUARDIAN,
  CREDIT_OWNER_STUDENT,
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
import { INVENTORY_SALE_KIND } from '../../domain/inventory';
import { formatBrl } from '../../domain/money';
import { resolveSaleCharge } from '../../domain/sibling-authorization';
import {
  familyPaymentSummaryLabel,
  parsePaymentMethod,
  PAYMENT_METHOD_CASH,
  PAYMENT_CHILD_NOT_LINKED_ERROR,
  PAYMENT_GUARDIAN_REQUIRED_ERROR,
  PAYMENT_MODE_OLDEST_FIRST,
  PAYMENT_STATUS_COMPLETED,
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
  status: typeof SALE_STATUS_PAID;
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
  status: typeof PAYMENT_STATUS_COMPLETED;
  summaryLabel: string;
  createdAt: string;
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
  status: typeof PAYMENT_STATUS_COMPLETED;
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

function fail(error: AppError): never {
  throw new Error(`${error.code}: ${error.message}`);
}

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) {
    fail(result.error);
  }
  return result.data;
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

  constructor(
    private readonly catalog: MemoryCatalog,
    private readonly stock: MemoryStock,
    private readonly roster: MemoryRoster,
    private readonly cash: MemoryCash,
    private readonly nowIso: () => string = () => new Date().toISOString(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

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
      this.sales
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
    for (const receivable of this.receivables) {
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
      this.payments
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
      source_id: '',
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
      source_id: '',
      student_id: '',
      created_by: LOCAL_ACTOR_ID,
      created_at: this.nowIso(),
      note: planned.data.note,
    });
    return ok(this.toCredit(account));
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
    for (const [productId, quantity] of needed) {
      const available = this.stock.availableQuantity(productId);
      if (!available.ok) {
        return err(available.error);
      }
      if (available.data < quantity) {
        return err({
          code: 'INSUFFICIENT_STOCK',
          message: 'Não há estoque suficiente para esta venda.',
          retryable: false,
        });
      }
    }
    let consumerId = '';
    if (input.consumerStudentId) {
      const student = this.roster.getStudent(input.consumerStudentId);
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
      source_reservation_id: '',
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
    return ok(this.toSale(sale));
  }

  private dueDatesForSale(saleId: string): string[] {
    return this.receivables
      .filter((item) => item.source_sale_id === saleId)
      .map((item) => item.due_date);
  }

  private remainingCents(receivableId: string): number {
    const charged = this.charges
      .filter((item) => item.receivable_id === receivableId)
      .reduce((total, item) => total + Number(item.amount_cents), 0);
    const allocated = this.allocations
      .filter((item) => item.receivable_id === receivableId)
      .reduce((total, item) => total + Number(item.amount_cents), 0);
    return charged - allocated;
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
        status: PAYMENT_STATUS_COMPLETED,
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
      status: PAYMENT_STATUS_COMPLETED,
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
      status: SALE_STATUS_PAID,
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
      createdAt: sale.created_at,
    };
  }
}
