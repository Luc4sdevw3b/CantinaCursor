import { INVENTORY_SALE_KIND } from '../../domain/inventory';
import { formatBrl } from '../../domain/money';
import {
  ANONYMOUS_SALE_LABEL,
  DEFAULT_PIX_COPY_TEXT,
  SALE_ITEMS_REQUIRED_ERROR,
  SALE_STATUS_PAID,
  SETTLEMENT_CHANGE,
  SETTLEMENT_CASH,
  paymentKindFromSettlements,
  planSaleLine,
  planSaleTotals,
  planSettlements,
  saleSummaryLabel,
  type PaymentKind,
  type SaleLineInput,
} from '../../domain/sale';
import { err, ok, type AppError, type Result } from '../../domain/result';
import type { MemoryCatalog } from '../products/memory-catalog';
import type { MemoryStock } from '../inventory/memory-stock';
import type { MemoryRoster } from '../students/memory-roster';

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
  settlements: SaleSettlementView[];
  items: SaleItemView[];
  summaryLabel: string;
  createdAt: string;
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

  constructor(
    private readonly catalog: MemoryCatalog,
    private readonly stock: MemoryStock,
    private readonly roster: MemoryRoster,
    private readonly nowIso: () => string = () => new Date().toISOString(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  getPixCopyText(): Result<{ text: string }> {
    return ok({ text: DEFAULT_PIX_COPY_TEXT });
  }

  listSales(): Result<SaleView[]> {
    return ok(
      this.sales
        .slice()
        .reverse()
        .map((sale) => this.toSale(sale)),
    );
  }

  createSale(input: {
    consumerStudentId?: string | null;
    items: SaleLineInput[];
    paymentKind: string;
    pixAmountCents?: unknown;
    cashTenderedCents?: unknown;
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
    const totals = planSaleTotals(planned);
    const settlements = planSettlements({
      paymentKind: input.paymentKind,
      netTotalCents: Number(totals.net_total_cents),
      pixAmountCents: input.pixAmountCents,
      cashTenderedCents: input.cashTenderedCents,
    });
    if (!settlements.ok) {
      return err(settlements.error);
    }
    const now = this.nowIso();
    const sale: SaleRecord = {
      id: this.createId(),
      consumer_student_id: consumerId,
      charged_student_id: consumerId,
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
    return ok(this.toSale(sale));
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
    return {
      id: sale.id,
      consumerStudentId: sale.consumer_student_id || null,
      consumerLabel,
      status: SALE_STATUS_PAID,
      paymentKind,
      grossTotalCents: Number(sale.gross_total_cents),
      discountTotalCents: Number(sale.discount_total_cents),
      netTotalCents,
      netLabel: formatBrl(netTotalCents),
      cashTenderedCents,
      changeCents,
      changeLabel: changeCents > 0 ? formatBrl(changeCents) : null,
      settlements: settlementRows.map((item) => ({
        kind: item.kind,
        amountCents: Number(item.amount_cents),
      })),
      items,
      summaryLabel: saleSummaryLabel({
        consumerLabel,
        descriptions: items.map((item) => item.description),
        netLabel: formatBrl(netTotalCents),
        paymentKind,
        changeLabel: changeCents > 0 ? formatBrl(changeCents) : null,
      }),
      createdAt: sale.created_at,
    };
  }
}
