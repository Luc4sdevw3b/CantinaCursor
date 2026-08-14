import { describe, expect, it } from 'vitest';
import { MemoryCatalog } from '../../src/server/products/memory-catalog';

describe('MemoryCatalog category and product lifecycle', () => {
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
      'Não é possível inativar a categoria enquanto houver produtos ativos nela.',
    );
    const after = catalog.listCategories();
    if (!after.ok) {
      throw new Error('categorias ausentes depois da recusa');
    }
    expect(after.data.find((item) => item.id === salgados.id)?.active).toBe(
      true,
    );
  });

  it('deactivates an unused category without removing it', () => {
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

  it('deletes an unused category instead of leaving it inactive', () => {
    const catalog = new MemoryCatalog(() => '2026-08-14T13:00:00.000Z');
    const created = catalog.createCategory('Lanches');
    if (!created.ok) {
      throw new Error('não criou categoria vazia');
    }
    const deleted = catalog.deleteCategory(created.data.id);
    expect(deleted.ok).toBe(true);
    const listed = catalog.listCategories();
    if (!listed.ok) {
      throw new Error('categorias ausentes');
    }
    expect(listed.data.some((item) => item.id === created.data.id)).toBe(false);
  });

  it('refuses to delete a category that still has products', () => {
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
    const result = catalog.deleteCategory(salgados.id);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe('CATEGORY_HAS_PRODUCTS');
  });

  it('deletes an unused product instead of leaving it inactive', () => {
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
    const created = catalog.createProduct({
      name: 'Produto e2e excluir',
      categoryId: salgados.id,
      priceCents: 100,
    });
    if (!created.ok) {
      throw new Error('não criou produto');
    }
    const deleted = catalog.deleteProduct(created.data.id);
    expect(deleted.ok).toBe(true);
    const listed = catalog.listProducts({ includeInactive: true });
    if (!listed.ok) {
      throw new Error('produtos ausentes');
    }
    expect(listed.data.some((item) => item.id === created.data.id)).toBe(false);
    expect(catalog.listProductPriceHistory(created.data.id).ok).toBe(false);
  });

  it('reactivates an inactive category and product', () => {
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
    const created = catalog.createProduct({
      name: 'Produto e2e inativar',
      categoryId: salgados.id,
      priceCents: 100,
    });
    if (!created.ok) {
      throw new Error('não criou produto');
    }
    expect(catalog.deactivateProduct(created.data.id).ok).toBe(true);
    const activated = catalog.activateProduct(created.data.id);
    expect(activated.ok).toBe(true);
    if (!activated.ok) {
      return;
    }
    expect(activated.data.active).toBe(true);
  });
});
