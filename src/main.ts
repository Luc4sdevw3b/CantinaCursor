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
        <h2 id="next-step-title">Cadastro de alunos</h2>
        <p>Ano letivo, turmas, idade e homônimos — com reativação revisada.</p>
      </div>
      <span class="phase-badge">Fase 8</span>
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
  return `${student.fullName} • ${student.ageLabel} • ${classroom}${inactive}`;
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
    .catch((error: unknown) => {
      if (studentsStatus) {
        studentsStatus.textContent =
          error instanceof Error
            ? error.message.replace(/^[A-Z_]+:\s*/, '')
            : 'Não foi possível cadastrar o aluno.';
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
  })
  .catch(() => {
    const status = document.querySelector('#health-status');
    const detail = document.querySelector('#health-detail');
    if (status && detail) {
      status.textContent = 'Ambiente indisponível';
      detail.textContent = 'Não foi possível carregar o healthcheck.';
    }
  });
