import './styles.css';
import { APP_VERSION } from './app-version';
import { roleLabel, type UserRole } from './domain/auth';
import { parseReaisToCents } from './domain/money';
import type {
  AppSession,
  InventoryBalanceItem,
  Product,
  StudentSummary,
} from './web/shared/app-api';
import { createAppApi } from './web/shared/create-app-api';
import {
  applyTheme,
  isThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from './web/shared/theme';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Elemento raiz da aplicação não encontrado.');
}

app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <a class="brand" href="#inicio" aria-label="Cantina V2 AppScript — início">
        <span class="brand-mark" aria-hidden="true">C2</span>
        <span>Cantina V2</span>
      </a>
      <fieldset class="theme-picker" aria-label="Tema da interface">
        <legend class="sr-only">Tema</legend>
        <button type="button" data-theme-option="system">Sistema</button>
        <button type="button" data-theme-option="light">Claro</button>
        <button type="button" data-theme-option="dark">Escuro</button>
      </fieldset>
    </header>

    <section class="hero" id="inicio" aria-labelledby="page-title">
      <p class="eyebrow">Web App em preparação</p>
      <h1 id="page-title">Cantina V2 AppScript</h1>
      <p class="intro">
        Uma base simples e confiável para a operação diária da cantina.
      </p>
      <div class="status-card" id="health-card" aria-live="polite">
        <span class="status-dot" aria-hidden="true"></span>
        <div>
          <strong id="health-status">Verificando ambiente…</strong>
          <p id="health-detail">Conectando à API local de demonstração.</p>
        </div>
      </div>
      <div class="session-card" id="session-card" hidden>
        <div id="session-login">
          <button type="button" id="login-owner">Entrar como dona</button>
          <button type="button" id="login-staff">Entrar como funcionário</button>
        </div>
        <div id="session-active" hidden>
          <p id="session-label"></p>
          <button type="button" id="logout">Sair</button>
        </div>
      </div>
    </section>

    <section class="next-step" aria-labelledby="next-step-title">
      <p class="step-number">01</p>
      <div>
        <h2 id="next-step-title">Carrinho e PIX</h2>
        <p>Venda com snapshot de preço, desconto da dona e baixa atômica no estoque.</p>
      </div>
      <span class="phase-badge">Fase 12</span>
    </section>

    <section class="students-panel" id="students-panel" hidden>
      <h2>Alunos</h2>
      <p id="students-status">Entre para ver o cadastro.</p>
      <ul id="students-list"></ul>
      <form id="student-form">
        <label>
          Nome completo
          <input id="student-name" name="fullName" required autocomplete="name" />
        </label>
        <label>
          Nascimento
          <input id="student-birth" type="date" />
        </label>
        <p class="form-or">ou idade aproximada</p>
        <label>
          Idade
          <input id="student-approx-age" type="number" min="0" max="120" />
        </label>
        <label>
          Ano da idade
          <input id="student-approx-year" type="number" min="1990" max="2100" />
        </label>
        <label>
          Turma
          <select id="student-classroom"></select>
        </label>
        <button type="submit">Cadastrar aluno</button>
      </form>
    </section>

    <section class="students-panel" id="family-panel" hidden>
      <h2>Responsáveis</h2>
      <p id="family-status">Entre para ver os responsáveis.</p>
      <ul id="guardians-list"></ul>
      <form id="guardian-form">
        <label>
          Nome completo
          <input id="guardian-name" name="fullName" required autocomplete="name" />
        </label>
        <label>
          Telefone
          <input id="guardian-phone" inputmode="tel" autocomplete="tel" />
        </label>
        <label>
          Relação
          <input id="guardian-relation" />
        </label>
        <label class="checkbox-label">
          <input id="guardian-whatsapp" type="checkbox" />
          WhatsApp
        </label>
        <button type="submit">Cadastrar responsável</button>
      </form>
      <h2>Irmãos autorizados</h2>
      <ul id="authorizations-list"></ul>
      <form id="age-setting-form">
        <label>
          Pedir responsável abaixo de
          <input id="guardian-age-setting" type="number" min="1" max="21" />
        </label>
        <button type="submit" id="save-age-setting">Salvar idade</button>
      </form>
    </section>

    <section class="students-panel" id="products-panel" hidden>
      <h2>Produtos</h2>
      <p id="products-status">Entre para ver o cardápio.</p>
      <ul id="products-list"></ul>
      <form id="product-form">
        <label>
          Nome
          <input id="product-name" required />
        </label>
        <label>
          Categoria
          <select id="product-category"></select>
        </label>
        <label>
          Preço (R$)
          <input id="product-price" inputmode="decimal" placeholder="5,50" required />
        </label>
        <label class="checkbox-label">
          <input id="product-discount" type="checkbox" />
          Permite desconto
        </label>
        <label class="checkbox-label">
          <input id="product-stock" type="checkbox" />
          Controla estoque
        </label>
        <label class="checkbox-label">
          <input id="product-reservable" type="checkbox" />
          Reservável
        </label>
        <button type="submit">Cadastrar produto</button>
      </form>
      <div id="ad-hoc-block">
        <h2>Item avulso</h2>
        <p id="ad-hoc-status">Só a dona registra item avulso. Ele não vira produto.</p>
        <ul id="ad-hoc-list"></ul>
        <form id="ad-hoc-form">
          <label>
            Nome
            <input id="ad-hoc-name" required />
          </label>
          <label>
            Preço (R$)
            <input id="ad-hoc-price" inputmode="decimal" placeholder="6,00" required />
          </label>
          <button type="submit">Registrar avulso</button>
        </form>
      </div>
    </section>

    <section class="students-panel" id="inventory-panel" hidden>
      <h2>Estoque do dia</h2>
      <p id="inventory-status">Entre para ver o estoque.</p>
      <ul id="inventory-list"></ul>
      <form id="inventory-adjust-form">
        <label>
          Produto
          <select id="inventory-adjust-product"></select>
        </label>
        <label>
          Ajuste
          <input id="inventory-adjust-delta" inputmode="numeric" placeholder="-1" required />
        </label>
        <label>
          Motivo
          <input id="inventory-adjust-reason" required />
        </label>
        <button type="submit">Ajustar estoque</button>
      </form>
    </section>

    <section class="students-panel" id="sales-panel" hidden>
      <h2>Vendas</h2>
      <p id="sales-status">Entre para vender.</p>
      <p id="pix-copy-text"></p>
      <form id="sale-cart-form">
        <label>
          Produto
          <select id="sale-product"></select>
        </label>
        <label>
          Quantidade
          <input id="sale-quantity" type="number" min="1" value="1" required />
        </label>
        <div id="sale-discount-fields">
          <label>
            Desconto
            <select id="sale-discount-kind">
              <option value="none">Sem desconto</option>
              <option value="amount">Valor (centavos)</option>
              <option value="percent">Porcento</option>
            </select>
          </label>
          <label>
            Valor do desconto
            <input id="sale-discount-input" inputmode="numeric" />
          </label>
        </div>
        <button type="submit">Adicionar ao carrinho</button>
      </form>
      <ul id="sale-cart-list"></ul>
      <form id="sale-confirm-form">
        <label>
          Aluno
          <select id="sale-student">
            <option value="">Venda anônima</option>
          </select>
        </label>
        <button type="submit">Confirmar PIX</button>
      </form>
      <ul id="sales-list"></ul>
    </section>

    <footer>
      <span>Versão ${APP_VERSION}</span>
      <span>Apps Script + Sheets + Drive</span>
    </footer>
  </main>
`;

const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
let theme: ThemePreference = isThemePreference(storedTheme)
  ? storedTheme
  : 'system';

function renderTheme(): void {
  applyTheme(document.documentElement, theme, systemTheme.matches);
  document
    .querySelectorAll<HTMLButtonElement>('[data-theme-option]')
    .forEach((button) => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.themeOption === theme),
      );
    });
}

document
  .querySelectorAll<HTMLButtonElement>('[data-theme-option]')
  .forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.dataset.themeOption ?? null;
      if (isThemePreference(selected)) {
        theme = selected;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        renderTheme();
      }
    });
  });

systemTheme.addEventListener('change', renderTheme);
renderTheme();

const api = createAppApi();
const sessionCard = document.querySelector('#session-card');
const sessionLogin = document.querySelector('#session-login');
const sessionActive = document.querySelector('#session-active');
const sessionLabel = document.querySelector('#session-label');

function renderSession(session: AppSession | null, canLogin: boolean): void {
  if (
    !(sessionCard instanceof HTMLElement) ||
    !(sessionLogin instanceof HTMLElement) ||
    !(sessionActive instanceof HTMLElement) ||
    !sessionLabel
  ) {
    return;
  }

  sessionCard.hidden = !canLogin;
  sessionLogin.hidden = Boolean(session);
  sessionActive.hidden = !session;
  sessionLabel.textContent = session
    ? `Sessão: ${roleLabel(session.role)}`
    : '';
}

async function loginAs(role: UserRole): Promise<void> {
  const session = await api.loginE2E(role);
  await showAuthenticated(session);
}

async function showAuthenticated(session: AppSession | null): Promise<void> {
  renderSession(session, true);
  await renderStudents(Boolean(session));
  await renderFamily(session);
  await renderProducts(session);
  await renderInventory(session);
  await renderSales(session);
}

document.querySelector('#login-owner')?.addEventListener('click', () => {
  void loginAs('owner');
});
document.querySelector('#login-staff')?.addEventListener('click', () => {
  void loginAs('staff');
});
document.querySelector('#logout')?.addEventListener('click', () => {
  void api.logout().then(() => showAuthenticated(null));
});

const studentsPanel = document.querySelector('#students-panel');
const studentsStatus = document.querySelector('#students-status');
const studentsList = document.querySelector('#students-list');
const classroomSelect = document.querySelector('#student-classroom');

function studentLine(student: StudentSummary): string {
  const classroom = student.classroomName || 'Sem turma';
  const inactive = student.active ? '' : ' • Inativo';
  const guardian = student.primaryGuardianName
    ? ` • Resp.: ${student.primaryGuardianName}`
    : student.needsGuardian
      ? ' • Precisa de responsável'
      : '';
  return `${student.fullName} • ${student.ageLabel} • ${classroom}${guardian}${inactive}`;
}

async function renderStudents(authenticated: boolean): Promise<void> {
  if (
    !(studentsPanel instanceof HTMLElement) ||
    !studentsStatus ||
    !(studentsList instanceof HTMLElement)
  ) {
    return;
  }
  studentsPanel.hidden = !authenticated;
  studentsList.replaceChildren();
  if (!authenticated) {
    studentsStatus.textContent = 'Entre para ver o cadastro.';
    return;
  }

  const [students, classrooms] = await Promise.all([
    api.listStudents({ includeInactive: true }),
    api.listClassrooms(),
  ]);
  studentsStatus.textContent =
    students.length === 0
      ? 'Nenhum aluno cadastrado ainda.'
      : `${students.length} aluno(s) no cadastro.`;

  if (classroomSelect instanceof HTMLSelectElement) {
    classroomSelect.replaceChildren();
    for (const classroom of classrooms) {
      const option = document.createElement('option');
      option.value = classroom.id;
      option.textContent = classroom.name;
      classroomSelect.append(option);
    }
  }

  for (const student of students) {
    const item = document.createElement('li');
    item.textContent = studentLine(student);
    const actions = document.createElement('div');
    if (student.active) {
      const deactivate = document.createElement('button');
      deactivate.type = 'button';
      deactivate.textContent = 'Desativar';
      deactivate.addEventListener('click', () => {
        void api.deactivateStudent(student.id).then(() => renderStudents(true));
      });
      actions.append(deactivate);
    } else {
      const review = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.setAttribute(
        'aria-label',
        `Revisei o cadastro de ${student.fullName}`,
      );
      review.append(checkbox, ' Revisei o cadastro');
      const reactivate = document.createElement('button');
      reactivate.type = 'button';
      reactivate.textContent = 'Reativar';
      reactivate.addEventListener('click', () => {
        void api
          .reactivateStudent(student.id, {
            reviewed: checkbox.checked,
            fullName: student.fullName,
          })
          .then(() => renderStudents(true))
          .catch((error: unknown) => {
            studentsStatus.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível reativar.';
          });
      });
      actions.append(review, reactivate);
    }
    item.append(actions);
    studentsList.append(item);
  }
}

const familyPanel = document.querySelector('#family-panel');
const familyStatus = document.querySelector('#family-status');
const guardiansList = document.querySelector('#guardians-list');
const authorizationsList = document.querySelector('#authorizations-list');
const ageSettingInput = document.querySelector('#guardian-age-setting');
const saveAgeSetting = document.querySelector('#save-age-setting');

function guardianLine(guardian: {
  fullName: string;
  relationLabel: string;
  whatsappEnabled: boolean;
}): string {
  const relation = guardian.relationLabel ? ` • ${guardian.relationLabel}` : '';
  const whatsapp = guardian.whatsappEnabled ? ' • WhatsApp' : '';
  return `${guardian.fullName}${relation}${whatsapp}`;
}

async function renderFamily(session: AppSession | null): Promise<void> {
  if (
    !(familyPanel instanceof HTMLElement) ||
    !familyStatus ||
    !(guardiansList instanceof HTMLElement) ||
    !(authorizationsList instanceof HTMLElement)
  ) {
    return;
  }
  familyPanel.hidden = !session;
  guardiansList.replaceChildren();
  authorizationsList.replaceChildren();
  if (!session) {
    familyStatus.textContent = 'Entre para ver os responsáveis.';
    return;
  }

  const [guardians, students, authorizations, settings] = await Promise.all([
    api.listGuardians({ includeInactive: true }),
    api.listStudents({ includeInactive: true }),
    api.listSiblingAuthorizations(),
    api.getGuardianSettings(),
  ]);
  familyStatus.textContent =
    guardians.length === 0
      ? 'Nenhum responsável cadastrado ainda.'
      : `${guardians.length} responsável(is) no cadastro.`;

  for (const guardian of guardians) {
    const item = document.createElement('li');
    item.textContent = guardianLine(guardian);
    guardiansList.append(item);
  }

  const studentById = new Map(students.map((student) => [student.id, student]));
  for (const authorization of authorizations.filter((item) => item.active)) {
    const account = studentById.get(authorization.accountStudentId);
    const item = document.createElement('li');
    const age = account ? ` • ${account.ageLabel}` : '';
    const credit = authorization.canUseAccountCredit ? ' e usar crédito' : '';
    item.textContent = authorization.canChargeAccount
      ? `${authorization.consumerName} pode lançar na conta de ${authorization.accountName}${age}${credit}`
      : `${authorization.consumerName} pode usar crédito de ${authorization.accountName}${age}`;
    authorizationsList.append(item);
  }

  if (ageSettingInput instanceof HTMLInputElement) {
    ageSettingInput.value = String(settings.requireGuardianBelowAge);
  }
  if (saveAgeSetting instanceof HTMLButtonElement) {
    saveAgeSetting.hidden = session.role !== 'owner';
  }
}

const productsPanel = document.querySelector('#products-panel');
const productsStatus = document.querySelector('#products-status');
const productsList = document.querySelector('#products-list');
const productCategorySelect = document.querySelector('#product-category');
const adHocBlock = document.querySelector('#ad-hoc-block');
const adHocStatus = document.querySelector('#ad-hoc-status');
const adHocList = document.querySelector('#ad-hoc-list');

function productLine(product: Product): string {
  const inactive = product.active ? '' : ' • Inativo';
  return `${product.name} • ${product.categoryName} • ${product.priceLabel}${inactive}`;
}

async function renderProducts(session: AppSession | null): Promise<void> {
  if (
    !(productsPanel instanceof HTMLElement) ||
    !productsStatus ||
    !(productsList instanceof HTMLElement)
  ) {
    return;
  }
  productsPanel.hidden = !session;
  productsList.replaceChildren();
  if (adHocList instanceof HTMLElement) {
    adHocList.replaceChildren();
  }
  if (!session) {
    productsStatus.textContent = 'Entre para ver o cardápio.';
    return;
  }

  const [categories, products] = await Promise.all([
    api.listProductCategories(),
    api.listProducts({ includeInactive: true }),
  ]);
  productsStatus.textContent =
    products.length === 0
      ? 'Nenhum produto cadastrado ainda.'
      : `${products.length} produto(s) no cardápio.`;

  if (productCategorySelect instanceof HTMLSelectElement) {
    productCategorySelect.replaceChildren();
    for (const category of categories) {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      productCategorySelect.append(option);
    }
  }

  for (const product of products) {
    const item = document.createElement('li');
    item.textContent = productLine(product);
    if (product.active) {
      const deactivate = document.createElement('button');
      deactivate.type = 'button';
      deactivate.textContent = 'Desativar';
      deactivate.addEventListener('click', () => {
        void api
          .deactivateProduct(product.id)
          .then(() => api.getSession().then(renderProducts));
      });
      item.append(deactivate);
    }
    productsList.append(item);
  }

  const isOwner = session.role === 'owner';
  if (adHocBlock instanceof HTMLElement) {
    adHocBlock.hidden = !isOwner;
  }
  if (!isOwner || !(adHocList instanceof HTMLElement) || !adHocStatus) {
    return;
  }

  const adHocItems = await api.listAdHocItems();
  adHocStatus.textContent =
    adHocItems.length === 0
      ? 'Só a dona registra item avulso. Ele não vira produto.'
      : `${adHocItems.length} item(ns) avulso(s).`;
  for (const item of adHocItems) {
    const row = document.createElement('li');
    row.textContent = `${item.name} • ${item.priceLabel}`;
    adHocList.append(row);
  }
}

const inventoryPanel = document.querySelector('#inventory-panel');
const inventoryStatus = document.querySelector('#inventory-status');
const inventoryList = document.querySelector('#inventory-list');
const inventoryAdjustForm = document.querySelector('#inventory-adjust-form');
const inventoryAdjustProduct = document.querySelector(
  '#inventory-adjust-product',
);

function inventoryLine(item: InventoryBalanceItem): string {
  return `${item.productName} • ${item.quantityLabel}`;
}

async function renderInventory(session: AppSession | null): Promise<void> {
  if (
    !(inventoryPanel instanceof HTMLElement) ||
    !inventoryStatus ||
    !(inventoryList instanceof HTMLElement)
  ) {
    return;
  }
  inventoryPanel.hidden = !session;
  inventoryList.replaceChildren();
  if (inventoryAdjustForm instanceof HTMLElement) {
    inventoryAdjustForm.hidden = true;
  }
  if (!session) {
    inventoryStatus.textContent = 'Entre para ver o estoque.';
    return;
  }

  try {
    const balances = await api.listInventoryBalances();
    inventoryStatus.textContent = `Estoque de ${balances.businessDate}.`;
    if (
      session.role === 'owner' &&
      inventoryAdjustProduct instanceof HTMLSelectElement &&
      inventoryAdjustForm instanceof HTMLElement
    ) {
      inventoryAdjustForm.hidden = false;
      inventoryAdjustProduct.replaceChildren();
      for (const item of balances.items) {
        const option = document.createElement('option');
        option.value = item.productId;
        option.textContent = item.productName;
        inventoryAdjustProduct.append(option);
      }
    }
    for (const item of balances.items) {
      const row = document.createElement('li');
      row.textContent = inventoryLine(item);
      inventoryList.append(row);
    }
  } catch (error: unknown) {
    inventoryStatus.textContent =
      error instanceof Error
        ? error.message.replace(/^[A-Z_]+:\s*/, '')
        : 'Não foi possível carregar o estoque.';
  }
}

const salesPanel = document.querySelector('#sales-panel');
const salesStatus = document.querySelector('#sales-status');
const salesList = document.querySelector('#sales-list');
const saleCartList = document.querySelector('#sale-cart-list');
const saleProductSelect = document.querySelector('#sale-product');
const saleStudentSelect = document.querySelector('#sale-student');
const saleDiscountFields = document.querySelector('#sale-discount-fields');
const pixCopyText = document.querySelector('#pix-copy-text');

interface CartLine {
  productId: string;
  name: string;
  quantity: number;
  discountKind: string;
  discountInput: number | null;
}

const cart: CartLine[] = [];

function renderCart(): void {
  if (!(saleCartList instanceof HTMLElement)) {
    return;
  }
  saleCartList.replaceChildren();
  for (const line of cart) {
    const item = document.createElement('li');
    item.textContent = `${line.name} • ${line.quantity}`;
    saleCartList.append(item);
  }
}

async function renderSales(session: AppSession | null): Promise<void> {
  if (
    !(salesPanel instanceof HTMLElement) ||
    !salesStatus ||
    !(salesList instanceof HTMLElement)
  ) {
    return;
  }
  salesPanel.hidden = !session;
  salesList.replaceChildren();
  if (saleDiscountFields instanceof HTMLElement) {
    saleDiscountFields.hidden = session?.role !== 'owner';
  }
  if (!session) {
    salesStatus.textContent = 'Entre para vender.';
    if (pixCopyText) {
      pixCopyText.textContent = '';
    }
    cart.length = 0;
    renderCart();
    return;
  }

  try {
    const [products, students, sales, pix] = await Promise.all([
      api.listProducts(),
      api.listStudents(),
      api.listSales(),
      api.getPixCopyText(),
    ]);
    if (pixCopyText) {
      pixCopyText.textContent = pix.text;
    }
    if (saleProductSelect instanceof HTMLSelectElement) {
      saleProductSelect.replaceChildren();
      for (const product of products.filter((item) => item.active)) {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} • ${product.priceLabel}`;
        saleProductSelect.append(option);
      }
    }
    if (saleStudentSelect instanceof HTMLSelectElement) {
      saleStudentSelect.replaceChildren();
      const anonymous = document.createElement('option');
      anonymous.value = '';
      anonymous.textContent = 'Venda anônima';
      saleStudentSelect.append(anonymous);
      for (const student of students.filter((item) => item.active)) {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.fullName} • ${student.ageLabel}`;
        saleStudentSelect.append(option);
      }
    }
    salesStatus.textContent =
      sales.length === 0
        ? 'Nenhuma venda registrada ainda.'
        : `${sales.length} venda(s).`;
    for (const sale of sales) {
      const item = document.createElement('li');
      item.textContent = sale.summaryLabel;
      salesList.append(item);
    }
    renderCart();
  } catch (error: unknown) {
    salesStatus.textContent =
      error instanceof Error
        ? error.message.replace(/^[A-Z_]+:\s*/, '')
        : 'Não foi possível carregar as vendas.';
  }
}

document
  .querySelector('#sale-cart-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const quantity = document.querySelector('#sale-quantity');
    const discountKind = document.querySelector('#sale-discount-kind');
    const discountInput = document.querySelector('#sale-discount-input');
    if (
      !(saleProductSelect instanceof HTMLSelectElement) ||
      !(quantity instanceof HTMLInputElement)
    ) {
      return;
    }
    const selected = saleProductSelect.selectedOptions[0];
    if (!selected) {
      return;
    }
    const kind =
      discountKind instanceof HTMLSelectElement &&
      saleDiscountFields instanceof HTMLElement &&
      !saleDiscountFields.hidden
        ? discountKind.value
        : 'none';
    const inputValue =
      discountInput instanceof HTMLInputElement && kind !== 'none'
        ? Number(discountInput.value)
        : null;
    cart.push({
      productId: saleProductSelect.value,
      name: selected.textContent?.split(' • ')[0] ?? selected.textContent ?? '',
      quantity: Number(quantity.value),
      discountKind: kind,
      discountInput: inputValue,
    });
    quantity.value = '1';
    if (discountKind instanceof HTMLSelectElement) {
      discountKind.value = 'none';
    }
    if (discountInput instanceof HTMLInputElement) {
      discountInput.value = '';
    }
    renderCart();
  });

document
  .querySelector('#sale-confirm-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!cart.length) {
      if (salesStatus) {
        salesStatus.textContent = 'Inclua pelo menos um item no carrinho.';
      }
      return;
    }
    const consumerStudentId =
      saleStudentSelect instanceof HTMLSelectElement
        ? saleStudentSelect.value || null
        : null;
    void api
      .createSale({
        consumerStudentId,
        items: cart.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          discountKind: line.discountKind,
          discountInput: line.discountInput,
        })),
        paymentKind: 'pix',
      })
      .then(() => {
        cart.length = 0;
        return api.getSession();
      })
      .then((session) =>
        Promise.all([renderSales(session), renderInventory(session)]),
      )
      .catch((error: unknown) => {
        if (salesStatus) {
          salesStatus.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível confirmar a venda.';
        }
      });
  });

document.querySelector('#student-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.querySelector('#student-name');
  const birth = document.querySelector('#student-birth');
  const approxAge = document.querySelector('#student-approx-age');
  const approxYear = document.querySelector('#student-approx-year');
  if (
    !(name instanceof HTMLInputElement) ||
    !(birth instanceof HTMLInputElement) ||
    !(approxAge instanceof HTMLInputElement) ||
    !(approxYear instanceof HTMLInputElement)
  ) {
    return;
  }
  const classroomId =
    classroomSelect instanceof HTMLSelectElement
      ? classroomSelect.value || null
      : null;
  void api
    .createStudent({
      fullName: name.value,
      birthDate: birth.value || null,
      approximateAge: approxAge.value ? Number(approxAge.value) : null,
      approximateAgeReferenceYear: approxYear.value
        ? Number(approxYear.value)
        : null,
      classroomId,
      startedOn: '2026-08-13',
    })
    .then(() => {
      name.value = '';
      birth.value = '';
      approxAge.value = '';
      approxYear.value = '';
      return renderStudents(true);
    })
    .then(() => api.getSession().then(renderFamily))
    .catch((error: unknown) => {
      if (studentsStatus) {
        studentsStatus.textContent =
          error instanceof Error
            ? error.message.replace(/^[A-Z_]+:\s*/, '')
            : 'Não foi possível cadastrar o aluno.';
      }
    });
});

document
  .querySelector('#guardian-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.querySelector('#guardian-name');
    const phone = document.querySelector('#guardian-phone');
    const relation = document.querySelector('#guardian-relation');
    const whatsapp = document.querySelector('#guardian-whatsapp');
    if (
      !(name instanceof HTMLInputElement) ||
      !(phone instanceof HTMLInputElement) ||
      !(relation instanceof HTMLInputElement) ||
      !(whatsapp instanceof HTMLInputElement)
    ) {
      return;
    }
    void api
      .createGuardian({
        fullName: name.value,
        phone: phone.value || null,
        relationLabel: relation.value || null,
        whatsappEnabled: whatsapp.checked,
      })
      .then(() => {
        name.value = '';
        phone.value = '';
        relation.value = '';
        whatsapp.checked = false;
        return api.getSession().then(renderFamily);
      })
      .catch((error: unknown) => {
        if (familyStatus) {
          familyStatus.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível cadastrar o responsável.';
        }
      });
  });

document
  .querySelector('#age-setting-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!(ageSettingInput instanceof HTMLInputElement)) {
      return;
    }
    void api
      .setRequireGuardianBelowAge(Number(ageSettingInput.value))
      .then(() =>
        Promise.all([
          renderStudents(true),
          api.getSession().then(renderFamily),
        ]),
      )
      .catch((error: unknown) => {
        if (familyStatus) {
          familyStatus.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível salvar a idade.';
        }
      });
  });

document.querySelector('#product-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.querySelector('#product-name');
  const price = document.querySelector('#product-price');
  const discount = document.querySelector('#product-discount');
  const stock = document.querySelector('#product-stock');
  const reservable = document.querySelector('#product-reservable');
  if (
    !(name instanceof HTMLInputElement) ||
    !(price instanceof HTMLInputElement) ||
    !(discount instanceof HTMLInputElement) ||
    !(stock instanceof HTMLInputElement) ||
    !(reservable instanceof HTMLInputElement) ||
    !(productCategorySelect instanceof HTMLSelectElement)
  ) {
    return;
  }
  const cents = parseReaisToCents(price.value);
  if (!cents.ok) {
    if (productsStatus) {
      productsStatus.textContent = cents.error.message;
    }
    return;
  }
  void api
    .createProduct({
      name: name.value,
      categoryId: productCategorySelect.value,
      priceCents: cents.data,
      discountAllowed: discount.checked,
      stockTracked: stock.checked,
      reservable: reservable.checked,
    })
    .then(() => {
      name.value = '';
      price.value = '';
      discount.checked = false;
      stock.checked = false;
      reservable.checked = false;
      return api.getSession().then(renderProducts);
    })
    .catch((error: unknown) => {
      if (productsStatus) {
        productsStatus.textContent =
          error instanceof Error
            ? error.message.replace(/^[A-Z_]+:\s*/, '')
            : 'Não foi possível cadastrar o produto.';
      }
    });
});

document.querySelector('#ad-hoc-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.querySelector('#ad-hoc-name');
  const price = document.querySelector('#ad-hoc-price');
  if (
    !(name instanceof HTMLInputElement) ||
    !(price instanceof HTMLInputElement)
  ) {
    return;
  }
  const cents = parseReaisToCents(price.value);
  if (!cents.ok) {
    if (adHocStatus) {
      adHocStatus.textContent = cents.error.message;
    }
    return;
  }
  void api
    .createAdHocItem({
      name: name.value,
      priceCents: cents.data,
    })
    .then(() => {
      name.value = '';
      price.value = '';
      return api.getSession().then(renderProducts);
    })
    .catch((error: unknown) => {
      if (adHocStatus) {
        adHocStatus.textContent =
          error instanceof Error
            ? error.message.replace(/^[A-Z_]+:\s*/, '')
            : 'Não foi possível registrar o item avulso.';
      }
    });
});

document
  .querySelector('#inventory-adjust-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const delta = document.querySelector('#inventory-adjust-delta');
    const reason = document.querySelector('#inventory-adjust-reason');
    if (
      !(delta instanceof HTMLInputElement) ||
      !(reason instanceof HTMLInputElement) ||
      !(inventoryAdjustProduct instanceof HTMLSelectElement)
    ) {
      return;
    }
    void api
      .adjustInventory({
        productId: inventoryAdjustProduct.value,
        quantityDelta: Number(delta.value),
        reason: reason.value,
      })
      .then(() => {
        delta.value = '';
        reason.value = '';
        return api.getSession().then(renderInventory);
      })
      .catch((error: unknown) => {
        if (inventoryStatus) {
          inventoryStatus.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível ajustar o estoque.';
        }
      });
  });

void api
  .getHealth()
  .then(async (health) => {
    const status = document.querySelector('#health-status');
    const detail = document.querySelector('#health-detail');
    const card = document.querySelector('#health-card');
    if (status && detail && card instanceof HTMLElement) {
      const isFake = health.adapter === 'fake';
      status.textContent = isFake
        ? 'Ambiente local funcionando'
        : health.environment === 'E2E'
          ? 'Ambiente E2E funcionando'
          : 'Web App funcionando';
      detail.textContent = isFake
        ? `${health.environment} • ${health.version} • API fake pronta`
        : `${health.environment} • ${health.version} • Planilha configurada`;
      card.dataset.appAdapter = health.adapter;
    }

    const canLogin =
      health.environment === 'LOCAL' || health.environment === 'E2E';
    const session = canLogin ? await api.getSession() : null;
    renderSession(session, canLogin);
    await renderStudents(Boolean(session));
    await renderFamily(session);
    await renderProducts(session);
    await renderInventory(session);
    await renderSales(session);
  })
  .catch(() => {
    const status = document.querySelector('#health-status');
    const detail = document.querySelector('#health-detail');
    if (status && detail) {
      status.textContent = 'Ambiente indisponível';
      detail.textContent = 'Não foi possível carregar o healthcheck.';
    }
  });
