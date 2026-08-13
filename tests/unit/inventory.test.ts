import { describe, expect, it } from 'vitest';
import {
  physicalQuantity,
  quantityLabel,
  validateAdjustment,
  validateOpeningItems,
} from '../../src/domain/inventory';
import {
  parseOpeningQuantity,
  parseQuantityDelta,
} from '../../src/domain/quantity';

const COXINHA = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000042';
const SUCO = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000043';

describe('daily inventory', () => {
  it('keeps quantities as integers and labels zero as ACABOU', () => {
    expect(parseOpeningQuantity(10)).toEqual({ ok: true, data: 10 });
    expect(parseOpeningQuantity(0)).toEqual({ ok: true, data: 0 });
    expect(parseOpeningQuantity(1.5).ok).toBe(false);
    expect(parseQuantityDelta(-3)).toEqual({ ok: true, data: -3 });
    expect(parseQuantityDelta(0).ok).toBe(false);
    expect(physicalQuantity(10, [-3, 1])).toBe(8);
    expect(quantityLabel(10)).toBe('10');
    expect(quantityLabel(0)).toBe('ACABOU');
  });

  it('requires an opening quantity for every stock-tracked product', () => {
    expect(
      validateOpeningItems({
        businessDate: '2026-08-13',
        items: [{ productId: COXINHA, openingQuantity: 10 }],
        trackedProductIds: [COXINHA, SUCO],
      }).ok,
    ).toBe(false);
    expect(
      validateOpeningItems({
        businessDate: '2026-08-13',
        items: [
          { productId: COXINHA, openingQuantity: 10 },
          { productId: SUCO, openingQuantity: 0 },
        ],
        trackedProductIds: [COXINHA, SUCO],
      }),
    ).toEqual({
      ok: true,
      data: {
        business_date: '2026-08-13',
        items: [
          { product_id: COXINHA, opening_quantity: '10' },
          { product_id: SUCO, opening_quantity: '0' },
        ],
      },
    });
  });

  it('refuses an adjustment without reason or that would go negative', () => {
    expect(
      validateAdjustment({
        productId: COXINHA,
        quantityDelta: -3,
        reason: 'quebra',
        stockTracked: true,
        currentPhysical: 10,
      }),
    ).toEqual({
      ok: true,
      data: {
        product_id: COXINHA,
        quantity_delta: '-3',
        reason: 'quebra',
        kind: 'adjustment',
      },
    });
    expect(
      validateAdjustment({
        productId: COXINHA,
        quantityDelta: -11,
        reason: 'quebra',
        stockTracked: true,
        currentPhysical: 10,
      }).ok,
    ).toBe(false);
    expect(
      validateAdjustment({
        productId: COXINHA,
        quantityDelta: -1,
        reason: ' ',
        stockTracked: true,
        currentPhysical: 10,
      }).ok,
    ).toBe(false);
  });
});
