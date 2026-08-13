import { describe, expect, it } from 'vitest';
import { formatBrl, percentAmount } from '../../src/domain/money';
import {
  ANONYMOUS_SALE_LABEL,
  planSaleLine,
  planSaleTotals,
  planSettlements,
  saleSummaryLabel,
  validatePixPayment,
} from '../../src/domain/sale';
import { parseSaleQuantity } from '../../src/domain/quantity';

const COXINHA = {
  id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000042',
  name: 'Coxinha',
  priceCents: 550,
  discountAllowed: true,
  stockTracked: true,
  active: true,
};

describe('cart sale and PIX', () => {
  it('keeps line totals in integer cents and snapshots the product name', () => {
    expect(parseSaleQuantity(2)).toEqual({ ok: true, data: 2 });
    expect(parseSaleQuantity(0).ok).toBe(false);
    expect(percentAmount(550, 10)).toBe(55);
    const line = planSaleLine({
      item: { quantity: 2, discountKind: 'none' },
      product: COXINHA,
      actorIsOwner: false,
    });
    expect(line.ok).toBe(true);
    if (!line.ok) {
      return;
    }
    expect(line.data.description_snapshot).toBe('Coxinha');
    expect(line.data.unit_price_cents).toBe('550');
    expect(line.data.line_net_total_cents).toBe('1100');
    expect(planSaleTotals([line.data]).net_total_cents).toBe('1100');
    expect(formatBrl(1100)).toBe('R$ 11,00');
  });

  it('lets the owner discount an allowed product and refuses staff discount', () => {
    const owner = planSaleLine({
      item: {
        quantity: 1,
        discountKind: 'amount',
        discountInput: 50,
      },
      product: COXINHA,
      actorIsOwner: true,
    });
    expect(owner.ok).toBe(true);
    if (owner.ok) {
      expect(owner.data.discount_amount_cents).toBe('50');
      expect(owner.data.line_net_total_cents).toBe('500');
    }
    expect(
      planSaleLine({
        item: {
          quantity: 1,
          discountKind: 'amount',
          discountInput: 50,
        },
        product: COXINHA,
        actorIsOwner: false,
      }).ok,
    ).toBe(false);
  });

  it('accepts PIX, cash with change and mixed settlements', () => {
    expect(validatePixPayment('pix')).toEqual({ ok: true, data: 'pix' });
    expect(validatePixPayment('cash').ok).toBe(false);
    expect(
      saleSummaryLabel({
        consumerLabel: ANONYMOUS_SALE_LABEL,
        descriptions: ['Coxinha'],
        netLabel: 'R$ 5,50',
      }),
    ).toBe('Anônima • Coxinha • R$ 5,50');
    const cash = planSettlements({
      paymentKind: 'cash',
      netTotalCents: 550,
      cashTenderedCents: 1000,
    });
    expect(cash.ok).toBe(true);
    if (cash.ok) {
      expect(cash.data.changeCents).toBe(450);
      expect(cash.data.rows.map((row) => row.kind)).toEqual(['cash', 'change']);
    }
    expect(
      planSettlements({
        paymentKind: 'cash',
        netTotalCents: 550,
        cashTenderedCents: 400,
      }).ok,
    ).toBe(false);
    const mixed = planSettlements({
      paymentKind: 'mixed',
      netTotalCents: 550,
      pixAmountCents: 300,
      cashTenderedCents: 300,
    });
    expect(mixed.ok).toBe(true);
    if (mixed.ok) {
      expect(mixed.data.changeCents).toBe(50);
    }
    expect(
      saleSummaryLabel({
        consumerLabel: ANONYMOUS_SALE_LABEL,
        descriptions: ['Coxinha'],
        netLabel: 'R$ 5,50',
        paymentKind: 'cash',
        changeLabel: 'R$ 4,50',
      }),
    ).toBe('Anônima • Coxinha • R$ 5,50 • Dinheiro • Troco R$ 4,50');
    const fiado = planSettlements({
      paymentKind: 'fiado',
      netTotalCents: 550,
    });
    expect(fiado.ok).toBe(true);
    if (fiado.ok) {
      expect(fiado.data.rows).toEqual([{ kind: 'fiado', amount_cents: '550' }]);
    }
    expect(
      saleSummaryLabel({
        consumerLabel: 'Ana Souza • ~8',
        descriptions: ['Coxinha'],
        netLabel: 'R$ 5,50',
        paymentKind: 'fiado',
        dueDateLabel: 'Sexta-feira • 14/08/26',
      }),
    ).toBe(
      'Ana Souza • ~8 • Coxinha • R$ 5,50 • Fiado • Sexta-feira • 14/08/26',
    );
  });
});
