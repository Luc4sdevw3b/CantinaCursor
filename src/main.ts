import './styles.css';
import { APP_VERSION } from './app-version';
import { roleLabel, type UserRole } from './domain/auth';
import { parseReaisToCents } from './domain/money';
import type {
  AppSession,
  DueDateShortcuts,
  InventoryBalanceItem,
  Product,
  Receivable,
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
      <div class="hero-copy">
        <p class="eyebrow">Web App em preparação</p>
        <div class="hero-title-row">
          <h1 id="page-title">Cantina V2 AppScript</h1>
          <span class="phase-badge">Fase 18</span>
        </div>
        <p class="intro">
          Uma base simples e confiável para a operação diária da cantina.
        </p>
      </div>
      <div class="hero-status">
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
      </div>
      <nav class="area-nav" id="area-nav" hidden aria-label="Áreas da cantina">
        <button type="button" data-area="sales">Vendas</button>
        <button type="button" data-area="agenda">Agenda</button>
        <button type="button" data-area="payments">Pagamentos</button>
        <button type="button" data-area="credits">Crédito</button>
        <button type="button" data-area="inventory">Estoque</button>
        <button type="button" data-area="students">Alunos</button>
        <button type="button" data-area="family">Responsáveis</button>
        <button type="button" data-area="products">Cardápio</button>
        <button type="button" data-area="adjust" data-owner-only>Juros</button>
      </nav>
    </section>

    <div class="workspace" id="workspace">
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
      <h2>Crédito do responsável</h2>
      <ul id="guardian-credit-links"></ul>
      <form id="guardian-credit-auth-form">
        <label>
          Aluno
          <select id="credit-auth-student" required>
            <option value="">Escolha o aluno</option>
          </select>
        </label>
        <label>
          Responsável
          <select id="credit-auth-guardian" required>
            <option value="">Escolha o responsável</option>
          </select>
        </label>
        <label class="checkbox-label">
          <input id="credit-auth-can-use" type="checkbox" />
          Pode usar crédito
        </label>
        <label class="checkbox-label">
          <input id="credit-auth-auto-settle" type="checkbox" />
          Autoquitar dívida
        </label>
        <button type="submit">Salvar autorização</button>
      </form>
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
        <button type="submit" id="product-submit">Cadastrar produto</button>
        <button type="button" id="product-cancel" hidden>Cancelar</button>
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
        <label>
          Pagamento
          <select id="sale-payment-kind">
            <option value="pix">PIX</option>
            <option value="cash">Dinheiro</option>
            <option value="mixed">PIX + dinheiro</option>
            <option value="fiado">Fiado</option>
          </select>
        </label>
        <label id="sale-pix-amount-label" hidden>
          PIX (R$)
          <input id="sale-pix-amount" inputmode="decimal" placeholder="3,00" />
        </label>
        <label id="sale-cash-amount-label" hidden>
          Recebido (R$)
          <input id="sale-cash-amount" inputmode="decimal" placeholder="10,00" />
        </label>
        <div id="sale-fiado-fields" hidden>
          <label>
            Vencimento
            <input id="sale-due-date" type="date" />
          </label>
          <div>
            <button type="button" id="sale-due-tomorrow">Amanhã</button>
            <button type="button" id="sale-due-friday">Próxima sexta</button>
            <button type="button" id="sale-due-plus7">+7 dias</button>
          </div>
        </div>
        <p id="sale-change-preview"></p>
        <button type="submit">Confirmar venda</button>
      </form>
      <ul id="sales-list"></ul>
    </section>

    <section class="students-panel" id="agenda-panel" hidden>
      <h2>Agenda</h2>
      <p id="agenda-status">Entre para ver os vencimentos.</p>
      <h3>Atrasados</h3>
      <ul id="agenda-overdue"></ul>
      <h3>Hoje</h3>
      <ul id="agenda-today"></ul>
      <h3>Próximos</h3>
      <ul id="agenda-upcoming"></ul>
    </section>

    <section class="students-panel" id="payments-panel" hidden>
      <h2>Pagamentos</h2>
      <p id="payments-status">Entre para registrar pagamentos.</p>
      <form id="payment-form">
        <label>
          Aluno
          <select id="payment-student" required>
            <option value="">Escolha o aluno</option>
          </select>
        </label>
        <label>
          Valor (R$)
          <input id="payment-amount" inputmode="decimal" placeholder="5,50" />
        </label>
        <label>
          Método
          <select id="payment-method">
            <option value="pix">PIX</option>
            <option value="cash">Dinheiro</option>
          </select>
        </label>
        <label>
          Alocação
          <select id="payment-mode">
            <option value="oldest_first">Dívida mais antiga</option>
            <option value="selected">Selecionadas</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <ul id="payment-debts" hidden></ul>
        <button type="submit">Registrar pagamento</button>
      </form>
      <ul id="payments-list"></ul>
    </section>

    <section class="students-panel" id="credits-panel" hidden>
      <h2>Crédito pessoal</h2>
      <p id="credits-status">Entre para registrar crédito.</p>
      <form id="credit-deposit-form">
        <label>
          Aluno
          <select id="credit-student" required>
            <option value="">Escolha o aluno</option>
          </select>
        </label>
        <label>
          Valor (R$)
          <input id="credit-amount" inputmode="decimal" placeholder="2,00" />
        </label>
        <label>
          Método
          <select id="credit-method">
            <option value="pix">PIX</option>
            <option value="cash">Dinheiro</option>
          </select>
        </label>
        <button type="submit">Entrar crédito</button>
      </form>
      <form id="credit-refund-form" hidden>
        <label>
          Valor (R$)
          <input id="credit-refund-amount" inputmode="decimal" placeholder="2,00" />
        </label>
        <label>
          Motivo
          <input id="credit-refund-reason" required />
        </label>
        <button type="submit">Devolver crédito</button>
      </form>
      <ul id="credits-list"></ul>
      <h2>Crédito do responsável</h2>
      <form id="guardian-credit-deposit-form">
        <label>
          Responsável
          <select id="credit-guardian" required>
            <option value="">Escolha o responsável</option>
          </select>
        </label>
        <label>
          Valor (R$)
          <input id="guardian-credit-amount" inputmode="decimal" placeholder="2,00" />
        </label>
        <label>
          Método
          <select id="guardian-credit-method">
            <option value="pix">PIX</option>
            <option value="cash">Dinheiro</option>
          </select>
        </label>
        <button type="submit">Entrar crédito do responsável</button>
      </form>
      <form id="guardian-credit-refund-form" hidden>
        <label>
          Valor (R$)
          <input
            id="guardian-credit-refund-amount"
            inputmode="decimal"
            placeholder="2,00"
          />
        </label>
        <label>
          Motivo
          <input id="guardian-credit-refund-reason" required />
        </label>
        <button type="submit">Devolver crédito do responsável</button>
      </form>
    </section>

    <section class="students-panel" id="adjust-panel" hidden>
      <h2>Juros e renegociação</h2>
      <p id="adjust-status">Só a dona lança juros e troca vencimento.</p>
      <label>
        Dívida
        <select id="adjust-receivable">
          <option value="">Escolha a dívida</option>
        </select>
      </label>
      <form id="interest-form">
        <label>
          Juros
          <select id="interest-kind">
            <option value="amount">Valor (R$)</option>
            <option value="percent">Porcento</option>
          </select>
        </label>
        <label id="interest-amount-label">
          Valor (R$)
          <input id="interest-amount" inputmode="decimal" placeholder="1,00" />
        </label>
        <label id="interest-percent-label" hidden>
          Porcento
          <input id="interest-percent" type="number" min="1" max="100" />
        </label>
        <label>
          Motivo
          <input id="interest-reason" required />
        </label>
        <button type="submit">Lançar juros</button>
      </form>
      <form id="renegotiate-form">
        <label>
          Novo vencimento
          <input id="renegotiate-due-date" type="date" />
        </label>
        <div>
          <button type="button" id="renegotiate-due-tomorrow">Amanhã</button>
          <button type="button" id="renegotiate-due-friday">Próxima sexta</button>
          <button type="button" id="renegotiate-due-plus7">+7 dias</button>
        </div>
        <label>
          Motivo
          <input id="renegotiate-reason" required />
        </label>
        <button type="submit">Renegociar vencimento</button>
      </form>
      <h3>Histórico de vencimento</h3>
      <ul id="due-date-history"></ul>
    </section>
    </div>

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

type AppArea =
  | 'sales'
  | 'agenda'
  | 'payments'
  | 'credits'
  | 'inventory'
  | 'students'
  | 'family'
  | 'products'
  | 'adjust';

const AREA_PANELS: Record<AppArea, string> = {
  sales: '#sales-panel',
  agenda: '#agenda-panel',
  payments: '#payments-panel',
  credits: '#credits-panel',
  inventory: '#inventory-panel',
  students: '#students-panel',
  family: '#family-panel',
  products: '#products-panel',
  adjust: '#adjust-panel',
};

const DEFAULT_AREA: AppArea = 'sales';
let currentSession: AppSession | null = null;
let activeArea: AppArea = DEFAULT_AREA;

function isAppArea(value: string | undefined): value is AppArea {
  return Boolean(value && value in AREA_PANELS);
}

function syncWorkspace(session: AppSession | null): void {
  currentSession = session;
  const shell = document.querySelector('.shell');
  if (shell instanceof HTMLElement) {
    shell.classList.toggle('is-authenticated', Boolean(session));
  }
  const nav = document.querySelector('#area-nav');
  if (nav instanceof HTMLElement) {
    nav.hidden = !session;
  }
  if (session?.role !== 'owner' && activeArea === 'adjust') {
    activeArea = DEFAULT_AREA;
  }
  if (!session) {
    activeArea = DEFAULT_AREA;
  }
  document
    .querySelectorAll<HTMLButtonElement>('#area-nav [data-area]')
    .forEach((button) => {
      const area = button.dataset.area;
      const ownerOnly = button.hasAttribute('data-owner-only');
      button.hidden = Boolean(ownerOnly && session?.role !== 'owner');
      button.setAttribute(
        'aria-current',
        area === activeArea ? 'page' : 'false',
      );
    });
  for (const [area, selector] of Object.entries(AREA_PANELS)) {
    const panel = document.querySelector(selector);
    if (!(panel instanceof HTMLElement)) {
      continue;
    }
    if (!session) {
      panel.hidden = true;
      continue;
    }
    if (area === 'adjust' && session.role !== 'owner') {
      panel.hidden = true;
      continue;
    }
    panel.hidden = area !== activeArea;
  }
}

function openArea(area: AppArea): void {
  activeArea = area;
  syncWorkspace(currentSession);
}

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
  if (!session) {
    activeArea = DEFAULT_AREA;
    fillProductForm(null);
  }
  syncWorkspace(session);
  renderSession(session, true);
  await renderStudents(Boolean(session));
  await renderFamily(session);
  await renderProducts(session);
  await renderInventory(session);
  await renderSales(session);
  await renderAgenda(session);
  await renderPayments(session);
  await renderCredits(session);
  await renderAdjust(session);
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

document
  .querySelectorAll<HTMLButtonElement>('#area-nav [data-area]')
  .forEach((button) => {
    button.addEventListener('click', () => {
      if (isAppArea(button.dataset.area)) {
        openArea(button.dataset.area);
      }
    });
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
const guardianCreditLinks = document.querySelector('#guardian-credit-links');
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

function guardianCreditLinkLine(
  student: StudentSummary,
  link: {
    guardianName: string;
    isPrimary: boolean;
    canUseGuardianCredit: boolean;
    autoSettleDebtFromGuardianCredit: boolean;
  },
): string {
  const flags: string[] = [];
  if (link.isPrimary) {
    flags.push('principal');
  }
  if (link.canUseGuardianCredit) {
    flags.push('pode usar crédito');
  }
  if (link.autoSettleDebtFromGuardianCredit) {
    flags.push('autoquita dívida');
  }
  return `${student.fullName} • ${student.ageLabel} • ${link.guardianName}${flags.length ? ` • ${flags.join(' • ')}` : ''}`;
}

async function renderFamily(session: AppSession | null): Promise<void> {
  if (
    !(familyPanel instanceof HTMLElement) ||
    !familyStatus ||
    !(guardiansList instanceof HTMLElement) ||
    !(authorizationsList instanceof HTMLElement) ||
    !(guardianCreditLinks instanceof HTMLElement)
  ) {
    return;
  }
  guardiansList.replaceChildren();
  authorizationsList.replaceChildren();
  guardianCreditLinks.replaceChildren();
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

  const authStudent = document.querySelector('#credit-auth-student');
  const authGuardian = document.querySelector('#credit-auth-guardian');
  if (authStudent instanceof HTMLSelectElement) {
    const current = authStudent.value;
    authStudent.replaceChildren();
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'Escolha o aluno';
    authStudent.append(empty);
    for (const student of students.filter((item) => item.active)) {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = `${student.fullName} • ${student.ageLabel}`;
      authStudent.append(option);
    }
    if (current && students.some((item) => item.id === current)) {
      authStudent.value = current;
    }
  }
  if (authGuardian instanceof HTMLSelectElement) {
    const current = authGuardian.value;
    authGuardian.replaceChildren();
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'Escolha o responsável';
    authGuardian.append(empty);
    for (const guardian of guardians.filter((item) => item.active)) {
      const option = document.createElement('option');
      option.value = guardian.id;
      option.textContent = guardianLine(guardian);
      authGuardian.append(option);
    }
    if (current && guardians.some((item) => item.id === current)) {
      authGuardian.value = current;
    }
  }

  const linkGroups = await Promise.all(
    students.map((student) =>
      api
        .getStudentGuardians(student.id)
        .then((links) =>
          links
            .filter((link) => link.active)
            .map((link) => ({ student, link })),
        ),
    ),
  );
  for (const { student, link } of linkGroups.flat()) {
    const item = document.createElement('li');
    item.textContent = guardianCreditLinkLine(student, link);
    guardianCreditLinks.append(item);
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

function priceInputFromCents(cents: number): string {
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`;
}

let editingProductId: string | null = null;

function fillProductForm(product: Product | null): void {
  const name = document.querySelector('#product-name');
  const price = document.querySelector('#product-price');
  const discount = document.querySelector('#product-discount');
  const stock = document.querySelector('#product-stock');
  const reservable = document.querySelector('#product-reservable');
  const submit = document.querySelector('#product-submit');
  const cancel = document.querySelector('#product-cancel');
  editingProductId = product?.id ?? null;
  if (
    !(name instanceof HTMLInputElement) ||
    !(price instanceof HTMLInputElement) ||
    !(discount instanceof HTMLInputElement) ||
    !(stock instanceof HTMLInputElement) ||
    !(reservable instanceof HTMLInputElement)
  ) {
    return;
  }
  if (productCategorySelect instanceof HTMLSelectElement && product) {
    productCategorySelect.value = product.categoryId;
  }
  name.value = product?.name ?? '';
  price.value = product ? priceInputFromCents(product.priceCents) : '';
  discount.checked = product?.discountAllowed ?? false;
  stock.checked = product?.stockTracked ?? false;
  reservable.checked = product?.reservable ?? false;
  if (submit instanceof HTMLButtonElement) {
    submit.textContent = product ? 'Salvar produto' : 'Cadastrar produto';
  }
  if (cancel instanceof HTMLButtonElement) {
    cancel.hidden = !product;
  }
}

async function renderProducts(session: AppSession | null): Promise<void> {
  if (
    !(productsPanel instanceof HTMLElement) ||
    !productsStatus ||
    !(productsList instanceof HTMLElement)
  ) {
    return;
  }
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
    if (editingProductId) {
      const editing = products.find((item) => item.id === editingProductId);
      if (editing) {
        productCategorySelect.value = editing.categoryId;
      }
    }
  }

  for (const product of products) {
    const item = document.createElement('li');
    item.textContent = productLine(product);
    const actions = document.createElement('div');
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Editar';
    edit.addEventListener('click', () => {
      fillProductForm(product);
      const nameField = document.querySelector('#product-name');
      if (nameField instanceof HTMLInputElement) {
        nameField.focus();
      }
    });
    actions.append(edit);
    if (product.active) {
      const deactivate = document.createElement('button');
      deactivate.type = 'button';
      deactivate.textContent = 'Desativar';
      deactivate.addEventListener('click', () => {
        void api.deactivateProduct(product.id).then(() => {
          if (editingProductId === product.id) {
            fillProductForm(null);
          }
          return api.getSession().then(renderProducts);
        });
      });
      actions.append(deactivate);
    }
    item.append(actions);
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
let dueDateShortcuts: DueDateShortcuts | null = null;
let openReceivables: Receivable[] = [];
let dueDateHistoryLabels: string[] = [];

function applyDueDateShortcut(civilDate: string): void {
  const dueDate = document.querySelector('#sale-due-date');
  if (dueDate instanceof HTMLInputElement) {
    dueDate.value = civilDate;
  }
}

function syncPaymentFields(): void {
  const kind = document.querySelector('#sale-payment-kind');
  const pixLabel = document.querySelector('#sale-pix-amount-label');
  const cashLabel = document.querySelector('#sale-cash-amount-label');
  const fiadoFields = document.querySelector('#sale-fiado-fields');
  const preview = document.querySelector('#sale-change-preview');
  const value = kind instanceof HTMLSelectElement ? kind.value : 'pix';
  if (pixLabel instanceof HTMLElement) {
    pixLabel.hidden = value !== 'mixed';
  }
  if (cashLabel instanceof HTMLElement) {
    cashLabel.hidden = value !== 'cash' && value !== 'mixed';
  }
  if (fiadoFields instanceof HTMLElement) {
    fiadoFields.hidden = value !== 'fiado';
  }
  if (preview) {
    preview.textContent =
      value === 'cash' || value === 'mixed'
        ? 'O troco é calculado na confirmação.'
        : '';
  }
}

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
    syncPaymentFields();
    return;
  }

  try {
    const [products, students, sales, pix, shortcuts] = await Promise.all([
      api.listProducts(),
      api.listStudents(),
      api.listSales(),
      api.getPixCopyText(),
      api.getDueDateShortcuts(),
    ]);
    dueDateShortcuts = shortcuts;
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
    syncPaymentFields();
  } catch (error: unknown) {
    salesStatus.textContent =
      error instanceof Error
        ? error.message.replace(/^[A-Z_]+:\s*/, '')
        : 'Não foi possível carregar as vendas.';
  }
}

async function renderAgenda(session: AppSession | null): Promise<void> {
  const panel = document.querySelector('#agenda-panel');
  const status = document.querySelector('#agenda-status');
  const overdueList = document.querySelector('#agenda-overdue');
  const todayList = document.querySelector('#agenda-today');
  const upcomingList = document.querySelector('#agenda-upcoming');
  if (
    !(panel instanceof HTMLElement) ||
    !status ||
    !(overdueList instanceof HTMLElement) ||
    !(todayList instanceof HTMLElement) ||
    !(upcomingList instanceof HTMLElement)
  ) {
    return;
  }
  overdueList.replaceChildren();
  todayList.replaceChildren();
  upcomingList.replaceChildren();
  if (!session) {
    status.textContent = 'Entre para ver os vencimentos.';
    openReceivables = [];
    dueDateHistoryLabels = [];
    return;
  }
  try {
    const agenda = await api.listReceivables();
    openReceivables = [...agenda.overdue, ...agenda.today, ...agenda.upcoming];
    dueDateHistoryLabels = agenda.dueDateHistory.map(
      (item) => item.summaryLabel,
    );
    const total = openReceivables.length;
    status.textContent =
      total === 0 ? 'Nenhum recebível.' : `${total} recebível(is).`;
    for (const item of agenda.overdue) {
      const row = document.createElement('li');
      row.textContent = item.summaryLabel;
      overdueList.append(row);
    }
    for (const item of agenda.today) {
      const row = document.createElement('li');
      row.textContent = item.summaryLabel;
      todayList.append(row);
    }
    for (const item of agenda.upcoming) {
      const row = document.createElement('li');
      row.textContent = item.summaryLabel;
      upcomingList.append(row);
    }
  } catch (error: unknown) {
    status.textContent =
      error instanceof Error
        ? error.message.replace(/^[A-Z_]+:\s*/, '')
        : 'Não foi possível carregar a agenda.';
  }
}

function paymentModeValue(): 'oldest_first' | 'selected' | 'manual' {
  const mode = document.querySelector('#payment-mode');
  if (mode instanceof HTMLSelectElement && mode.value === 'selected') {
    return 'selected';
  }
  if (mode instanceof HTMLSelectElement && mode.value === 'manual') {
    return 'manual';
  }
  return 'oldest_first';
}

function renderPaymentDebts(): void {
  const list = document.querySelector('#payment-debts');
  const student = document.querySelector('#payment-student');
  if (!(list instanceof HTMLElement)) {
    return;
  }
  const mode = paymentModeValue();
  const studentId = student instanceof HTMLSelectElement ? student.value : '';
  list.replaceChildren();
  list.hidden = mode === 'oldest_first' || !studentId;
  if (list.hidden) {
    return;
  }
  const debts = openReceivables.filter(
    (item) => item.chargedStudentId === studentId,
  );
  for (const debt of debts) {
    const row = document.createElement('li');
    if (mode === 'selected') {
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.dataset.receivableId = debt.id;
      label.append(box, document.createTextNode(` ${debt.summaryLabel}`));
      row.append(label);
    } else {
      const label = document.createElement('label');
      label.textContent = debt.summaryLabel;
      const amount = document.createElement('input');
      amount.dataset.receivableId = debt.id;
      amount.inputMode = 'decimal';
      amount.placeholder = '0,00';
      row.append(label, amount);
    }
    list.append(row);
  }
}

async function renderPayments(session: AppSession | null): Promise<void> {
  const panel = document.querySelector('#payments-panel');
  const status = document.querySelector('#payments-status');
  const list = document.querySelector('#payments-list');
  const studentSelect = document.querySelector('#payment-student');
  if (
    !(panel instanceof HTMLElement) ||
    !status ||
    !(list instanceof HTMLElement)
  ) {
    return;
  }
  list.replaceChildren();
  if (!session) {
    status.textContent = 'Entre para registrar pagamentos.';
    if (studentSelect instanceof HTMLSelectElement) {
      studentSelect.replaceChildren();
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'Escolha o aluno';
      studentSelect.append(empty);
    }
    renderPaymentDebts();
    return;
  }
  try {
    const [students, payments] = await Promise.all([
      api.listStudents({ includeInactive: true }),
      api.listPayments(),
    ]);
    if (studentSelect instanceof HTMLSelectElement) {
      const current = studentSelect.value;
      studentSelect.replaceChildren();
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'Escolha o aluno';
      studentSelect.append(empty);
      for (const student of students) {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.fullName} • ${student.ageLabel}`;
        studentSelect.append(option);
      }
      if (current && students.some((item) => item.id === current)) {
        studentSelect.value = current;
      }
    }
    status.textContent =
      payments.length === 0
        ? 'Nenhum pagamento registrado ainda.'
        : `${payments.length} pagamento(s).`;
    for (const payment of payments) {
      const item = document.createElement('li');
      item.textContent = payment.summaryLabel;
      list.append(item);
    }
    renderPaymentDebts();
  } catch (error: unknown) {
    status.textContent =
      error instanceof Error
        ? error.message.replace(/^[A-Z_]+:\s*/, '')
        : 'Não foi possível carregar os pagamentos.';
  }
}

function syncInterestFields(): void {
  const kind = document.querySelector('#interest-kind');
  const amountLabel = document.querySelector('#interest-amount-label');
  const percentLabel = document.querySelector('#interest-percent-label');
  const value = kind instanceof HTMLSelectElement ? kind.value : 'amount';
  if (amountLabel instanceof HTMLElement) {
    amountLabel.hidden = value !== 'amount';
  }
  if (percentLabel instanceof HTMLElement) {
    percentLabel.hidden = value !== 'percent';
  }
}

async function renderCredits(session: AppSession | null): Promise<void> {
  const panel = document.querySelector('#credits-panel');
  const status = document.querySelector('#credits-status');
  const list = document.querySelector('#credits-list');
  const studentSelect = document.querySelector('#credit-student');
  const refundForm = document.querySelector('#credit-refund-form');
  const guardianRefundForm = document.querySelector(
    '#guardian-credit-refund-form',
  );
  const guardianSelect = document.querySelector('#credit-guardian');
  if (
    !(panel instanceof HTMLElement) ||
    !status ||
    !(list instanceof HTMLElement)
  ) {
    return;
  }
  list.replaceChildren();
  if (refundForm instanceof HTMLElement) {
    refundForm.hidden = session?.role !== 'owner';
  }
  if (guardianRefundForm instanceof HTMLElement) {
    guardianRefundForm.hidden = session?.role !== 'owner';
  }
  if (!session) {
    status.textContent = 'Entre para registrar crédito.';
    if (studentSelect instanceof HTMLSelectElement) {
      studentSelect.replaceChildren();
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'Escolha o aluno';
      studentSelect.append(empty);
    }
    if (guardianSelect instanceof HTMLSelectElement) {
      guardianSelect.replaceChildren();
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'Escolha o responsável';
      guardianSelect.append(empty);
    }
    return;
  }
  try {
    const [students, guardians, accounts] = await Promise.all([
      api.listStudents({ includeInactive: true }),
      api.listGuardians({ includeInactive: true }),
      api.listCreditAccounts(),
    ]);
    if (studentSelect instanceof HTMLSelectElement) {
      const current = studentSelect.value;
      studentSelect.replaceChildren();
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'Escolha o aluno';
      studentSelect.append(empty);
      for (const student of students) {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.fullName} • ${student.ageLabel}`;
        studentSelect.append(option);
      }
      if (current && students.some((item) => item.id === current)) {
        studentSelect.value = current;
      }
    }
    if (guardianSelect instanceof HTMLSelectElement) {
      const current = guardianSelect.value;
      guardianSelect.replaceChildren();
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'Escolha o responsável';
      guardianSelect.append(empty);
      for (const guardian of guardians.filter((item) => item.active)) {
        const option = document.createElement('option');
        option.value = guardian.id;
        option.textContent = guardianLine(guardian);
        guardianSelect.append(option);
      }
      if (current && guardians.some((item) => item.id === current)) {
        guardianSelect.value = current;
      }
    }
    status.textContent = accounts.length
      ? `${accounts.length} conta${accounts.length === 1 ? '' : 's'}.`
      : 'Nenhum crédito ainda.';
    for (const account of accounts) {
      const item = document.createElement('li');
      item.textContent = account.summaryLabel;
      list.append(item);
    }
  } catch (error: unknown) {
    status.textContent =
      error instanceof Error
        ? error.message.replace(/^[A-Z_]+:\s*/, '')
        : 'Não foi possível carregar o crédito.';
  }
}

function applyRenegotiateDueDate(civilDate: string): void {
  const dueDate = document.querySelector('#renegotiate-due-date');
  if (dueDate instanceof HTMLInputElement) {
    dueDate.value = civilDate;
  }
}

async function renderAdjust(session: AppSession | null): Promise<void> {
  const panel = document.querySelector('#adjust-panel');
  const status = document.querySelector('#adjust-status');
  const select = document.querySelector('#adjust-receivable');
  const history = document.querySelector('#due-date-history');
  if (
    !(panel instanceof HTMLElement) ||
    !status ||
    !(select instanceof HTMLSelectElement) ||
    !(history instanceof HTMLElement)
  ) {
    return;
  }
  const isOwner = session?.role === 'owner';
  history.replaceChildren();
  const current = select.value;
  select.replaceChildren();
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = 'Escolha a dívida';
  select.append(empty);
  if (!isOwner) {
    status.textContent = 'Só a dona lança juros e troca vencimento.';
    return;
  }
  for (const item of openReceivables) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.summaryLabel;
    select.append(option);
  }
  if (current && openReceivables.some((item) => item.id === current)) {
    select.value = current;
  }
  status.textContent =
    openReceivables.length === 0
      ? 'Nenhuma dívida em aberto.'
      : `${openReceivables.length} dívida(s) em aberto.`;
  for (const label of dueDateHistoryLabels) {
    const row = document.createElement('li');
    row.textContent = label;
    history.append(row);
  }
  syncInterestFields();
}

document
  .querySelector('#sale-payment-kind')
  ?.addEventListener('change', syncPaymentFields);

document.querySelector('#sale-due-tomorrow')?.addEventListener('click', () => {
  if (dueDateShortcuts) {
    applyDueDateShortcut(dueDateShortcuts.tomorrow);
  }
});
document.querySelector('#sale-due-friday')?.addEventListener('click', () => {
  if (dueDateShortcuts) {
    applyDueDateShortcut(dueDateShortcuts.nextFriday);
  }
});
document.querySelector('#sale-due-plus7')?.addEventListener('click', () => {
  if (dueDateShortcuts) {
    applyDueDateShortcut(dueDateShortcuts.plus7);
  }
});

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
    const paymentKindSelect = document.querySelector('#sale-payment-kind');
    const pixAmountInput = document.querySelector('#sale-pix-amount');
    const cashAmountInput = document.querySelector('#sale-cash-amount');
    const paymentKind =
      paymentKindSelect instanceof HTMLSelectElement
        ? paymentKindSelect.value
        : 'pix';
    if (
      paymentKind !== 'pix' &&
      paymentKind !== 'cash' &&
      paymentKind !== 'mixed' &&
      paymentKind !== 'fiado'
    ) {
      return;
    }
    let pixAmountCents: number | undefined;
    let cashTenderedCents: number | undefined;
    let installments: Array<{ dueDate: string }> | undefined;
    if (paymentKind === 'mixed' && pixAmountInput instanceof HTMLInputElement) {
      const pix = parseReaisToCents(pixAmountInput.value);
      if (!pix.ok) {
        if (salesStatus) {
          salesStatus.textContent = pix.error.message;
        }
        return;
      }
      pixAmountCents = pix.data;
    }
    if (
      (paymentKind === 'cash' || paymentKind === 'mixed') &&
      cashAmountInput instanceof HTMLInputElement
    ) {
      const cash = parseReaisToCents(cashAmountInput.value);
      if (!cash.ok) {
        if (salesStatus) {
          salesStatus.textContent = cash.error.message;
        }
        return;
      }
      cashTenderedCents = cash.data;
    }
    if (paymentKind === 'fiado') {
      const dueDate = document.querySelector('#sale-due-date');
      const dueDateValue =
        dueDate instanceof HTMLInputElement ? dueDate.value : '';
      if (!dueDateValue) {
        if (salesStatus) {
          salesStatus.textContent = 'Informe o vencimento do fiado.';
        }
        return;
      }
      installments = [{ dueDate: dueDateValue }];
    }
    void api
      .createSale({
        consumerStudentId,
        items: cart.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          discountKind: line.discountKind,
          discountInput: line.discountInput,
        })),
        paymentKind,
        pixAmountCents,
        cashTenderedCents,
        installments,
      })
      .then(() => {
        cart.length = 0;
        if (pixAmountInput instanceof HTMLInputElement) {
          pixAmountInput.value = '';
        }
        if (cashAmountInput instanceof HTMLInputElement) {
          cashAmountInput.value = '';
        }
        return api.getSession();
      })
      .then((session) =>
        Promise.all([
          renderSales(session),
          renderInventory(session),
          renderAgenda(session),
        ]).then(() =>
          renderPayments(session).then(() =>
            renderCredits(session).then(() => renderAdjust(session)),
          ),
        ),
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

document
  .querySelector('#payment-student')
  ?.addEventListener('change', renderPaymentDebts);
document
  .querySelector('#payment-mode')
  ?.addEventListener('change', renderPaymentDebts);

document.querySelector('#payment-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const status = document.querySelector('#payments-status');
  const student = document.querySelector('#payment-student');
  const amountInput = document.querySelector('#payment-amount');
  const methodSelect = document.querySelector('#payment-method');
  if (
    !(student instanceof HTMLSelectElement) ||
    !(amountInput instanceof HTMLInputElement) ||
    !(methodSelect instanceof HTMLSelectElement)
  ) {
    return;
  }
  const studentId = student.value;
  if (!studentId) {
    if (status) {
      status.textContent = 'Escolha o aluno da dívida.';
    }
    return;
  }
  const method = methodSelect.value;
  if (method !== 'pix' && method !== 'cash') {
    return;
  }
  const mode = paymentModeValue();
  const selectedReceivableIds: string[] = [];
  const allocations: Array<{ receivableId: string; amountCents: number }> = [];
  if (mode === 'selected') {
    document
      .querySelectorAll<HTMLInputElement>(
        '#payment-debts input[type="checkbox"]',
      )
      .forEach((box) => {
        if (box.checked && box.dataset.receivableId) {
          selectedReceivableIds.push(box.dataset.receivableId);
        }
      });
  }
  if (mode === 'manual') {
    const inputs = document.querySelectorAll<HTMLInputElement>(
      '#payment-debts input[data-receivable-id]',
    );
    for (const input of inputs) {
      if (!input.value.trim() || !input.dataset.receivableId) {
        continue;
      }
      const parsed = parseReaisToCents(input.value);
      if (!parsed.ok) {
        if (status) {
          status.textContent = parsed.error.message;
        }
        return;
      }
      allocations.push({
        receivableId: input.dataset.receivableId,
        amountCents: parsed.data,
      });
    }
  }
  let amountCents: number;
  if (!amountInput.value.trim() && mode === 'manual') {
    amountCents = allocations.reduce(
      (total, line) => total + line.amountCents,
      0,
    );
  } else {
    const parsed = parseReaisToCents(amountInput.value);
    if (!parsed.ok) {
      if (status) {
        status.textContent = parsed.error.message;
      }
      return;
    }
    amountCents = parsed.data;
  }
  void api
    .createPayment({
      studentId,
      amountCents,
      method,
      mode,
      selectedReceivableIds:
        mode === 'selected' ? selectedReceivableIds : undefined,
      allocations: mode === 'manual' ? allocations : undefined,
    })
    .then(() => {
      amountInput.value = '';
      return api.getSession();
    })
    .then((session) =>
      renderAgenda(session).then(() =>
        renderPayments(session).then(() =>
          renderCredits(session).then(() => renderAdjust(session)),
        ),
      ),
    )
    .catch((error: unknown) => {
      if (status) {
        status.textContent =
          error instanceof Error
            ? error.message.replace(/^[A-Z_]+:\s*/, '')
            : 'Não foi possível registrar o pagamento.';
      }
    });
});

document
  .querySelector('#credit-deposit-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#credits-status');
    const studentSelect = document.querySelector('#credit-student');
    const amountInput = document.querySelector('#credit-amount');
    const methodSelect = document.querySelector('#credit-method');
    if (
      !(studentSelect instanceof HTMLSelectElement) ||
      !(amountInput instanceof HTMLInputElement) ||
      !(methodSelect instanceof HTMLSelectElement)
    ) {
      return;
    }
    const studentId = studentSelect.value;
    if (!studentId) {
      if (status) {
        status.textContent = 'Escolha o aluno.';
      }
      return;
    }
    const parsed = parseReaisToCents(amountInput.value);
    if (!parsed.ok) {
      if (status) {
        status.textContent = parsed.error.message;
      }
      return;
    }
    const method = methodSelect.value;
    if (method !== 'pix' && method !== 'cash') {
      return;
    }
    void api
      .depositPersonalCredit({
        studentId,
        amountCents: parsed.data,
        method,
      })
      .then(() => {
        amountInput.value = '';
        return api.getSession();
      })
      .then((session) =>
        renderAgenda(session).then(() =>
          renderPayments(session).then(() =>
            renderCredits(session).then(() => renderAdjust(session)),
          ),
        ),
      )
      .catch((error: unknown) => {
        if (status) {
          status.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível entrar o crédito.';
        }
      });
  });

document
  .querySelector('#credit-refund-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#credits-status');
    const studentSelect = document.querySelector('#credit-student');
    const amountInput = document.querySelector('#credit-refund-amount');
    const reasonInput = document.querySelector('#credit-refund-reason');
    if (
      !(studentSelect instanceof HTMLSelectElement) ||
      !(amountInput instanceof HTMLInputElement) ||
      !(reasonInput instanceof HTMLInputElement)
    ) {
      return;
    }
    const studentId = studentSelect.value;
    if (!studentId) {
      if (status) {
        status.textContent = 'Escolha o aluno.';
      }
      return;
    }
    const parsed = parseReaisToCents(amountInput.value);
    if (!parsed.ok) {
      if (status) {
        status.textContent = parsed.error.message;
      }
      return;
    }
    void api
      .refundPersonalCredit({
        studentId,
        amountCents: parsed.data,
        reason: reasonInput.value,
      })
      .then(() => {
        amountInput.value = '';
        reasonInput.value = '';
        return api.getSession();
      })
      .then((session) => renderCredits(session))
      .catch((error: unknown) => {
        if (status) {
          status.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível devolver o crédito.';
        }
      });
  });

document
  .querySelector('#guardian-credit-auth-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#family-status');
    const studentSelect = document.querySelector('#credit-auth-student');
    const guardianSelect = document.querySelector('#credit-auth-guardian');
    const canUse = document.querySelector('#credit-auth-can-use');
    const autoSettle = document.querySelector('#credit-auth-auto-settle');
    if (
      !(studentSelect instanceof HTMLSelectElement) ||
      !(guardianSelect instanceof HTMLSelectElement) ||
      !(canUse instanceof HTMLInputElement) ||
      !(autoSettle instanceof HTMLInputElement)
    ) {
      return;
    }
    if (!studentSelect.value || !guardianSelect.value) {
      if (status) {
        status.textContent = 'Escolha o aluno e o responsável.';
      }
      return;
    }
    void api
      .getStudentGuardians(studentSelect.value)
      .then((links) => {
        const current = links.find(
          (link) => link.guardianId === guardianSelect.value && link.active,
        );
        return api.linkGuardian(studentSelect.value, guardianSelect.value, {
          isPrimary: current?.isPrimary,
          canUseGuardianCredit: canUse.checked,
          autoSettle: autoSettle.checked,
        });
      })
      .then(() => api.getSession())
      .then((session) => renderFamily(session))
      .catch((error: unknown) => {
        if (status) {
          status.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível salvar a autorização.';
        }
      });
  });

document
  .querySelector('#guardian-credit-deposit-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#credits-status');
    const guardianSelect = document.querySelector('#credit-guardian');
    const amountInput = document.querySelector('#guardian-credit-amount');
    const methodSelect = document.querySelector('#guardian-credit-method');
    if (
      !(guardianSelect instanceof HTMLSelectElement) ||
      !(amountInput instanceof HTMLInputElement) ||
      !(methodSelect instanceof HTMLSelectElement)
    ) {
      return;
    }
    const guardianId = guardianSelect.value;
    if (!guardianId) {
      if (status) {
        status.textContent = 'Escolha o responsável.';
      }
      return;
    }
    const parsed = parseReaisToCents(amountInput.value);
    if (!parsed.ok) {
      if (status) {
        status.textContent = parsed.error.message;
      }
      return;
    }
    const method = methodSelect.value;
    if (method !== 'pix' && method !== 'cash') {
      return;
    }
    void api
      .depositGuardianCredit({
        guardianId,
        amountCents: parsed.data,
        method,
      })
      .then(() => {
        amountInput.value = '';
        return api.getSession();
      })
      .then((session) =>
        renderAgenda(session).then(() =>
          renderPayments(session).then(() =>
            renderCredits(session).then(() => renderAdjust(session)),
          ),
        ),
      )
      .catch((error: unknown) => {
        if (status) {
          status.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível entrar o crédito.';
        }
      });
  });

document
  .querySelector('#guardian-credit-refund-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#credits-status');
    const guardianSelect = document.querySelector('#credit-guardian');
    const amountInput = document.querySelector(
      '#guardian-credit-refund-amount',
    );
    const reasonInput = document.querySelector(
      '#guardian-credit-refund-reason',
    );
    if (
      !(guardianSelect instanceof HTMLSelectElement) ||
      !(amountInput instanceof HTMLInputElement) ||
      !(reasonInput instanceof HTMLInputElement)
    ) {
      return;
    }
    const guardianId = guardianSelect.value;
    if (!guardianId) {
      if (status) {
        status.textContent = 'Escolha o responsável.';
      }
      return;
    }
    const parsed = parseReaisToCents(amountInput.value);
    if (!parsed.ok) {
      if (status) {
        status.textContent = parsed.error.message;
      }
      return;
    }
    void api
      .refundGuardianCredit({
        guardianId,
        amountCents: parsed.data,
        reason: reasonInput.value,
      })
      .then(() => {
        amountInput.value = '';
        reasonInput.value = '';
        return api.getSession();
      })
      .then((session) => renderCredits(session))
      .catch((error: unknown) => {
        if (status) {
          status.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível devolver o crédito.';
        }
      });
  });

document
  .querySelector('#interest-kind')
  ?.addEventListener('change', syncInterestFields);

document
  .querySelector('#renegotiate-due-tomorrow')
  ?.addEventListener('click', () => {
    if (dueDateShortcuts) {
      applyRenegotiateDueDate(dueDateShortcuts.tomorrow);
    }
  });
document
  .querySelector('#renegotiate-due-friday')
  ?.addEventListener('click', () => {
    if (dueDateShortcuts) {
      applyRenegotiateDueDate(dueDateShortcuts.nextFriday);
    }
  });
document
  .querySelector('#renegotiate-due-plus7')
  ?.addEventListener('click', () => {
    if (dueDateShortcuts) {
      applyRenegotiateDueDate(dueDateShortcuts.plus7);
    }
  });

document
  .querySelector('#interest-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#adjust-status');
    const receivable = document.querySelector('#adjust-receivable');
    const kindSelect = document.querySelector('#interest-kind');
    const amountInput = document.querySelector('#interest-amount');
    const percentInput = document.querySelector('#interest-percent');
    const reasonInput = document.querySelector('#interest-reason');
    if (
      !(receivable instanceof HTMLSelectElement) ||
      !(kindSelect instanceof HTMLSelectElement) ||
      !(amountInput instanceof HTMLInputElement) ||
      !(percentInput instanceof HTMLInputElement) ||
      !(reasonInput instanceof HTMLInputElement)
    ) {
      return;
    }
    const receivableId = receivable.value;
    if (!receivableId) {
      if (status) {
        status.textContent = 'Escolha a dívida.';
      }
      return;
    }
    const kind = kindSelect.value;
    if (kind !== 'amount' && kind !== 'percent') {
      return;
    }
    let amountCents: number | undefined;
    let percent: number | undefined;
    if (kind === 'amount') {
      const parsed = parseReaisToCents(amountInput.value);
      if (!parsed.ok) {
        if (status) {
          status.textContent = parsed.error.message;
        }
        return;
      }
      amountCents = parsed.data;
    } else {
      percent = Number(percentInput.value);
    }
    void api
      .addReceivableInterest({
        receivableId,
        kind,
        amountCents,
        percent,
        reason: reasonInput.value,
      })
      .then(() => {
        amountInput.value = '';
        percentInput.value = '';
        reasonInput.value = '';
        return api.getSession();
      })
      .then((session) =>
        renderAgenda(session).then(() => renderAdjust(session)),
      )
      .catch((error: unknown) => {
        if (status) {
          status.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível lançar o juros.';
        }
      });
  });

document
  .querySelector('#renegotiate-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#adjust-status');
    const receivable = document.querySelector('#adjust-receivable');
    const dueDate = document.querySelector('#renegotiate-due-date');
    const reasonInput = document.querySelector('#renegotiate-reason');
    if (
      !(receivable instanceof HTMLSelectElement) ||
      !(dueDate instanceof HTMLInputElement) ||
      !(reasonInput instanceof HTMLInputElement)
    ) {
      return;
    }
    const receivableId = receivable.value;
    if (!receivableId) {
      if (status) {
        status.textContent = 'Escolha a dívida.';
      }
      return;
    }
    if (!dueDate.value) {
      if (status) {
        status.textContent = 'Informe o novo vencimento.';
      }
      return;
    }
    void api
      .renegotiateReceivable({
        receivableId,
        dueDate: dueDate.value,
        reason: reasonInput.value,
      })
      .then(() => {
        reasonInput.value = '';
        return api.getSession();
      })
      .then((session) =>
        renderAgenda(session).then(() => renderAdjust(session)),
      )
      .catch((error: unknown) => {
        if (status) {
          status.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível renegociar o vencimento.';
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
  const fields = {
    name: name.value,
    categoryId: productCategorySelect.value,
    priceCents: cents.data,
    discountAllowed: discount.checked,
    stockTracked: stock.checked,
    reservable: reservable.checked,
  };
  const saved = editingProductId
    ? api.updateProduct(editingProductId, fields)
    : api.createProduct(fields);
  void saved
    .then(() => {
      fillProductForm(null);
      return api
        .getSession()
        .then((session) =>
          Promise.all([
            renderProducts(session),
            renderSales(session),
            renderInventory(session),
          ]),
        );
    })
    .catch((error: unknown) => {
      if (productsStatus) {
        productsStatus.textContent =
          error instanceof Error
            ? error.message.replace(/^[A-Z_]+:\s*/, '')
            : 'Não foi possível salvar o produto.';
      }
    });
});

document.querySelector('#product-cancel')?.addEventListener('click', () => {
  fillProductForm(null);
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
    if (canLogin) {
      await showAuthenticated(session);
    } else {
      renderSession(null, false);
      syncWorkspace(null);
    }
  })
  .catch(() => {
    const status = document.querySelector('#health-status');
    const detail = document.querySelector('#health-detail');
    if (status && detail) {
      status.textContent = 'Ambiente indisponível';
      detail.textContent = 'Não foi possível carregar o healthcheck.';
    }
  });
