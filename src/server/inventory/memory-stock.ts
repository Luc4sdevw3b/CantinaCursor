import { civilDateFromTimestamp } from '../../domain/civil-date';
import { isImmutableId, isSheetRowNumber } from '../../domain/ids';
import {
  INVENTORY_DAY_OPEN,
  physicalQuantity,
  quantityLabel,
  validateAdjustment,
  validateOpeningItems,
} from '../../domain/inventory';
import { err, ok, type AppError, type Result } from '../../domain/result';
import type { MemoryCatalog, ProductView } from '../products/memory-catalog';

const LOCAL_ACTOR_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000099';

export interface InventoryDayView {
  id: string;
  businessDate: string;
  status: typeof INVENTORY_DAY_OPEN;
  openedAt: string;
}

export interface InventoryBalanceItem {
  productId: string;
  productName: string;
  openingQuantity: number;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  soldOut: boolean;
  quantityLabel: string;
}

export interface InventoryBalancesView {
  businessDate: string;
  status: typeof INVENTORY_DAY_OPEN;
  items: InventoryBalanceItem[];
}

export interface InventoryMovementView {
  id: string;
  productId: string;
  productName: string;
  kind: string;
  quantityDelta: number;
  reason: string;
  createdAt: string;
}

interface DayRecord {
  id: string;
  business_date: string;
  status: string;
  opened_by: string;
  opened_at: string;
}

interface OpeningRecord {
  id: string;
  inventory_day_id: string;
  product_id: string;
  opening_quantity: string;
}

interface MovementRecord {
  id: string;
  inventory_day_id: string;
  product_id: string;
  kind: string;
  quantity_delta: string;
  source_type: string;
  source_id: string;
  created_by: string;
  created_at: string;
  reason: string;
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

function parseId(id: string): Result<string> {
  if (isSheetRowNumber(id) || !isImmutableId(id)) {
    return err({
      code: 'INVALID_ID',
      message: 'ID deve ser UUID imutável, nunca número da linha.',
      retryable: false,
    });
  }
  return ok(id);
}

export class MemoryStock {
  private days: DayRecord[] = [];
  private openings: OpeningRecord[] = [];
  private movements: MovementRecord[] = [];
  private seeded = false;

  constructor(
    private readonly catalog: MemoryCatalog,
    private readonly nowIso: () => string = () => new Date().toISOString(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  ensureDemoStock(): void {
    if (this.seeded) {
      return;
    }
    this.seeded = true;
    const products = unwrap(this.catalog.listProducts());
    const coxinha = products.find((item) => item.name === 'Coxinha');
    const suco = products.find((item) => item.name === 'Suco de uva');
    if (!coxinha || !suco) {
      throw new Error('DEMO_STOCK: produtos controlados ausentes.');
    }
    unwrap(
      this.openDay({
        businessDate: civilDateFromTimestamp(this.nowIso()),
        items: [
          { productId: coxinha.id, openingQuantity: 10 },
          { productId: suco.id, openingQuantity: 0 },
        ],
      }),
    );
  }

  getDay(businessDate?: string): Result<InventoryDayView | null> {
    const day = this.findDay(this.resolveDate(businessDate));
    if (!day) {
      return ok(null);
    }
    return ok(this.toDay(day));
  }

  openDay(input: {
    businessDate: string;
    items: Array<{ productId: string; openingQuantity: number }>;
  }): Result<InventoryBalancesView> {
    const tracked = this.trackedProducts();
    const profile = validateOpeningItems({
      businessDate: input.businessDate,
      items: input.items,
      trackedProductIds: tracked.map((item) => item.id),
    });
    if (!profile.ok) {
      return err(profile.error);
    }
    if (this.findDay(profile.data.business_date)) {
      return err({
        code: 'INVENTORY_DAY_ALREADY_OPEN',
        message: 'O estoque deste dia já foi aberto.',
        retryable: false,
      });
    }
    const now = this.nowIso();
    const day: DayRecord = {
      id: this.createId(),
      business_date: profile.data.business_date,
      status: INVENTORY_DAY_OPEN,
      opened_by: LOCAL_ACTOR_ID,
      opened_at: now,
    };
    this.days.push(day);
    for (const item of profile.data.items) {
      this.openings.push({
        id: this.createId(),
        inventory_day_id: day.id,
        product_id: item.product_id,
        opening_quantity: item.opening_quantity,
      });
    }
    return this.listBalances(day.business_date);
  }

  listBalances(businessDate?: string): Result<InventoryBalancesView> {
    const day = this.requireDay(this.resolveDate(businessDate));
    if (!day.ok) {
      return err(day.error);
    }
    const openings = this.openings.filter(
      (item) => item.inventory_day_id === day.data.id,
    );
    const products = unwrap(
      this.catalog.listProducts({ includeInactive: true }),
    );
    const items = openings.map((opening) =>
      this.toBalance(day.data.id, opening, products),
    );
    return ok({
      businessDate: day.data.business_date,
      status: INVENTORY_DAY_OPEN,
      items,
    });
  }

  adjust(input: {
    productId: string;
    quantityDelta: number;
    reason: string;
    businessDate?: string;
  }): Result<InventoryBalancesView> {
    const day = this.requireDay(this.resolveDate(input.businessDate));
    if (!day.ok) {
      return err(day.error);
    }
    const product = this.findProduct(input.productId);
    if (!product.ok) {
      return err(product.error);
    }
    const current = this.physicalFor(day.data.id, product.data.id);
    const profile = validateAdjustment({
      productId: input.productId,
      quantityDelta: input.quantityDelta,
      reason: input.reason,
      stockTracked: product.data.stockTracked,
      currentPhysical: current,
    });
    if (!profile.ok) {
      return err(profile.error);
    }
    const now = this.nowIso();
    const movementId = this.createId();
    this.movements.push({
      id: movementId,
      inventory_day_id: day.data.id,
      product_id: profile.data.product_id,
      kind: profile.data.kind,
      quantity_delta: profile.data.quantity_delta,
      source_type: 'manual',
      source_id: movementId,
      created_by: LOCAL_ACTOR_ID,
      created_at: now,
      reason: profile.data.reason,
    });
    return this.listBalances(day.data.business_date);
  }

  recordSourceMovement(input: {
    productId: string;
    quantityDelta: number;
    kind: string;
    sourceType: string;
    sourceId: string;
    reason: string;
    businessDate?: string;
  }): Result<void> {
    const day = this.requireDay(this.resolveDate(input.businessDate));
    if (!day.ok) {
      return err(day.error);
    }
    const product = this.findProduct(input.productId);
    if (!product.ok) {
      return err(product.error);
    }
    if (!product.data.stockTracked) {
      return ok(undefined);
    }
    const current = this.physicalFor(day.data.id, product.data.id);
    if (current + input.quantityDelta < 0) {
      return err({
        code: 'INSUFFICIENT_STOCK',
        message: 'O estoque não pode ficar negativo.',
        retryable: false,
      });
    }
    this.movements.push({
      id: this.createId(),
      inventory_day_id: day.data.id,
      product_id: product.data.id,
      kind: input.kind,
      quantity_delta: String(input.quantityDelta),
      source_type: input.sourceType,
      source_id: input.sourceId,
      created_by: LOCAL_ACTOR_ID,
      created_at: this.nowIso(),
      reason: input.reason,
    });
    return ok(undefined);
  }

  availableQuantity(productId: string, businessDate?: string): Result<number> {
    const day = this.requireDay(this.resolveDate(businessDate));
    if (!day.ok) {
      return err(day.error);
    }
    return ok(this.physicalFor(day.data.id, productId));
  }

  listMovements(businessDate?: string): Result<InventoryMovementView[]> {
    const day = this.requireDay(this.resolveDate(businessDate));
    if (!day.ok) {
      return err(day.error);
    }
    const products = unwrap(
      this.catalog.listProducts({ includeInactive: true }),
    );
    return ok(
      this.movements
        .filter((item) => item.inventory_day_id === day.data.id)
        .map((item) => {
          const product = products.find(
            (entry) => entry.id === item.product_id,
          );
          return {
            id: item.id,
            productId: item.product_id,
            productName: product?.name ?? '',
            kind: item.kind,
            quantityDelta: Number(item.quantity_delta),
            reason: item.reason,
            createdAt: item.created_at,
          };
        }),
    );
  }

  private resolveDate(businessDate?: string): string {
    return businessDate || civilDateFromTimestamp(this.nowIso());
  }

  private trackedProducts(): ProductView[] {
    return unwrap(this.catalog.listProducts()).filter(
      (item) => item.active && item.stockTracked,
    );
  }

  private findDay(businessDate: string): DayRecord | null {
    return (
      latestById(this.days).find(
        (item) => item.business_date === businessDate,
      ) ?? null
    );
  }

  private requireDay(businessDate: string): Result<DayRecord> {
    const day = this.findDay(businessDate);
    if (!day) {
      return err({
        code: 'INVENTORY_DAY_NOT_OPEN',
        message: 'Abra o estoque do dia antes de continuar.',
        retryable: false,
      });
    }
    return ok(day);
  }

  private findProduct(id: string): Result<ProductView> {
    const validId = parseId(id);
    if (!validId.ok) {
      return err(validId.error);
    }
    const product = unwrap(
      this.catalog.listProducts({ includeInactive: true }),
    ).find((item) => item.id === id);
    if (!product) {
      return err({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produto não encontrado.',
        retryable: false,
      });
    }
    return ok(product);
  }

  private physicalFor(dayId: string, productId: string): number {
    const opening = this.openings.find(
      (item) =>
        item.inventory_day_id === dayId && item.product_id === productId,
    );
    const deltas = this.movements
      .filter(
        (item) =>
          item.inventory_day_id === dayId && item.product_id === productId,
      )
      .map((item) => Number(item.quantity_delta));
    return physicalQuantity(Number(opening?.opening_quantity ?? 0), deltas);
  }

  private toDay(day: DayRecord): InventoryDayView {
    return {
      id: day.id,
      businessDate: day.business_date,
      status: INVENTORY_DAY_OPEN,
      openedAt: day.opened_at,
    };
  }

  private toBalance(
    dayId: string,
    opening: OpeningRecord,
    products: readonly ProductView[],
  ): InventoryBalanceItem {
    const product = products.find((item) => item.id === opening.product_id);
    const physical = this.physicalFor(dayId, opening.product_id);
    const reserved = 0;
    return {
      productId: opening.product_id,
      productName: product?.name ?? '',
      openingQuantity: Number(opening.opening_quantity),
      physicalQuantity: physical,
      reservedQuantity: reserved,
      availableQuantity: physical - reserved,
      soldOut: physical === 0,
      quantityLabel: quantityLabel(physical),
    };
  }
}
