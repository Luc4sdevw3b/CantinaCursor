import './styles.css';
import { APP_VERSION } from './app-version';
import { roleLabel, type UserRole } from './domain/auth';
import type { AppSession, StudentSummary } from './web/shared/app-api';
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
        <h2 id="next-step-title">Responsáveis e irmãos</h2>
        <p>Vários responsáveis, um principal, irmãos e idade para pedir responsável.</p>
      </div>
      <span class="phase-badge">Fase 9</span>
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
  })
  .catch(() => {
    const status = document.querySelector('#health-status');
    const detail = document.querySelector('#health-detail');
    if (status && detail) {
      status.textContent = 'Ambiente indisponível';
      detail.textContent = 'Não foi possível carregar o healthcheck.';
    }
  });
