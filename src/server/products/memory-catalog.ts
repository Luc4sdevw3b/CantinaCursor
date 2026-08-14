import { validateAdHocItem } from '../../domain/ad-hoc-item';
import { isImmutableId, isSheetRowNumber } from '../../domain/ids';
import { formatBrl } from '../../domain/money';
import {
  DEFAULT_PRODUCT_CATEGORIES,
  validateCategoryName,
} from '../../domain/product-category';
import {
  type ProductPriceHistoryRecord,
  planPriceChange,
} from '../../domain/product-price';
import { validateProductProfile } from '../../domain/product-profile';
import { err, ok, type AppError, type Result } from '../../domain/result';

const LOCAL_ACTOR_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000099';

export interface ProductCategoryView {
  id: string;
  name: string;
  active: boolean;
}

export interface ProductView {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  priceCents: number;
  priceLabel: string;
  discountAllowed: boolean;
  stockTracked: boolean;
  reservable: boolean;
  active: boolean;
}

export interface ProductPriceHistoryView {
  id: string;
  productId: string;
  priceCents: number;
  priceLabel: string;
  startedAt: string;
  endedAt: string | null;
}

export interface AdHocItemView {
  id: string;
  name: string;
  priceCents: number;
  priceLabel: string;
  createdAt: string;
}

export interface ProductFields {
  name: string;
  categoryId: string;
  priceCents: number;
  discountAllowed?: boolean;
  stockTracked?: boolean;
  reservable?: boolean;
}

interface CategoryRecord {
  id: string;
  name: string;
  sort_order: string;
  active: string;
  created_at: string;
}

interface ProductRecord {
  id: string;
  category_id: string;
  name: string;
  price_cents: string;
  discount_allowed: string;
  stock_tracked: string;
  reservable: string;
  active: string;
  created_at: string;
  updated_at: string;
}

interface AdHocRecord {
  id: string;
  name: string;
  price_cents: string;
  created_by: string;
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

export class MemoryCatalog {
  private categories: CategoryRecord[] = [];
  private products: ProductRecord[] = [];
  private priceHistory: ProductPriceHistoryRecord[] = [];
  private adHocItems: AdHocRecord[] = [];
  private seeded = false;

  constructor(
    private readonly nowIso: () => string = () => new Date().toISOString(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  ensureDemoCatalog(): void {
    if (this.seeded) {
      return;
    }
    this.seeded = true;
    const categories = DEFAULT_PRODUCT_CATEGORIES.map((name, index) =>
      unwrap(this.createCategory(name, index + 1)),
    );
    const salgados = categories.find((item) => item.name === 'Salgados');
    const bebidas = categories.find((item) => item.name === 'Bebidas');
    const doces = categories.find((item) => item.name === 'Doces');
    if (!salgados || !bebidas || !doces) {
      throw new Error('DEMO_CATALOG: categorias iniciais ausentes.');
    }
    unwrap(
      this.createProduct({
        name: 'Coxinha',
        categoryId: salgados.id,
        priceCents: 550,
        discountAllowed: true,
        stockTracked: true,
        reservable: true,
      }),
    );
    unwrap(
      this.createProduct({
        name: 'Suco de uva',
        categoryId: bebidas.id,
        priceCents: 400,
        discountAllowed: false,
        stockTracked: true,
        reservable: true,
      }),
    );
    unwrap(
      this.createProduct({
        name: 'Brigadeiro',
        categoryId: doces.id,
        priceCents: 250,
        discountAllowed: true,
        stockTracked: false,
        reservable: false,
      }),
    );
  }

  listCategories(): Result<ProductCategoryView[]> {
    return ok(
      latestById(this.categories)
        .slice()
        .sort(
          (left, right) => Number(left.sort_order) - Number(right.sort_order),
        )
        .map((category) => ({
          id: category.id,
          name: category.name,
          active: category.active === 'true',
        })),
    );
  }

  createCategory(
    name: string,
    sortOrder?: number,
  ): Result<ProductCategoryView> {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      return err({
        code: 'CATEGORY_NAME_REQUIRED',
        message: 'Informe o nome da categoria.',
        retryable: false,
      });
    }
    const record: CategoryRecord = {
      id: this.createId(),
      name: trimmed,
      sort_order: String(sortOrder ?? latestById(this.categories).length + 1),
      active: 'true',
      created_at: this.nowIso(),
    };
    this.categories.push(record);
    return ok({
      id: record.id,
      name: record.name,
      active: true,
    });
  }

  updateCategory(id: string, name: string): Result<ProductCategoryView> {
    const current = this.findCategory(id);
    if (!current.ok) {
      return err(current.error);
    }
    const trimmed = validateCategoryName(name);
    if (!trimmed.ok) {
      return err(trimmed.error);
    }
    const record: CategoryRecord = {
      ...current.data,
      name: trimmed.data,
    };
    this.categories.push(record);
    return ok({
      id: record.id,
      name: record.name,
      active: record.active === 'true',
    });
  }

  deactivateCategory(id: string): Result<ProductCategoryView> {
    const current = this.findCategory(id);
    if (!current.ok) {
      return err(current.error);
    }
    if (current.data.active !== 'true') {
      return err({
        code: 'CATEGORY_ALREADY_INACTIVE',
        message: 'Esta categoria já está inativa.',
        retryable: false,
      });
    }
    const hasActiveProduct = latestById(this.products).some(
      (product) => product.category_id === id && product.active === 'true',
    );
    if (hasActiveProduct) {
      return err({
        code: 'CATEGORY_HAS_ACTIVE_PRODUCTS',
        message:
          'Não é possível excluir a categoria enquanto houver produtos ativos nela.',
        retryable: false,
      });
    }
    const record: CategoryRecord = {
      ...current.data,
      active: 'false',
    };
    this.categories.push(record);
    return ok({
      id: record.id,
      name: record.name,
      active: false,
    });
  }

  listProducts(query?: { includeInactive?: boolean }): Result<ProductView[]> {
    const includeInactive = query?.includeInactive !== false;
    return ok(
      latestById(this.products)
        .filter((product) => includeInactive || product.active === 'true')
        .map((product) => this.toProduct(product)),
    );
  }

  getProduct(id: string): Result<ProductView> {
    const product = this.findProduct(id);
    if (!product.ok) {
      return err(product.error);
    }
    return ok(this.toProduct(product.data));
  }

  createProduct(input: ProductFields): Result<ProductView> {
    const profile = validateProductProfile(input);
    if (!profile.ok) {
      return err(profile.error);
    }
    const category = this.findCategory(profile.data.category_id);
    if (!category.ok) {
      return err(category.error);
    }
    if (category.data.active !== 'true') {
      return err({
        code: 'CATEGORY_INACTIVE',
        message: 'Não é possível usar uma categoria inativa.',
        retryable: false,
      });
    }
    const now = this.nowIso();
    const record: ProductRecord = {
      id: this.createId(),
      ...profile.data,
      active: 'true',
      created_at: now,
      updated_at: now,
    };
    this.products.push(record);
    const history = planPriceChange({
      productId: record.id,
      priceCents: Number(record.price_cents),
      createdBy: LOCAL_ACTOR_ID,
      changedAt: now,
      createId: this.createId,
      existing: this.priceHistory,
    });
    if (!history.ok) {
      return err(history.error);
    }
    this.priceHistory.push(history.data.open);
    return ok(this.toProduct(record));
  }

  updateProduct(id: string, input: ProductFields): Result<ProductView> {
    const previous = this.findProduct(id);
    if (!previous.ok) {
      return err(previous.error);
    }
    const profile = validateProductProfile(input);
    if (!profile.ok) {
      return err(profile.error);
    }
    const category = this.findCategory(profile.data.category_id);
    if (!category.ok) {
      return err(category.error);
    }
    if (category.data.active !== 'true') {
      return err({
        code: 'CATEGORY_INACTIVE',
        message: 'Não é possível usar uma categoria inativa.',
        retryable: false,
      });
    }
    const now = this.nowIso();
    const record: ProductRecord = {
      ...previous.data,
      ...profile.data,
      updated_at: now,
    };
    this.products.push(record);
    const history = planPriceChange({
      productId: record.id,
      priceCents: Number(record.price_cents),
      createdBy: LOCAL_ACTOR_ID,
      changedAt: now,
      createId: this.createId,
      existing: this.priceHistory,
    });
    if (!history.ok) {
      return err(history.error);
    }
    if (history.data.close) {
      this.priceHistory.push(history.data.close);
    }
    if (
      !this.priceHistory.some(
        (item) =>
          item.id === history.data.open.id &&
          item.ended_at === history.data.open.ended_at,
      )
    ) {
      this.priceHistory.push(history.data.open);
    }
    return ok(this.toProduct(record));
  }

  deactivateProduct(id: string): Result<ProductView> {
    const previous = this.findProduct(id);
    if (!previous.ok) {
      return err(previous.error);
    }
    if (previous.data.active !== 'true') {
      return err({
        code: 'PRODUCT_ALREADY_INACTIVE',
        message: 'Este produto já está inativo.',
        retryable: false,
      });
    }
    const record: ProductRecord = {
      ...previous.data,
      active: 'false',
      updated_at: this.nowIso(),
    };
    this.products.push(record);
    return ok(this.toProduct(record));
  }

  listProductPriceHistory(
    productId: string,
  ): Result<ProductPriceHistoryView[]> {
    const product = this.findProduct(productId);
    if (!product.ok) {
      return err(product.error);
    }
    return ok(
      latestById(
        this.priceHistory.filter((item) => item.product_id === productId),
      ).map((item) => ({
        id: item.id,
        productId: item.product_id,
        priceCents: Number(item.price_cents),
        priceLabel: formatBrl(Number(item.price_cents)),
        startedAt: item.started_at,
        endedAt: item.ended_at || null,
      })),
    );
  }

  createAdHocItem(input: {
    name: string;
    priceCents: number;
  }): Result<AdHocItemView> {
    const profile = validateAdHocItem(input);
    if (!profile.ok) {
      return err(profile.error);
    }
    const record: AdHocRecord = {
      id: this.createId(),
      ...profile.data,
      created_by: LOCAL_ACTOR_ID,
      created_at: this.nowIso(),
    };
    this.adHocItems.push(record);
    return ok(this.toAdHoc(record));
  }

  listAdHocItems(): Result<AdHocItemView[]> {
    return ok(this.adHocItems.map((item) => this.toAdHoc(item)));
  }

  private findCategory(id: string): Result<CategoryRecord> {
    const validId = parseId(id);
    if (!validId.ok) {
      return err(validId.error);
    }
    const category = latestById(this.categories).find((item) => item.id === id);
    if (!category) {
      return err({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Categoria não encontrada.',
        retryable: false,
      });
    }
    return ok(category);
  }

  private findProduct(id: string): Result<ProductRecord> {
    const validId = parseId(id);
    if (!validId.ok) {
      return err(validId.error);
    }
    const product = latestById(this.products).find((item) => item.id === id);
    if (!product) {
      return err({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produto não encontrado.',
        retryable: false,
      });
    }
    return ok(product);
  }

  private toProduct(product: ProductRecord): ProductView {
    const category = latestById(this.categories).find(
      (item) => item.id === product.category_id,
    );
    const priceCents = Number(product.price_cents);
    return {
      id: product.id,
      categoryId: product.category_id,
      categoryName: category?.name ?? '',
      name: product.name,
      priceCents,
      priceLabel: formatBrl(priceCents),
      discountAllowed: product.discount_allowed === 'true',
      stockTracked: product.stock_tracked === 'true',
      reservable: product.reservable === 'true',
      active: product.active === 'true',
    };
  }

  private toAdHoc(item: AdHocRecord): AdHocItemView {
    const priceCents = Number(item.price_cents);
    return {
      id: item.id,
      name: item.name,
      priceCents,
      priceLabel: formatBrl(priceCents),
      createdAt: item.created_at,
    };
  }
}
