import { describe, expect, it } from 'vitest';
import { validateAdHocItem } from '../../src/domain/ad-hoc-item';
import {
  formatBrl,
  parseCents,
  parseReaisToCents,
} from '../../src/domain/money';
import { DEFAULT_PRODUCT_CATEGORIES } from '../../src/domain/product-category';
import { planPriceChange } from '../../src/domain/product-price';
import { validateProductProfile } from '../../src/domain/product-profile';

const CATEGORY = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000041';
const PRODUCT = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000042';
const USER = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000099';

describe('products and money', () => {
  it('keeps money in integer cents and formats BRL only for display', () => {
    expect(parseCents(550)).toEqual({ ok: true, data: 550 });
    expect(parseCents(5.5).ok).toBe(false);
    expect(parseReaisToCents('5,50')).toEqual({ ok: true, data: 550 });
    expect(formatBrl(550)).toBe('R$ 5,50');
  });

  it('requires name, category and cents for a catalog product', () => {
    expect(
      validateProductProfile({
        name: ' ',
        categoryId: CATEGORY,
        priceCents: 550,
      }).ok,
    ).toBe(false);
    expect(
      validateProductProfile({
        name: 'Coxinha',
        categoryId: CATEGORY,
        priceCents: 550,
        discountAllowed: true,
        stockTracked: true,
        reservable: false,
      }),
    ).toEqual({
      ok: true,
      data: {
        name: 'Coxinha',
        category_id: CATEGORY,
        price_cents: '550',
        discount_allowed: 'true',
        stock_tracked: 'true',
        reservable: 'false',
      },
    });
  });

  it('records a new price without rewriting the previous history row in place', () => {
    const first = planPriceChange({
      productId: PRODUCT,
      priceCents: 550,
      createdBy: USER,
      changedAt: '2026-08-13T16:00:00.000Z',
      createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-000000000051',
      existing: [],
    });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const second = planPriceChange({
      productId: PRODUCT,
      priceCents: 600,
      createdBy: USER,
      changedAt: '2026-08-13T17:00:00.000Z',
      createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-000000000052',
      existing: [first.data.open],
    });
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.data.close?.price_cents).toBe('550');
    expect(second.data.close?.ended_at).toBe('2026-08-13T17:00:00.000Z');
    expect(second.data.open.price_cents).toBe('600');
    expect(second.data.open.id).not.toBe(first.data.open.id);
  });

  it('keeps an ad-hoc item out of the product catalog shape', () => {
    expect(DEFAULT_PRODUCT_CATEGORIES).toEqual([
      'Salgados',
      'Bebidas',
      'Doces',
      'Outros',
    ]);
    expect(
      validateAdHocItem({ name: 'Pastel da hora', priceCents: 600 }),
    ).toEqual({
      ok: true,
      data: { name: 'Pastel da hora', price_cents: '600' },
    });
  });
});
