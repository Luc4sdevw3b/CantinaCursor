import { describe, expect, it } from 'vitest';
import { MemoryCatalog } from '../../src/server/products/memory-catalog';

describe('MemoryCatalog deactivateCategory', () => {
  it('refuses to deactivate a category that still has active products', () => {
    const catalog = new MemoryCatalog(() => '2026-08-14T13:00:00.000Z');
    catalog.ensureDemoCatalog();
    const categories = catalog.listCategories();
    if (!categories.ok) {
      throw new Error('categorias ausentes');
    }
    const salgados = categories.data.find((item) => item.name === 'Salgados');
    if (!salgados) {
      throw new Error('Salgados ausente');
    }
    const result = catalog.deactivateCategory(salgados.id);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe('CATEGORY_HAS_ACTIVE_PRODUCTS');
    expect(result.error.message).toBe(
      'Não é possível excluir a categoria enquanto houver produtos ativos nela.',
    );
    const after = catalog.listCategories();
    if (!after.ok) {
      throw new Error('categorias ausentes depois da recusa');
    }
    expect(after.data.find((item) => item.id === salgados.id)?.active).toBe(
      true,
    );
  });

  it('deactivates an unused category', () => {
    const catalog = new MemoryCatalog(() => '2026-08-14T13:00:00.000Z');
    const created = catalog.createCategory('Lanches');
    if (!created.ok) {
      throw new Error('não criou categoria vazia');
    }
    const result = catalog.deactivateCategory(created.data.id);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.active).toBe(false);
    const listed = catalog.listCategories();
    if (!listed.ok) {
      throw new Error('categorias ausentes');
    }
    expect(
      listed.data.find((item) => item.id === created.data.id)?.active,
    ).toBe(false);
  });
});
