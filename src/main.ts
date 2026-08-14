import './styles.css';
import { APP_VERSION } from './app-version';
import { createRequestId } from './domain/request-id';
import { roleLabel, type UserRole } from './domain/auth';
import { formatBrl, parseReaisToCents } from './domain/money';
import {
  buildProductionSummary,
  reservationMatchesOwnerSearch,
} from './domain/reservation';
import type {
  AppSession,
  Classroom,
  DueDateShortcuts,
  Guardian,
  InventoryBalanceItem,
  Product,
  ProductCategory,
  Receivable,
  Reservation,
  ReservationsSetup,
  ReversalsSetup,
  SiblingAuthorization,
  StudentDetail,
  StudentSummary,
  SaleScreenData,
} from './web/shared/app-api';
import { createAppApi } from './web/shared/create-app-api';
import { getClientPerf, resetClientPerf } from './web/shared/perf';
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
          <span class="phase-badge">Fase 26</span>
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
        <p class="busy-banner" id="busy-banner" role="status" hidden></p>
        <div class="session-card" id="session-card" hidden>
          <div id="session-login">
            <button type="button" id="login-owner">Entrar como dona</button>
            <button type="button" id="login-staff">Entrar como funcionário</button>
          </div>
          <div id="session-active" hidden>
            <p id="session-label"></p>
            <button type="button" id="refresh-area">Atualizar</button>
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
        <button type="button" data-area="reservations">Reservas</button>
        <button type="button" data-area="cash">Caixa</button>
        <button type="button" data-area="reversals">Estornos</button>
        <button type="button" data-area="students">Alunos</button>
        <button type="button" data-area="family">Responsáveis</button>
        <button type="button" data-area="products">Cardápio</button>
        <button type="button" data-area="adjust" data-owner-only>Juros</button>
      </nav>
    </section>

    <div class="workspace" id="workspace">
    <section class="students-panel" id="public-portal" hidden>
      <h2>Reservar recreio</h2>
      <p>Escolha o recreio e o lanche. Não é preciso entrar na cantina.</p>
      <p id="public-portal-status">Carregando recreios…</p>
      <ul id="public-portal-catalog"></ul>
      <form id="public-portal-form" aria-label="Enviar reserva">
        <label>
          Recreio
          <select id="public-portal-slot" aria-label="Recreio da reserva pública"></select>
        </label>
        <label>
          Nome para retirada
          <input id="public-portal-name" required autocomplete="off" />
        </label>
        <label>
          Turma
          <input id="public-portal-classroom" required autocomplete="off" />
        </label>
        <label>
          Contato (opcional)
          <input id="public-portal-contact" autocomplete="off" />
        </label>
        <label>
          Produto
          <select id="public-portal-product" aria-label="Produto da reserva pública"></select>
        </label>
        <label>
          Quantidade
          <input id="public-portal-quantity" type="number" min="1" max="20" value="1" required />
        </label>
        <label class="sr-only" aria-hidden="true">
          Empresa
          <input id="public-portal-honeypot" tabindex="-1" autocomplete="off" />
        </label>
        <button type="submit">Enviar reserva</button>
      </form>
      <p id="public-portal-code" hidden></p>
      <p id="public-portal-confirmation" hidden></p>
    </section>
    <section class="students-panel" id="students-panel" hidden>
      <h2>Alunos</h2>
      <p id="students-status">Entre para ver o cadastro.</p>
      <ul id="students-list"></ul>
      <h3>Turmas</h3>
      <ul id="classrooms-list"></ul>
      <form id="classroom-form" aria-label="Cadastrar turma">
        <label>
          Nova turma
          <input id="classroom-name" required autocomplete="off" />
        </label>
        <button type="submit" id="classroom-submit">Cadastrar turma</button>
        <button type="button" id="classroom-cancel" hidden>Cancelar</button>
      </form>
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
        <button type="submit" id="student-submit">Cadastrar aluno</button>
        <button type="button" id="student-cancel" hidden>Cancelar</button>
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
        <button type="submit" id="guardian-submit">Cadastrar responsável</button>
        <button type="button" id="guardian-cancel" hidden>Cancelar</button>
      </form>
      <h2>Irmãos autorizados</h2>
      <ul id="authorizations-list"></ul>
      <form id="sibling-auth-form">
        <label>
          Quem compra
          <select id="sibling-consumer" required>
            <option value="">Escolha o aluno</option>
          </select>
        </label>
        <label>
          Conta
          <select id="sibling-account" required>
            <option value="">Escolha a conta</option>
          </select>
        </label>
        <label class="checkbox-label">
          <input id="sibling-charge" type="checkbox" />
          Lançar na conta
        </label>
        <label class="checkbox-label">
          <input id="sibling-credit" type="checkbox" />
          Usar crédito
        </label>
        <button type="submit">Autorizar irmão</button>
      </form>
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
      <h2>Cardápio</h2>
      <p id="products-status">Entre para ver o cardápio.</p>
      <h3>Categorias</h3>
      <p>Crie a categoria antes do produto, se ela ainda não existir. Excluir apaga de verdade. Inativar tira do cardápio de vendas e guarda o cadastro. Não dá para excluir categoria com produto, nem produto que já teve venda, estoque ou reserva.</p>
      <ul id="categories-list"></ul>
      <form id="category-form" aria-label="Cadastrar categoria">
        <label>
          Nome da categoria
          <input id="category-name" required autocomplete="off" />
        </label>
        <button type="submit" id="category-submit">Cadastrar categoria</button>
        <button type="button" id="category-cancel" hidden>Cancelar</button>
      </form>
      <h3>Produtos</h3>
      <ul id="products-list"></ul>
      <form id="product-form" aria-label="Cadastrar produto">
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

    <section class="students-panel" id="reservations-panel" hidden>
      <h2 id="reservations-title">Reservas do recreio</h2>
      <p>A reserva segura a disponibilidade. O estoque físico só muda na venda da retirada.</p>
      <p id="reservations-status">Entre para ver as reservas.</p>
      <ul id="reservation-availability"></ul>
      <form id="reservation-slot-form">
        <h3>Criar recreio</h3>
        <label>
          Nome
          <input id="reservation-slot-label" required />
        </label>
        <label>
          Corte
          <input id="reservation-slot-cutoff" type="time" required />
        </label>
        <label>
          Início da retirada
          <input id="reservation-slot-start" type="time" required />
        </label>
        <label>
          Fim da retirada
          <input id="reservation-slot-end" type="time" required />
        </label>
        <button type="submit">Criar recreio</button>
      </form>
      <form id="reservation-create-form" aria-label="Confirmar reserva">
        <h3>Nova reserva</h3>
        <label>
          Recreio
          <select id="reservation-slot-id" aria-label="Recreio da reserva"></select>
        </label>
        <label>
          Pesquisar aluno
          <input id="reservation-student-search" autocomplete="off" aria-label="Pesquisar aluno" />
        </label>
        <label>
          Aluno cadastrado
          <select id="reservation-student" required aria-label="Aluno da reserva"></select>
        </label>
        <label>
          Turma
          <input id="reservation-classroom" required autocomplete="off" />
        </label>
        <label>
          Produto
          <select id="reservation-product" aria-label="Produto da reserva"></select>
        </label>
        <label>
          Quantidade
          <input id="reservation-quantity" type="number" min="1" max="20" value="1" required />
        </label>
        <button type="submit">Confirmar reserva</button>
      </form>
      <h3>Fila do recreio</h3>
      <label>
        Recreio
        <select id="reservation-filter-slot" aria-label="Filtrar recreio"></select>
      </label>
      <label>
        Pesquisar reserva
        <input id="reservation-search" autocomplete="off" aria-label="Pesquisar reserva" />
      </label>
      <h3>Produção</h3>
      <ul id="reservation-production"></ul>
      <form id="reservation-edit-form">
        <h3>Alterar reserva</h3>
        <input id="reservation-edit-id" type="hidden" />
        <label>
          Nome para retirada
          <input id="reservation-edit-name" required autocomplete="off" />
        </label>
        <label>
          Turma
          <input id="reservation-edit-classroom" required autocomplete="off" />
        </label>
        <label>
          Contato
          <input id="reservation-edit-contact" autocomplete="off" />
        </label>
        <button type="submit">Alterar reserva</button>
      </form>
      <label>
        Aluno do cadastro
        <select id="reservation-link-student" aria-label="Aluno para vincular"></select>
      </label>
      <label>
        Motivo do cancelamento ou não retirada
        <input id="reservation-action-reason" />
      </label>
      <ul id="reservations-list"></ul>
    </section>

    <section class="students-panel" id="cash-panel" hidden>
      <h2>Caixa</h2>
      <p id="cash-status">Entre para ver o caixa.</p>
      <p id="cash-session-label"></p>
      <form id="cash-open-form">
        <label>
          Troco inicial
          <input id="cash-opening-float" inputmode="decimal" placeholder="0,00" />
        </label>
        <button type="submit">Abrir caixa</button>
      </form>
      <form id="cash-add-form" hidden>
        <label>
          Adicionar troco
          <input id="cash-add-amount" inputmode="decimal" placeholder="20,00" />
        </label>
        <label>
          Origem
          <input id="cash-add-note" required />
        </label>
        <button type="submit">Adicionar troco</button>
      </form>
      <form id="cash-remove-form" hidden>
        <label>
          Retirar dinheiro
          <input id="cash-remove-amount" inputmode="decimal" placeholder="10,00" />
        </label>
        <label>
          Motivo
          <input id="cash-remove-note" required />
        </label>
        <button type="submit">Retirar dinheiro</button>
      </form>
      <form id="cash-close-form" hidden>
        <label>
          Valor contado
          <input id="cash-counted" inputmode="decimal" placeholder="8,00" />
        </label>
        <label>
          Nota
          <input id="cash-close-note" />
        </label>
        <button type="submit">Fechar caixa</button>
      </form>
      <ul id="cash-movements"></ul>
    </section>

    <section class="students-panel" id="reversals-panel" hidden>
      <h2 id="reversals-title">Estornos completos</h2>
      <p>A operação original nunca é apagada. Cada devolução, dívida, crédito, caixa e item retornado fica vinculado.</p>
      <p id="reversals-status">Entre para ver os estornos.</p>
      <div id="reversal-forms">
        <form id="reverse-sale-form" aria-label="Estornar venda">
          <h3>Estornar venda</h3>
          <label>
            Venda
            <select id="reverse-sale-id" aria-label="Venda para estorno"></select>
          </label>
          <label id="reverse-sale-method-label">
            Forma da devolução
            <select id="reverse-sale-method" aria-label="Forma da devolução da venda">
              <option value="">Escolha</option>
              <option value="pix">PIX</option>
              <option value="cash">Dinheiro</option>
            </select>
          </label>
          <p id="reverse-sale-no-external" hidden>Sem valor externo: crédito será restaurado e/ou dívida cancelada.</p>
          <fieldset id="reverse-sale-stock" hidden>
            <legend>O produto voltou fisicamente ao estoque?</legend>
            <label>
              <input type="radio" name="return-stock" value="yes" />
              Sim, devolver ao estoque
            </label>
            <label>
              <input type="radio" name="return-stock" value="no" />
              Não, manter fora do estoque
            </label>
          </fieldset>
          <label>
            <input id="reverse-sale-different" type="checkbox" />
            Confirmo a forma diferente ou a consolidação de formas originais
          </label>
          <label>
            Motivo
            <textarea id="reverse-sale-reason" aria-label="Motivo do estorno da venda"></textarea>
          </label>
          <button type="submit">Confirmar estorno da venda</button>
        </form>
        <form id="reverse-payment-form" aria-label="Estornar pagamento">
          <h3>Estornar pagamento</h3>
          <label>
            Pagamento
            <select id="reverse-payment-id" aria-label="Pagamento para estorno"></select>
          </label>
          <label>
            Forma da devolução
            <select id="reverse-payment-method" aria-label="Forma da devolução do pagamento">
              <option value="pix">PIX</option>
              <option value="cash">Dinheiro</option>
            </select>
          </label>
          <label>
            <input id="reverse-payment-different" type="checkbox" />
            Confirmo que a forma é diferente da original
          </label>
          <label>
            Motivo
            <textarea id="reverse-payment-reason" aria-label="Motivo do estorno do pagamento"></textarea>
          </label>
          <button type="submit">Confirmar estorno do pagamento</button>
        </form>
        <form id="reverse-credit-form" aria-label="Estornar devolução de crédito">
          <h3>Cancelar devolução de crédito</h3>
          <p>O valor volta ao crédito e a cantina recebe novamente pela forma escolhida.</p>
          <label>
            Devolução
            <select id="reverse-credit-id" aria-label="Devolução de crédito para estorno"></select>
          </label>
          <label>
            Forma de recuperação
            <select id="reverse-credit-method" aria-label="Forma de recuperação da devolução de crédito">
              <option value="pix">PIX</option>
              <option value="cash">Dinheiro</option>
            </select>
          </label>
          <label>
            <input id="reverse-credit-different" type="checkbox" />
            Confirmo que a forma é diferente da original
          </label>
          <label>
            Motivo
            <textarea id="reverse-credit-reason" aria-label="Motivo do estorno da devolução de crédito"></textarea>
          </label>
          <button type="submit">Confirmar cancelamento da devolução</button>
        </form>
      </div>
      <div class="reversal-history" aria-label="Histórico de estornos">
        <h3>Auditoria de estornos</h3>
        <ul id="reversals-history"></ul>
      </div>
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
        <label id="sale-account-label" hidden>
          Conta
          <select id="sale-account">
            <option value="">Própria conta</option>
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
        <p id="sale-source-note" hidden></p>
        <div id="sale-override-fields" hidden>
          <label class="checkbox-label">
            <input id="sale-override-reserved" type="checkbox" />
            Usar unidade reservada
          </label>
          <label>
            Reserva afetada
            <select id="sale-override-reservation" aria-label="Reserva afetada"></select>
          </label>
        </div>
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
      <h3>Pagamento familiar</h3>
      <form id="family-payment-form">
        <label>
          Responsável
          <select id="family-payment-guardian" required>
            <option value="">Escolha o responsável</option>
          </select>
        </label>
        <label>
          Valor (R$)
          <input
            id="family-payment-amount"
            inputmode="decimal"
            placeholder="2,00"
          />
        </label>
        <label>
          Método
          <select id="family-payment-method">
            <option value="pix">PIX</option>
            <option value="cash">Dinheiro</option>
          </select>
        </label>
        <label>
          Destino
          <select id="family-payment-mode">
            <option value="oldest_first">Quitar um filho</option>
            <option value="selected">Selecionadas</option>
            <option value="manual">Manual</option>
            <option value="credit_remainder">Dívida + crédito</option>
            <option value="all_credit">Tudo crédito</option>
          </select>
        </label>
        <label id="family-payment-child-label">
          Filho
          <select id="family-payment-child">
            <option value="">Escolha o filho</option>
          </select>
        </label>
        <ul id="family-payment-debts" hidden></ul>
        <button type="submit">Registrar pagamento familiar</button>
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
  | 'reservations'
  | 'cash'
  | 'reversals'
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
  reservations: '#reservations-panel',
  cash: '#cash-panel',
  reversals: '#reversals-panel',
  students: '#students-panel',
  family: '#family-panel',
  products: '#products-panel',
  adjust: '#adjust-panel',
};

const DEFAULT_AREA: AppArea = 'sales';
let currentSession: AppSession | null = null;
let activeArea: AppArea = DEFAULT_AREA;
const loadedAreas = new Set<AppArea>();

function submitButton(event: Event): HTMLButtonElement | null {
  if (
    event instanceof SubmitEvent &&
    event.submitter instanceof HTMLButtonElement
  ) {
    return event.submitter;
  }
  const current = event.currentTarget;
  if (current instanceof HTMLFormElement) {
    const button = current.querySelector('button[type="submit"]');
    if (button instanceof HTMLButtonElement) {
      return button;
    }
  }
  if (event.target instanceof HTMLButtonElement) {
    return event.target;
  }
  return null;
}

function shouldHoldBusyBanner(): boolean {
  try {
    return (
      typeof globalThis.location !== 'undefined' &&
      new URLSearchParams(globalThis.location.search).get('e2eBusy') === '1'
    );
  } catch {
    return false;
  }
}

function runBusyAction(
  statusEl: Element | null,
  button: HTMLButtonElement | null | undefined,
  errorFallback: string,
  work: () => Promise<unknown>,
): void {
  if (button?.disabled) {
    return;
  }
  if (button) {
    button.disabled = true;
  }
  const banner = document.querySelector('#busy-banner');
  if (banner instanceof HTMLElement) {
    banner.hidden = false;
    banner.textContent = 'Processando ação…';
  }
  if (statusEl) {
    statusEl.textContent = 'Processando…';
  }
  const started = shouldHoldBusyBanner()
    ? new Promise((resolve) => {
        globalThis.setTimeout(resolve, 80);
      }).then(work)
    : work();
  void started
    .catch((error: unknown) => {
      if (statusEl) {
        statusEl.textContent =
          error instanceof Error
            ? error.message.replace(/^[A-Z_]+:\s*/, '')
            : errorFallback;
      }
    })
    .finally(() => {
      if (banner instanceof HTMLElement) {
        banner.hidden = true;
        banner.textContent = '';
      }
      if (button) {
        button.disabled = false;
      }
    });
}

function busyFromEvent(
  event: Event,
  errorFallback: string,
  work: () => Promise<unknown>,
): void {
  const origin =
    event.currentTarget instanceof Element
      ? event.currentTarget
      : event.target instanceof Element
        ? event.target
        : null;
  const section = origin?.closest('section') ?? origin;
  const status =
    section instanceof Element
      ? section.querySelector('[id$="-status"]')
      : null;
  runBusyAction(status, submitButton(event), errorFallback, work);
}

function isAppArea(value: string | undefined): value is AppArea {
  return Boolean(value && value in AREA_PANELS);
}

function isPublicPortal(): boolean {
  const injected = (globalThis as { __CANTINA_PUBLIC_PORTAL__?: boolean })
    .__CANTINA_PUBLIC_PORTAL__;
  if (injected === true) {
    return true;
  }
  try {
    return (
      new URLSearchParams(window.location.search).get('portal') === 'reservas'
    );
  } catch {
    return false;
  }
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
  void ensureAreaLoaded(area);
}

async function ensureAreaLoaded(area: AppArea, force = false): Promise<void> {
  if (!currentSession) {
    loadedAreas.clear();
    return;
  }
  if (!force && loadedAreas.has(area)) {
    return;
  }
  await renderArea(area, currentSession);
  loadedAreas.add(area);
}

async function renderArea(
  area: AppArea,
  session: AppSession | null,
): Promise<void> {
  switch (area) {
    case 'sales':
      await renderSales(session);
      return;
    case 'students':
      await renderStudents(Boolean(session));
      return;
    case 'family':
      await renderFamily(session);
      return;
    case 'products':
      await renderProducts(session);
      return;
    case 'inventory':
      await renderInventory(session);
      return;
    case 'reservations':
      await renderReservations(session);
      return;
    case 'cash':
      await renderCash(session);
      return;
    case 'reversals':
      await renderReversals(session);
      return;
    case 'agenda':
      await renderAgenda(session);
      return;
    case 'payments':
      await renderPayments(session);
      return;
    case 'credits':
      await renderCredits(session);
      return;
    case 'adjust':
      if (!loadedAreas.has('agenda')) {
        await renderAgenda(session);
        loadedAreas.add('agenda');
      }
      await renderAdjust(session);
      return;
    default:
      return;
  }
}

function invalidateAreas(...areas: AppArea[]): void {
  for (const area of areas) {
    loadedAreas.delete(area);
  }
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
Object.assign(window, {
  __cantinaPerf: {
    reset: resetClientPerf,
    snapshot: getClientPerf,
  },
});
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
  loadedAreas.clear();
  if (!session) {
    activeArea = DEFAULT_AREA;
    fillProductForm(null);
  }
  syncWorkspace(session);
  renderSession(session, true);
  if (session) {
    await ensureAreaLoaded(activeArea, true);
  }
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
document.querySelector('#refresh-area')?.addEventListener('click', () => {
  void ensureAreaLoaded(activeArea, true);
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
const classroomsList = document.querySelector('#classrooms-list');
const classroomSelect = document.querySelector('#student-classroom');
let editingStudentId: string | null = null;
let editingStudentClassroomId: string | null = null;
let editingClassroomId: string | null = null;

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

function fillStudentForm(student: StudentDetail | null): void {
  const name = document.querySelector('#student-name');
  const birth = document.querySelector('#student-birth');
  const approxAge = document.querySelector('#student-approx-age');
  const approxYear = document.querySelector('#student-approx-year');
  const submit = document.querySelector('#student-submit');
  const cancel = document.querySelector('#student-cancel');
  editingStudentId = student?.id ?? null;
  const currentEnrollment = student?.enrollments.find((item) => !item.endedOn);
  editingStudentClassroomId = currentEnrollment?.classroomId ?? null;
  if (
    !(name instanceof HTMLInputElement) ||
    !(birth instanceof HTMLInputElement) ||
    !(approxAge instanceof HTMLInputElement) ||
    !(approxYear instanceof HTMLInputElement)
  ) {
    return;
  }
  name.value = student?.fullName ?? '';
  birth.value = student?.birthDate ?? '';
  approxAge.value =
    student?.approximateAge === null || student?.approximateAge === undefined
      ? ''
      : String(student.approximateAge);
  approxYear.value =
    student?.approximateAgeReferenceYear === null ||
    student?.approximateAgeReferenceYear === undefined
      ? ''
      : String(student.approximateAgeReferenceYear);
  if (
    classroomSelect instanceof HTMLSelectElement &&
    editingStudentClassroomId
  ) {
    classroomSelect.value = editingStudentClassroomId;
  }
  if (submit instanceof HTMLButtonElement) {
    submit.textContent = student ? 'Salvar aluno' : 'Cadastrar aluno';
  }
  if (cancel instanceof HTMLButtonElement) {
    cancel.hidden = !student;
  }
}

function fillClassroomForm(classroom: Classroom | null): void {
  const name = document.querySelector('#classroom-name');
  const submit = document.querySelector('#classroom-submit');
  const cancel = document.querySelector('#classroom-cancel');
  editingClassroomId = classroom?.id ?? null;
  if (!(name instanceof HTMLInputElement)) {
    return;
  }
  name.value = classroom?.name ?? '';
  if (submit instanceof HTMLButtonElement) {
    submit.textContent = classroom ? 'Salvar turma' : 'Cadastrar turma';
  }
  if (cancel instanceof HTMLButtonElement) {
    cancel.hidden = !classroom;
  }
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
  if (classroomsList instanceof HTMLElement) {
    classroomsList.replaceChildren();
  }
  if (!authenticated) {
    studentsStatus.textContent = 'Entre para ver o cadastro.';
    return;
  }

  const [students, classrooms] = await (async () => {
    const data = await api.getStudentsScreenData();
    return [data.students, data.classrooms] as const;
  })();
  studentsStatus.textContent =
    students.length === 0
      ? 'Nenhum aluno cadastrado ainda.'
      : `${students.length} aluno(s) no cadastro.`;

  if (classroomSelect instanceof HTMLSelectElement) {
    classroomSelect.replaceChildren();
    for (const classroom of classrooms.filter((item) => item.active)) {
      const option = document.createElement('option');
      option.value = classroom.id;
      option.textContent = classroom.name;
      classroomSelect.append(option);
    }
    if (editingStudentClassroomId) {
      classroomSelect.value = editingStudentClassroomId;
    }
  }

  if (classroomsList instanceof HTMLElement) {
    for (const classroom of classrooms) {
      const item = document.createElement('li');
      item.textContent = classroom.active
        ? classroom.name
        : `${classroom.name} (inativa)`;
      const actions = document.createElement('div');
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Editar';
      edit.addEventListener('click', () => {
        fillClassroomForm(classroom);
        const nameField = document.querySelector('#classroom-name');
        if (nameField instanceof HTMLInputElement) {
          nameField.focus();
        }
      });
      actions.append(edit);
      if (classroom.active) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Excluir';
        remove.addEventListener('click', () => {
          runBusyAction(
            studentsStatus,
            remove,
            'Não foi possível excluir a turma.',
            () =>
              api.deactivateClassroom(classroom.id).then(() => {
                if (editingClassroomId === classroom.id) {
                  fillClassroomForm(null);
                }
                return renderStudents(true);
              }),
          );
        });
        actions.append(remove);
      }
      item.append(actions);
      classroomsList.append(item);
    }
  }

  for (const student of students) {
    const item = document.createElement('li');
    item.textContent = studentLine(student);
    const actions = document.createElement('div');
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Editar';
    edit.addEventListener('click', () => {
      void api
        .getStudent(student.id)
        .then((detail) => {
          fillStudentForm(detail);
          const nameField = document.querySelector('#student-name');
          if (nameField instanceof HTMLInputElement) {
            nameField.focus();
          }
        })
        .catch((error: unknown) => {
          studentsStatus.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível abrir o aluno.';
        });
    });
    actions.append(edit);
    if (student.active) {
      const deactivate = document.createElement('button');
      deactivate.type = 'button';
      deactivate.textContent = 'Desativar';
      deactivate.addEventListener('click', () => {
        runBusyAction(
          studentsStatus,
          deactivate,
          'Não foi possível desativar o aluno.',
          () =>
            api.deactivateStudent(student.id).then(() => renderStudents(true)),
        );
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
        runBusyAction(
          studentsStatus,
          reactivate,
          'Não foi possível reativar.',
          () =>
            api
              .reactivateStudent(student.id, {
                reviewed: checkbox.checked,
                fullName: student.fullName,
              })
              .then(() => renderStudents(true)),
        );
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
let editingGuardianId: string | null = null;

function guardianLine(guardian: {
  fullName: string;
  relationLabel: string;
  whatsappEnabled: boolean;
  active?: boolean;
}): string {
  const relation = guardian.relationLabel ? ` • ${guardian.relationLabel}` : '';
  const whatsapp = guardian.whatsappEnabled ? ' • WhatsApp' : '';
  const inactive = guardian.active === false ? ' • Inativo' : '';
  return `${guardian.fullName}${relation}${whatsapp}${inactive}`;
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

function fillGuardianForm(guardian: Guardian | null): void {
  const name = document.querySelector('#guardian-name');
  const phone = document.querySelector('#guardian-phone');
  const relation = document.querySelector('#guardian-relation');
  const whatsapp = document.querySelector('#guardian-whatsapp');
  const submit = document.querySelector('#guardian-submit');
  const cancel = document.querySelector('#guardian-cancel');
  editingGuardianId = guardian?.id ?? null;
  if (
    !(name instanceof HTMLInputElement) ||
    !(phone instanceof HTMLInputElement) ||
    !(relation instanceof HTMLInputElement) ||
    !(whatsapp instanceof HTMLInputElement)
  ) {
    return;
  }
  name.value = guardian?.fullName ?? '';
  phone.value = guardian?.phone ?? '';
  relation.value = guardian?.relationLabel ?? '';
  whatsapp.checked = guardian?.whatsappEnabled ?? false;
  if (submit instanceof HTMLButtonElement) {
    submit.textContent = guardian
      ? 'Salvar responsável'
      : 'Cadastrar responsável';
  }
  if (cancel instanceof HTMLButtonElement) {
    cancel.hidden = !guardian;
  }
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

  const [guardians, students, authorizations, settings] = await (async () => {
    const data = await api.getFamilyScreenData();
    return [
      data.guardians,
      data.students,
      data.siblingAuthorizations,
      data.settings,
    ] as const;
  })();
  familyStatus.textContent =
    guardians.length === 0
      ? 'Nenhum responsável cadastrado ainda.'
      : `${guardians.length} responsável(is) no cadastro.`;

  for (const guardian of guardians) {
    const item = document.createElement('li');
    item.textContent = guardianLine(guardian);
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Editar';
    edit.addEventListener('click', () => {
      fillGuardianForm(guardian);
      const nameField = document.querySelector('#guardian-name');
      if (nameField instanceof HTMLInputElement) {
        nameField.focus();
      }
    });
    const actions = document.createElement('div');
    actions.append(edit);
    if (guardian.active) {
      const deactivate = document.createElement('button');
      deactivate.type = 'button';
      deactivate.textContent = 'Desativar';
      deactivate.addEventListener('click', () => {
        runBusyAction(
          familyStatus,
          deactivate,
          'Não foi possível desativar o responsável.',
          () =>
            api.deactivateGuardian(guardian.id).then(() => {
              if (editingGuardianId === guardian.id) {
                fillGuardianForm(null);
              }
              return ensureAreaLoaded('family', true);
            }),
        );
      });
      actions.append(deactivate);
    }
    item.append(actions);
    guardiansList.append(item);
  }

  const studentById = new Map(students.map((student) => [student.id, student]));
  for (const authorization of authorizations.filter((item) => item.active)) {
    const account = studentById.get(authorization.accountStudentId);
    const item = document.createElement('li');
    const age = account ? ` • ${account.ageLabel}` : '';
    const credit = authorization.canUseAccountCredit ? ' e usar crédito' : '';
    const label = document.createElement('span');
    label.textContent = authorization.canChargeAccount
      ? `${authorization.consumerName} pode lançar na conta de ${authorization.accountName}${age}${credit}`
      : `${authorization.consumerName} pode usar crédito de ${authorization.accountName}${age}`;
    const revoke = document.createElement('button');
    revoke.type = 'button';
    revoke.textContent = 'Revogar';
    revoke.addEventListener('click', () => {
      runBusyAction(
        familyStatus,
        revoke,
        'Não foi possível revogar a autorização.',
        () =>
          api.revokeSiblingAuthorization(authorization.id).then(() => {
            invalidateAreas('sales');
            return ensureAreaLoaded('family', true);
          }),
      );
    });
    item.append(label, revoke);
    authorizationsList.append(item);
  }

  const siblingConsumer = document.querySelector('#sibling-consumer');
  const siblingAccount = document.querySelector('#sibling-account');
  for (const select of [siblingConsumer, siblingAccount]) {
    if (!(select instanceof HTMLSelectElement)) {
      continue;
    }
    const current = select.value;
    const emptyLabel =
      select.id === 'sibling-account' ? 'Escolha a conta' : 'Escolha o aluno';
    select.replaceChildren();
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = emptyLabel;
    select.append(empty);
    for (const student of students.filter((item) => item.active)) {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = `${student.fullName} • ${student.ageLabel}`;
      select.append(option);
    }
    if (current && students.some((item) => item.id === current)) {
      select.value = current;
    }
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
const categoriesList = document.querySelector('#categories-list');
const adHocBlock = document.querySelector('#ad-hoc-block');
const adHocStatus = document.querySelector('#ad-hoc-status');
const adHocList = document.querySelector('#ad-hoc-list');
let editingCategoryId: string | null = null;

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

function fillCategoryForm(category: ProductCategory | null): void {
  const name = document.querySelector('#category-name');
  const submit = document.querySelector('#category-submit');
  const cancel = document.querySelector('#category-cancel');
  editingCategoryId = category?.id ?? null;
  if (!(name instanceof HTMLInputElement)) {
    return;
  }
  name.value = category?.name ?? '';
  if (submit instanceof HTMLButtonElement) {
    submit.textContent = category ? 'Salvar categoria' : 'Cadastrar categoria';
  }
  if (cancel instanceof HTMLButtonElement) {
    cancel.hidden = !category;
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
  if (categoriesList instanceof HTMLElement) {
    categoriesList.replaceChildren();
  }
  if (!session) {
    productsStatus.textContent = 'Entre para ver o cardápio.';
    return;
  }

  const catalog = await api.getCatalogScreenData();
  const categories = catalog.categories;
  const products = catalog.products;
  productsStatus.textContent =
    products.length === 0
      ? 'Nenhum produto cadastrado ainda.'
      : `${products.length} produto(s) no cardápio.`;

  if (productCategorySelect instanceof HTMLSelectElement) {
    productCategorySelect.replaceChildren();
    for (const category of categories.filter((item) => item.active)) {
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

  if (categoriesList instanceof HTMLElement) {
    for (const category of categories) {
      const item = document.createElement('li');
      item.textContent = category.active
        ? category.name
        : `${category.name} (inativa)`;
      const actions = document.createElement('div');
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Editar';
      edit.addEventListener('click', () => {
        fillCategoryForm(category);
        const nameField = document.querySelector('#category-name');
        if (nameField instanceof HTMLInputElement) {
          nameField.focus();
        }
      });
      actions.append(edit);
      if (category.active) {
        const deactivate = document.createElement('button');
        deactivate.type = 'button';
        deactivate.textContent = 'Inativar';
        deactivate.addEventListener('click', () => {
          runBusyAction(
            productsStatus,
            deactivate,
            'Não foi possível inativar a categoria.',
            () =>
              api.deactivateCategory(category.id).then(() => {
                if (editingCategoryId === category.id) {
                  fillCategoryForm(null);
                }
                return ensureAreaLoaded('products', true);
              }),
          );
        });
        actions.append(deactivate);
      } else {
        const activate = document.createElement('button');
        activate.type = 'button';
        activate.textContent = 'Reativar';
        activate.addEventListener('click', () => {
          runBusyAction(
            productsStatus,
            activate,
            'Não foi possível reativar a categoria.',
            () =>
              api
                .activateCategory(category.id)
                .then(() => ensureAreaLoaded('products', true)),
          );
        });
        actions.append(activate);
      }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Excluir';
      remove.addEventListener('click', () => {
        runBusyAction(
          productsStatus,
          remove,
          'Não foi possível excluir a categoria.',
          () =>
            api.deleteCategory(category.id).then(() => {
              if (editingCategoryId === category.id) {
                fillCategoryForm(null);
              }
              return ensureAreaLoaded('products', true);
            }),
        );
      });
      actions.append(remove);
      item.append(actions);
      categoriesList.append(item);
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
      deactivate.textContent = 'Inativar';
      deactivate.addEventListener('click', () => {
        runBusyAction(
          productsStatus,
          deactivate,
          'Não foi possível inativar o produto.',
          () =>
            api.deactivateProduct(product.id).then(() => {
              if (editingProductId === product.id) {
                fillProductForm(null);
              }
              return api
                .getSession()
                .then((current) =>
                  Promise.all([
                    renderProducts(current),
                    renderSales(current),
                    renderInventory(current),
                  ]),
                );
            }),
        );
      });
      actions.append(deactivate);
    } else {
      const activate = document.createElement('button');
      activate.type = 'button';
      activate.textContent = 'Reativar';
      activate.addEventListener('click', () => {
        runBusyAction(
          productsStatus,
          activate,
          'Não foi possível reativar o produto.',
          () =>
            api
              .activateProduct(product.id)
              .then(() =>
                api
                  .getSession()
                  .then((current) =>
                    Promise.all([
                      renderProducts(current),
                      renderSales(current),
                      renderInventory(current),
                    ]),
                  ),
              ),
        );
      });
      actions.append(activate);
    }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Excluir';
    remove.addEventListener('click', () => {
      runBusyAction(
        productsStatus,
        remove,
        'Não foi possível excluir o produto.',
        () =>
          api.deleteProduct(product.id).then(() => {
            if (editingProductId === product.id) {
              fillProductForm(null);
            }
            return api
              .getSession()
              .then((current) =>
                Promise.all([
                  renderProducts(current),
                  renderSales(current),
                  renderInventory(current),
                ]),
              );
          }),
      );
    });
    actions.append(remove);
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

  const adHocItems = catalog.adHocItems;
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

const reservationsPanel = document.querySelector('#reservations-panel');
const reservationsStatus = document.querySelector('#reservations-status');
const reservationAvailability = document.querySelector(
  '#reservation-availability',
);
const reservationSlotForm = document.querySelector('#reservation-slot-form');
const reservationCreateForm = document.querySelector(
  '#reservation-create-form',
);
const reservationSlotId = document.querySelector('#reservation-slot-id');
const reservationProduct = document.querySelector('#reservation-product');
const reservationsList = document.querySelector('#reservations-list');
const reservationProduction = document.querySelector('#reservation-production');
const reservationFilterSlot = document.querySelector(
  '#reservation-filter-slot',
);
const reservationSearch = document.querySelector('#reservation-search');
const reservationEditForm = document.querySelector('#reservation-edit-form');
const reservationLinkStudent = document.querySelector(
  '#reservation-link-student',
);
const reservationStudentSearch = document.querySelector(
  '#reservation-student-search',
);
const reservationStudentSelect = document.querySelector('#reservation-student');
let reservationsSetup: ReservationsSetup | null = null;
let reservationStudents: StudentSummary[] = [];

function reservationStudentLabel(student: StudentSummary): string {
  return `${student.fullName} • ${student.ageLabel}`;
}

function fillReservationStudentOptions(): void {
  const query =
    reservationStudentSearch instanceof HTMLInputElement
      ? reservationStudentSearch.value.trim().toLowerCase()
      : '';
  const matches = reservationStudents.filter((student) => {
    if (!student.active) {
      return false;
    }
    if (!query) {
      return true;
    }
    const haystack = [
      student.fullName,
      student.ageLabel,
      student.classroomName ?? '',
      reservationStudentLabel(student),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
  fillSelect(
    reservationStudentSelect,
    matches.map((student) => ({
      value: student.id,
      label: reservationStudentLabel(student),
    })),
    'Escolha o aluno',
  );
}

function applyReservationStudentSelection(): void {
  const classroom = document.querySelector('#reservation-classroom');
  if (
    !(reservationStudentSelect instanceof HTMLSelectElement) ||
    !(classroom instanceof HTMLInputElement)
  ) {
    return;
  }
  const student = reservationStudents.find(
    (item) => item.id === reservationStudentSelect.value,
  );
  if (student?.classroomName) {
    classroom.value = student.classroomName;
  }
}

function reservationQueueQuery(): { slotId: string; search: string } {
  return {
    slotId:
      reservationFilterSlot instanceof HTMLSelectElement
        ? reservationFilterSlot.value
        : '',
    search:
      reservationSearch instanceof HTMLInputElement
        ? reservationSearch.value
        : '',
  };
}

function visibleOwnerReservations(setup: ReservationsSetup): Reservation[] {
  const query = reservationQueueQuery();
  return setup.reservations.filter((entry) => {
    if (query.slotId && entry.slotId !== query.slotId) {
      return false;
    }
    return reservationMatchesOwnerSearch(entry, query.search);
  });
}

function paintReservationQueue(): void {
  if (
    !(reservationProduction instanceof HTMLElement) ||
    !(reservationsList instanceof HTMLElement)
  ) {
    return;
  }
  reservationProduction.replaceChildren();
  reservationsList.replaceChildren();
  if (!reservationsSetup) {
    return;
  }
  const visible = visibleOwnerReservations(reservationsSetup);
  const production = buildProductionSummary(visible);
  if (production.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Nada a produzir.';
    reservationProduction.append(empty);
  }
  for (const item of production) {
    const row = document.createElement('li');
    row.textContent = item.summaryLabel;
    reservationProduction.append(row);
  }
  if (visible.length === 0) {
    const empty = document.createElement('li');
    empty.textContent =
      reservationsSetup.reservations.length === 0
        ? 'Nenhuma reserva registrada.'
        : 'Nenhuma reserva encontrada.';
    reservationsList.append(empty);
    return;
  }
  for (const entry of visible) {
    const row = document.createElement('li');
    const details = document.createElement('div');
    const label = document.createElement('span');
    label.textContent = entry.summaryLabel;
    details.append(label);
    const code = document.createElement('span');
    code.textContent = entry.publicCodeLabel;
    details.append(code);
    if (entry.linkedStudentLabel) {
      const linked = document.createElement('span');
      linked.textContent = entry.linkedStudentLabel;
      details.append(linked);
    }
    row.append(details);
    if (entry.status === 'reserved') {
      const fulfill = document.createElement('button');
      fulfill.type = 'button';
      fulfill.textContent = 'Entregar reserva';
      fulfill.dataset.reservationId = entry.id;
      fulfill.dataset.reservationAction = 'fulfill';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Alterar reserva';
      edit.dataset.reservationId = entry.id;
      edit.dataset.reservationAction = 'edit';
      const link = document.createElement('button');
      link.type = 'button';
      link.textContent = 'Vincular aluno';
      link.dataset.reservationId = entry.id;
      link.dataset.reservationAction = 'link';
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = 'Cancelar reserva';
      cancel.dataset.reservationId = entry.id;
      cancel.dataset.reservationAction = 'cancel';
      const noShow = document.createElement('button');
      noShow.type = 'button';
      noShow.textContent = 'Não retirada';
      noShow.dataset.reservationId = entry.id;
      noShow.dataset.reservationAction = 'no-show';
      row.append(fulfill, edit, link, cancel, noShow);
    }
    reservationsList.append(row);
  }
}

async function renderReservations(session: AppSession | null): Promise<void> {
  if (
    !(reservationsPanel instanceof HTMLElement) ||
    !reservationsStatus ||
    !(reservationAvailability instanceof HTMLElement) ||
    !(reservationsList instanceof HTMLElement)
  ) {
    return;
  }
  reservationAvailability.replaceChildren();
  reservationsSetup = null;
  if (reservationSlotForm instanceof HTMLElement) {
    reservationSlotForm.hidden = true;
  }
  if (reservationCreateForm instanceof HTMLElement) {
    reservationCreateForm.hidden = true;
  }
  if (reservationEditForm instanceof HTMLElement) {
    reservationEditForm.hidden = true;
  }
  paintReservationQueue();
  if (!session) {
    reservationsStatus.textContent = 'Entre para ver as reservas.';
    return;
  }
  try {
    const data = await api.getReservationScreenData();
    const setup = data.setup;
    const students = data.students;
    reservationsSetup = setup;
    if (reservationSlotForm instanceof HTMLElement) {
      reservationSlotForm.hidden = session.role !== 'owner';
    }
    if (reservationCreateForm instanceof HTMLElement) {
      reservationCreateForm.hidden = false;
    }
    if (reservationEditForm instanceof HTMLElement) {
      reservationEditForm.hidden = false;
    }
    fillSelect(
      reservationSlotId,
      setup.slots
        .filter((item) => item.openForReservations)
        .map((item) => ({ value: item.id, label: item.summaryLabel })),
      'Escolha o recreio',
    );
    fillSelect(
      reservationFilterSlot,
      setup.slots.map((item) => ({ value: item.id, label: item.label })),
      'Todos os recreios',
    );
    fillSelect(
      reservationProduct,
      setup.reservableProducts.map((item) => ({
        value: item.id,
        label: `${item.name} • ${formatBrl(item.priceCents)}`,
      })),
      'Escolha o produto',
    );
    fillSelect(
      reservationLinkStudent,
      students
        .filter((item) => item.active)
        .map((item) => ({
          value: item.id,
          label: `${item.fullName} • ${item.ageLabel}`,
        })),
      'Escolha o aluno',
    );
    reservationStudents = students.filter((item) => item.active);
    fillReservationStudentOptions();
    for (const item of setup.availability) {
      const row = document.createElement('li');
      row.textContent = item.summaryLabel;
      reservationAvailability.append(row);
    }
    const activeCount = setup.reservations.filter(
      (item) => item.status === 'reserved',
    ).length;
    reservationsStatus.textContent =
      activeCount === 1 ? '1 reserva ativa' : `${activeCount} reservas ativas`;
    paintReservationQueue();
  } catch (error: unknown) {
    reservationsStatus.textContent =
      error instanceof Error
        ? error.message.replace(/^[A-Z_]+:\s*/, '')
        : 'Não foi possível carregar as reservas.';
  }
}

function refreshAfterReservation(successMessage: string): Promise<void> {
  invalidateAreas('inventory', 'sales');
  return ensureAreaLoaded('reservations', true).then(() => {
    if (reservationsStatus) {
      reservationsStatus.textContent = successMessage;
    }
  });
}

const cashPanel = document.querySelector('#cash-panel');
const cashStatus = document.querySelector('#cash-status');
const cashSessionLabel = document.querySelector('#cash-session-label');
const cashMovements = document.querySelector('#cash-movements');
const cashOpenForm = document.querySelector('#cash-open-form');
const cashAddForm = document.querySelector('#cash-add-form');
const cashRemoveForm = document.querySelector('#cash-remove-form');
const cashCloseForm = document.querySelector('#cash-close-form');

async function renderCash(session: AppSession | null): Promise<void> {
  if (
    !(cashPanel instanceof HTMLElement) ||
    !cashStatus ||
    !cashSessionLabel ||
    !(cashMovements instanceof HTMLElement)
  ) {
    return;
  }
  cashMovements.replaceChildren();
  const hideForms = () => {
    if (cashOpenForm instanceof HTMLElement) {
      cashOpenForm.hidden = true;
    }
    if (cashAddForm instanceof HTMLElement) {
      cashAddForm.hidden = true;
    }
    if (cashRemoveForm instanceof HTMLElement) {
      cashRemoveForm.hidden = true;
    }
    if (cashCloseForm instanceof HTMLElement) {
      cashCloseForm.hidden = true;
    }
  };
  if (!session) {
    hideForms();
    cashSessionLabel.textContent = '';
    cashStatus.textContent = 'Entre para ver o caixa.';
    return;
  }
  try {
    const setup = await api.getCashSetup();
    const open = setup.openSession;
    hideForms();
    if (!open) {
      cashStatus.textContent = 'Sem caixa aberto. PIX continua disponível.';
      cashSessionLabel.textContent = '';
      if (session.role === 'owner' && cashOpenForm instanceof HTMLElement) {
        cashOpenForm.hidden = false;
      }
      return;
    }
    cashStatus.textContent = open.stale
      ? 'Caixa antigo aberto. Feche antes de receber dinheiro.'
      : `Caixa de ${open.businessDate}.`;
    cashSessionLabel.textContent = open.summaryLabel;
    if (!open.stale && cashAddForm instanceof HTMLElement) {
      cashAddForm.hidden = false;
    }
    if (
      session.role === 'owner' &&
      !open.stale &&
      cashRemoveForm instanceof HTMLElement
    ) {
      cashRemoveForm.hidden = false;
    }
    if (session.role === 'owner' && cashCloseForm instanceof HTMLElement) {
      cashCloseForm.hidden = false;
    }
    for (const item of open.movements) {
      const row = document.createElement('li');
      row.textContent = item.summaryLabel;
      cashMovements.append(row);
    }
  } catch (error: unknown) {
    hideForms();
    cashSessionLabel.textContent = '';
    cashStatus.textContent =
      error instanceof Error
        ? error.message.replace(/^[A-Z_]+:\s*/, '')
        : 'Não foi possível carregar o caixa.';
  }
}

const reversalsPanel = document.querySelector('#reversals-panel');
const reversalsStatus = document.querySelector('#reversals-status');
const reversalsHistory = document.querySelector('#reversals-history');
const reversalForms = document.querySelector('#reversal-forms');
const reverseSaleId = document.querySelector('#reverse-sale-id');
const reverseSaleMethod = document.querySelector('#reverse-sale-method');
const reverseSaleMethodLabel = document.querySelector(
  '#reverse-sale-method-label',
);
const reverseSaleNoExternal = document.querySelector(
  '#reverse-sale-no-external',
);
const reverseSaleStock = document.querySelector('#reverse-sale-stock');
const reverseSaleDifferent = document.querySelector('#reverse-sale-different');
const reverseSaleReason = document.querySelector('#reverse-sale-reason');
const reversePaymentId = document.querySelector('#reverse-payment-id');
const reversePaymentMethod = document.querySelector('#reverse-payment-method');
const reversePaymentDifferent = document.querySelector(
  '#reverse-payment-different',
);
const reversePaymentReason = document.querySelector('#reverse-payment-reason');
const reverseCreditId = document.querySelector('#reverse-credit-id');
const reverseCreditMethod = document.querySelector('#reverse-credit-method');
const reverseCreditDifferent = document.querySelector(
  '#reverse-credit-different',
);
const reverseCreditReason = document.querySelector('#reverse-credit-reason');

let reversalsSetup: ReversalsSetup | null = null;

function fillSelect(
  select: Element | null,
  options: Array<{ value: string; label: string }>,
  emptyLabel: string,
) {
  if (!(select instanceof HTMLSelectElement)) {
    return;
  }
  const current = select.value;
  select.replaceChildren();
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = emptyLabel;
  select.append(empty);
  for (const option of options) {
    const row = document.createElement('option');
    row.value = option.value;
    row.textContent = option.label;
    select.append(row);
  }
  if (options.some((item) => item.value === current)) {
    select.value = current;
  }
}

async function renderPublicPortal(): Promise<void> {
  const panel = document.querySelector('#public-portal');
  const status = document.querySelector('#public-portal-status');
  const catalog = document.querySelector('#public-portal-catalog');
  const form = document.querySelector('#public-portal-form');
  if (
    !(panel instanceof HTMLElement) ||
    !status ||
    !(catalog instanceof HTMLElement)
  ) {
    return;
  }
  panel.hidden = false;
  if (form instanceof HTMLElement) {
    form.hidden = false;
  }
  catalog.replaceChildren();
  try {
    const portal = await api.getPublicReservationPortal();
    for (const item of portal.products) {
      const row = document.createElement('li');
      row.textContent = item.summaryLabel;
      catalog.append(row);
    }
    fillSelect(
      document.querySelector('#public-portal-slot'),
      portal.slots.map((item) => ({
        value: item.id,
        label: item.summaryLabel,
      })),
      'Escolha o recreio',
    );
    fillSelect(
      document.querySelector('#public-portal-product'),
      portal.products
        .filter((item) => !item.soldOut)
        .map((item) => ({
          value: item.id,
          label: `${item.name} • ${formatBrl(item.priceCents)}`,
        })),
      'Escolha o produto',
    );
    if (portal.slots.length === 0) {
      status.textContent = 'Nenhum recreio aberto para reserva agora.';
      if (form instanceof HTMLElement) {
        form.hidden = true;
      }
      return;
    }
    status.textContent = portal.products.some((item) => !item.soldOut)
      ? 'Preencha o nome e a turma para reservar.'
      : 'Os lanches reserváveis estão em ACABOU.';
  } catch (error: unknown) {
    status.textContent =
      error instanceof Error
        ? error.message.replace(/^[A-Z_]+:\s*/, '')
        : 'Não foi possível carregar o portal.';
  }
}

function syncReverseSaleFields(): void {
  const sale = reversalsSetup?.sales.find(
    (item) =>
      item.id ===
      (reverseSaleId instanceof HTMLSelectElement ? reverseSaleId.value : ''),
  );
  const hasExternal = Boolean(sale && sale.externalAmountCents > 0);
  if (reverseSaleMethodLabel instanceof HTMLElement) {
    reverseSaleMethodLabel.hidden = !hasExternal;
  }
  if (reverseSaleNoExternal instanceof HTMLElement) {
    reverseSaleNoExternal.hidden = !sale || hasExternal;
  }
  if (reverseSaleStock instanceof HTMLElement) {
    reverseSaleStock.hidden = !sale?.hasTrackedItems;
  }
  if (
    sale &&
    reverseSaleMethod instanceof HTMLSelectElement &&
    sale.originalMethods.length === 1
  ) {
    reverseSaleMethod.value = sale.originalMethods[0] ?? '';
  }
}

async function renderReversals(session: AppSession | null): Promise<void> {
  if (
    !(reversalsPanel instanceof HTMLElement) ||
    !reversalsStatus ||
    !(reversalsHistory instanceof HTMLElement)
  ) {
    return;
  }
  reversalsHistory.replaceChildren();
  if (!session) {
    reversalsSetup = null;
    if (reversalForms instanceof HTMLElement) {
      reversalForms.hidden = true;
    }
    reversalsStatus.textContent = 'Entre para ver os estornos.';
    return;
  }
  try {
    const setup = await api.getReversalsSetup();
    reversalsSetup = setup;
    if (reversalForms instanceof HTMLElement) {
      reversalForms.hidden = session.role !== 'owner';
    }
    fillSelect(
      reverseSaleId,
      setup.sales
        .filter((item) => item.status !== 'reversed')
        .map((item) => ({
          value: item.id,
          label: `${item.displayName} • ${formatBrl(item.amountCents)}`,
        })),
      'Escolha uma venda',
    );
    fillSelect(
      reversePaymentId,
      setup.payments
        .filter((item) => item.status !== 'reversed')
        .map((item) => ({
          value: item.id,
          label: `${item.payerName} • ${item.destinationLabel} • ${formatBrl(item.amountCents)}`,
        })),
      'Escolha um pagamento',
    );
    fillSelect(
      reverseCreditId,
      setup.creditRefunds
        .filter((item) => !item.reversed)
        .map((item) => ({
          value: item.id,
          label: `${item.ownerName} • ${formatBrl(item.amountCents)}`,
        })),
      'Escolha uma devolução',
    );
    syncReverseSaleFields();
    if (session.role !== 'owner') {
      reversalsStatus.textContent =
        'Funcionários podem consultar a auditoria. Somente a dona pode realizar estornos.';
    } else {
      reversalsStatus.textContent =
        setup.recentReversals.length === 1
          ? '1 estorno'
          : `${setup.recentReversals.length} estornos`;
    }
    if (setup.recentReversals.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'Nenhum estorno registrado.';
      reversalsHistory.append(empty);
      return;
    }
    for (const entry of setup.recentReversals) {
      const row = document.createElement('li');
      const title = document.createElement('strong');
      const kind =
        entry.operationType === 'sale'
          ? 'Venda'
          : entry.operationType === 'payment'
            ? 'Pagamento'
            : 'Devolução de crédito';
      title.textContent = `Estorno • ${kind}`;
      const reason = document.createElement('small');
      reason.textContent = `${entry.reason} • ${entry.createdByName}`;
      const effects = document.createElement('ul');
      for (const effect of entry.effects) {
        const effectRow = document.createElement('li');
        effectRow.textContent = effect.summaryLabel;
        effects.append(effectRow);
      }
      row.append(title, reason, effects);
      reversalsHistory.append(row);
    }
  } catch (error: unknown) {
    reversalsStatus.textContent =
      error instanceof Error
        ? error.message.replace(/^[A-Z_]+:\s*/, '')
        : 'Não foi possível carregar os estornos.';
  }
}

const salesPanel = document.querySelector('#sales-panel');
const salesStatus = document.querySelector('#sales-status');
const salesList = document.querySelector('#sales-list');
const saleCartList = document.querySelector('#sale-cart-list');
const saleProductSelect = document.querySelector('#sale-product');
const saleStudentSelect = document.querySelector('#sale-student');
const saleAccountSelect = document.querySelector('#sale-account');
const saleAccountLabel = document.querySelector('#sale-account-label');
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
let saleSourceReservationId: string | null = null;
let dueDateShortcuts: DueDateShortcuts | null = null;
let openReceivables: Receivable[] = [];
let saleStudents: StudentSummary[] = [];
let saleAuthorizations: SiblingAuthorization[] = [];
let familyStudents: StudentSummary[] = [];
let familyLinksByGuardian = new Map<string, Set<string>>();
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
  const note = document.querySelector('#sale-source-note');
  if (note instanceof HTMLElement) {
    const source = reservationsSetup?.reservations.find(
      (item) => item.id === saleSourceReservationId,
    );
    note.hidden = !source;
    note.textContent = source
      ? `Entrega da reserva ${source.publicCodeLabel}`
      : '';
  }
}

function fillSaleAccounts(): void {
  if (!(saleAccountSelect instanceof HTMLSelectElement)) {
    return;
  }
  const consumerId =
    saleStudentSelect instanceof HTMLSelectElement
      ? saleStudentSelect.value
      : '';
  const current = saleAccountSelect.value;
  saleAccountSelect.replaceChildren();
  const own = document.createElement('option');
  own.value = '';
  own.textContent = 'Própria conta';
  saleAccountSelect.append(own);
  const chargeable = saleAuthorizations.filter(
    (item) =>
      item.active &&
      item.canChargeAccount &&
      item.consumerStudentId === consumerId,
  );
  for (const item of chargeable) {
    const student = saleStudents.find(
      (entry) => entry.id === item.accountStudentId,
    );
    const option = document.createElement('option');
    option.value = item.accountStudentId;
    option.textContent = student
      ? `${student.fullName} • ${student.ageLabel}`
      : item.accountName;
    saleAccountSelect.append(option);
  }
  if (current && chargeable.some((item) => item.accountStudentId === current)) {
    saleAccountSelect.value = current;
  }
  if (saleAccountLabel instanceof HTMLElement) {
    saleAccountLabel.hidden = !consumerId;
  }
}

async function renderSales(
  session: AppSession | null,
  preloaded?: SaleScreenData,
): Promise<void> {
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
    saleStudents = [];
    saleAuthorizations = [];
    renderCart();
    fillSaleAccounts();
    syncPaymentFields();
    return;
  }

  try {
    const screen = preloaded ?? (await api.getSaleScreenData());
    const products = screen.products;
    const students = screen.students;
    const sales = screen.sales;
    const pix = { text: screen.pixCopyText };
    const shortcuts = screen.dueDateShortcuts;
    const authorizations = screen.siblingAuthorizations;
    const setup = screen.reservations;
    dueDateShortcuts = shortcuts;
    saleStudents = students;
    saleAuthorizations = authorizations;
    reservationsSetup = setup;
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
    fillSaleAccounts();
    const overrideFields = document.querySelector('#sale-override-fields');
    const reserved = setup.reservations.filter(
      (item) =>
        item.status === 'reserved' && item.id !== saleSourceReservationId,
    );
    if (overrideFields instanceof HTMLElement) {
      overrideFields.hidden = session.role !== 'owner' || reserved.length === 0;
    }
    fillSelect(
      document.querySelector('#sale-override-reservation'),
      reserved.map((item) => ({
        value: item.id,
        label: item.summaryLabel,
      })),
      'Escolha a reserva afetada',
    );
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

function familyPaymentModeValue():
  'oldest_first' | 'selected' | 'manual' | 'credit_remainder' | 'all_credit' {
  const mode = document.querySelector('#family-payment-mode');
  if (!(mode instanceof HTMLSelectElement)) {
    return 'oldest_first';
  }
  if (mode.value === 'selected') {
    return 'selected';
  }
  if (mode.value === 'manual') {
    return 'manual';
  }
  if (mode.value === 'credit_remainder') {
    return 'credit_remainder';
  }
  if (mode.value === 'all_credit') {
    return 'all_credit';
  }
  return 'oldest_first';
}

function linkedFamilyStudentIds(guardianId: string): Set<string> {
  return familyLinksByGuardian.get(guardianId) ?? new Set();
}

function fillFamilyPaymentChildren(): void {
  const childSelect = document.querySelector('#family-payment-child');
  const childLabel = document.querySelector('#family-payment-child-label');
  const guardian = document.querySelector('#family-payment-guardian');
  const mode = familyPaymentModeValue();
  if (childLabel instanceof HTMLElement) {
    childLabel.hidden = mode !== 'oldest_first';
  }
  if (!(childSelect instanceof HTMLSelectElement)) {
    return;
  }
  const current = childSelect.value;
  const guardianId =
    guardian instanceof HTMLSelectElement ? guardian.value : '';
  const linked = linkedFamilyStudentIds(guardianId);
  childSelect.replaceChildren();
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = 'Escolha o filho';
  childSelect.append(empty);
  for (const student of familyStudents.filter((item) => linked.has(item.id))) {
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = `${student.fullName} • ${student.ageLabel}`;
    childSelect.append(option);
  }
  if (current && linked.has(current)) {
    childSelect.value = current;
  }
}

function renderFamilyPaymentDebts(): void {
  const list = document.querySelector('#family-payment-debts');
  const guardian = document.querySelector('#family-payment-guardian');
  if (!(list instanceof HTMLElement)) {
    return;
  }
  fillFamilyPaymentChildren();
  const mode = familyPaymentModeValue();
  const guardianId =
    guardian instanceof HTMLSelectElement ? guardian.value : '';
  const linked = linkedFamilyStudentIds(guardianId);
  list.replaceChildren();
  list.hidden = mode === 'oldest_first' || mode === 'all_credit' || !guardianId;
  if (list.hidden) {
    return;
  }
  const debts = openReceivables.filter((item) =>
    linked.has(item.chargedStudentId),
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
  const guardianSelect = document.querySelector('#family-payment-guardian');
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
    familyStudents = [];
    familyLinksByGuardian = new Map();
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
    renderPaymentDebts();
    renderFamilyPaymentDebts();
    return;
  }
  try {
    const data = await api.getPaymentsScreenData();
    const students = data.students;
    const payments = data.payments;
    const guardians = data.guardians;
    familyStudents = students;
    familyLinksByGuardian = new Map();
    for (const link of data.links.filter((item) => item.active)) {
      const current = familyLinksByGuardian.get(link.guardianId) ?? new Set();
      current.add(link.studentId);
      familyLinksByGuardian.set(link.guardianId, current);
    }
    openReceivables = [
      ...data.receivables.overdue,
      ...data.receivables.today,
      ...data.receivables.upcoming,
    ];
    dueDateHistoryLabels = data.receivables.dueDateHistory.map(
      (item) => item.summaryLabel,
    );
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
    renderFamilyPaymentDebts();
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
    const data = await api.getCreditsScreenData();
    const students = data.students;
    const guardians = data.guardians;
    const accounts = data.accounts;
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
document
  .querySelector('#sale-student')
  ?.addEventListener('change', fillSaleAccounts);

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
    const chargedStudentId =
      saleAccountSelect instanceof HTMLSelectElement
        ? saleAccountSelect.value || null
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
    runBusyAction(
      salesStatus,
      submitButton(event),
      'Não foi possível confirmar a venda.',
      () =>
        api
          .createSale({
            consumerStudentId,
            chargedStudentId: chargedStudentId || undefined,
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
            sourceReservationId: saleSourceReservationId,
            overrideReservationId:
              currentSession?.role === 'owner' &&
              document.querySelector('#sale-override-reserved') instanceof
                HTMLInputElement &&
              (
                document.querySelector(
                  '#sale-override-reserved',
                ) as HTMLInputElement
              ).checked
                ? (
                    document.querySelector(
                      '#sale-override-reservation',
                    ) as HTMLSelectElement | null
                  )?.value || undefined
                : undefined,
          })
          .then((result) => {
            cart.length = 0;
            saleSourceReservationId = null;
            const overrideCheck = document.querySelector(
              '#sale-override-reserved',
            );
            if (overrideCheck instanceof HTMLInputElement) {
              overrideCheck.checked = false;
            }
            if (pixAmountInput instanceof HTMLInputElement) {
              pixAmountInput.value = '';
            }
            if (cashAmountInput instanceof HTMLInputElement) {
              cashAmountInput.value = '';
            }
            invalidateAreas(
              'inventory',
              'reservations',
              'cash',
              'reversals',
              'agenda',
              'payments',
              'credits',
              'adjust',
            );
            loadedAreas.add('sales');
            return renderSales(currentSession, result.screen);
          }),
    );
  });

document
  .querySelector('#payment-student')
  ?.addEventListener('change', renderPaymentDebts);
document
  .querySelector('#payment-mode')
  ?.addEventListener('change', renderPaymentDebts);
document
  .querySelector('#family-payment-guardian')
  ?.addEventListener('change', renderFamilyPaymentDebts);
document
  .querySelector('#family-payment-mode')
  ?.addEventListener('change', renderFamilyPaymentDebts);

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
  busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
    api
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
        invalidateAreas(
          'agenda',
          'payments',
          'credits',
          'adjust',
          'cash',
          'sales',
        );
        return ensureAreaLoaded('payments', true);
      })
      .catch((error: unknown) => {
        if (status) {
          status.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível registrar o pagamento.';
        }
      }),
  );
});

document
  .querySelector('#family-payment-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#payments-status');
    const guardian = document.querySelector('#family-payment-guardian');
    const child = document.querySelector('#family-payment-child');
    const amountInput = document.querySelector('#family-payment-amount');
    const methodSelect = document.querySelector('#family-payment-method');
    if (
      !(guardian instanceof HTMLSelectElement) ||
      !(child instanceof HTMLSelectElement) ||
      !(amountInput instanceof HTMLInputElement) ||
      !(methodSelect instanceof HTMLSelectElement)
    ) {
      return;
    }
    if (!guardian.value) {
      if (status) {
        status.textContent = 'Escolha o responsável do pagamento.';
      }
      return;
    }
    const method = methodSelect.value;
    if (method !== 'pix' && method !== 'cash') {
      return;
    }
    const mode = familyPaymentModeValue();
    if (mode === 'oldest_first' && !child.value) {
      if (status) {
        status.textContent = 'Escolha o filho para quitar.';
      }
      return;
    }
    const selectedReceivableIds: string[] = [];
    const allocations: Array<{ receivableId: string; amountCents: number }> =
      [];
    if (mode === 'selected') {
      document
        .querySelectorAll<HTMLInputElement>(
          '#family-payment-debts input[type="checkbox"]',
        )
        .forEach((box) => {
          if (box.checked && box.dataset.receivableId) {
            selectedReceivableIds.push(box.dataset.receivableId);
          }
        });
    }
    if (mode === 'manual' || mode === 'credit_remainder') {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        '#family-payment-debts input[data-receivable-id]',
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
    const parsed = parseReaisToCents(amountInput.value);
    if (!parsed.ok) {
      if (status) {
        status.textContent = parsed.error.message;
      }
      return;
    }
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .createFamilyPayment({
          guardianId: guardian.value,
          amountCents: parsed.data,
          method,
          mode,
          studentId: mode === 'oldest_first' ? child.value : undefined,
          selectedReceivableIds:
            mode === 'selected' ? selectedReceivableIds : undefined,
          allocations:
            mode === 'manual' || mode === 'credit_remainder'
              ? allocations
              : undefined,
        })
        .then(() => {
          amountInput.value = '';
          invalidateAreas(
            'agenda',
            'payments',
            'credits',
            'adjust',
            'cash',
            'sales',
          );
          return ensureAreaLoaded('payments', true);
        })
        .catch((error: unknown) => {
          if (status) {
            status.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível registrar o pagamento familiar.';
          }
        }),
    );
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
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .depositPersonalCredit({
          studentId,
          amountCents: parsed.data,
          method,
        })
        .then(() => {
          amountInput.value = '';
          invalidateAreas(
            'agenda',
            'payments',
            'credits',
            'adjust',
            'cash',
            'sales',
          );
          return ensureAreaLoaded('credits', true);
        })
        .catch((error: unknown) => {
          if (status) {
            status.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível entrar o crédito.';
          }
        }),
    );
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
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .refundPersonalCredit({
          studentId,
          amountCents: parsed.data,
          reason: reasonInput.value,
        })
        .then(() => {
          amountInput.value = '';
          reasonInput.value = '';
          return ensureAreaLoaded('credits', true);
        })
        .catch((error: unknown) => {
          if (status) {
            status.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível devolver o crédito.';
          }
        }),
    );
  });

document
  .querySelector('#sibling-auth-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#family-status');
    const consumer = document.querySelector('#sibling-consumer');
    const account = document.querySelector('#sibling-account');
    const charge = document.querySelector('#sibling-charge');
    const credit = document.querySelector('#sibling-credit');
    if (
      !(consumer instanceof HTMLSelectElement) ||
      !(account instanceof HTMLSelectElement) ||
      !(charge instanceof HTMLInputElement) ||
      !(credit instanceof HTMLInputElement)
    ) {
      return;
    }
    if (!consumer.value || !account.value) {
      if (status) {
        status.textContent = 'Escolha quem compra e a conta.';
      }
      return;
    }
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .authorizeSibling({
          consumerStudentId: consumer.value,
          accountStudentId: account.value,
          canChargeAccount: charge.checked,
          canUseAccountCredit: credit.checked,
        })
        .then(() => {
          invalidateAreas('sales');
          return ensureAreaLoaded('family', true);
        })
        .catch((error: unknown) => {
          if (status) {
            status.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível autorizar o irmão.';
          }
        }),
    );
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
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
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
        .then(() => ensureAreaLoaded('family', true))
        .catch((error: unknown) => {
          if (status) {
            status.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível salvar a autorização.';
          }
        }),
    );
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
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .depositGuardianCredit({
          guardianId,
          amountCents: parsed.data,
          method,
        })
        .then(() => {
          amountInput.value = '';
          invalidateAreas(
            'agenda',
            'payments',
            'credits',
            'adjust',
            'cash',
            'sales',
          );
          return ensureAreaLoaded('credits', true);
        })
        .catch((error: unknown) => {
          if (status) {
            status.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível entrar o crédito.';
          }
        }),
    );
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
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .refundGuardianCredit({
          guardianId,
          amountCents: parsed.data,
          reason: reasonInput.value,
        })
        .then(() => {
          amountInput.value = '';
          reasonInput.value = '';
          return ensureAreaLoaded('credits', true);
        })
        .catch((error: unknown) => {
          if (status) {
            status.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível devolver o crédito.';
          }
        }),
    );
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
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
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
          invalidateAreas('agenda');
          return ensureAreaLoaded('adjust', true);
        })
        .catch((error: unknown) => {
          if (status) {
            status.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível lançar o juros.';
          }
        }),
    );
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
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .renegotiateReceivable({
          receivableId,
          dueDate: dueDate.value,
          reason: reasonInput.value,
        })
        .then(() => {
          reasonInput.value = '';
          invalidateAreas('agenda');
          return ensureAreaLoaded('adjust', true);
        })
        .catch((error: unknown) => {
          if (status) {
            status.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível renegociar o vencimento.';
          }
        }),
    );
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
  const profile = {
    fullName: name.value,
    birthDate: birth.value || null,
    approximateAge: approxAge.value ? Number(approxAge.value) : null,
    approximateAgeReferenceYear: approxYear.value
      ? Number(approxYear.value)
      : null,
  };
  runBusyAction(
    studentsStatus,
    submitButton(event),
    editingStudentId
      ? 'Não foi possível salvar o aluno.'
      : 'Não foi possível cadastrar o aluno.',
    () => {
      const saved = editingStudentId
        ? api.updateStudent(editingStudentId, profile).then((student) => {
            if (classroomId && classroomId !== editingStudentClassroomId) {
              return api.enrollStudent(student.id, {
                classroomId,
                startedOn: '2026-08-13',
              });
            }
            return student;
          })
        : api.createStudent({
            ...profile,
            classroomId,
            startedOn: '2026-08-13',
          });
      return saved.then(() => {
        fillStudentForm(null);
        return renderStudents(true).then(() => {
          invalidateAreas('family', 'sales');
        });
      });
    },
  );
});

document.querySelector('#student-cancel')?.addEventListener('click', () => {
  fillStudentForm(null);
});

document
  .querySelector('#classroom-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.querySelector('#classroom-name');
    if (!(name instanceof HTMLInputElement) || !name.value.trim()) {
      return;
    }
    runBusyAction(
      studentsStatus,
      submitButton(event),
      editingClassroomId
        ? 'Não foi possível salvar a turma.'
        : 'Não foi possível cadastrar a turma.',
      () =>
        api.listSchoolYears().then((years) => {
          const year = years.find((item) => item.active) ?? years[0];
          if (!year) {
            throw new Error('Nenhum ano letivo ativo para criar a turma.');
          }
          const saved = editingClassroomId
            ? api.updateClassroom(editingClassroomId, name.value)
            : api.createClassroom({
                schoolYearId: year.id,
                name: name.value,
              });
          return saved.then(() => {
            fillClassroomForm(null);
            return renderStudents(true);
          });
        }),
    );
  });

document.querySelector('#classroom-cancel')?.addEventListener('click', () => {
  fillClassroomForm(null);
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
    const fields = {
      fullName: name.value,
      phone: phone.value || null,
      relationLabel: relation.value || null,
      whatsappEnabled: whatsapp.checked,
    };
    runBusyAction(
      familyStatus,
      submitButton(event),
      editingGuardianId
        ? 'Não foi possível salvar o responsável.'
        : 'Não foi possível cadastrar o responsável.',
      () => {
        const saved = editingGuardianId
          ? api.updateGuardian(editingGuardianId, fields)
          : api.createGuardian(fields);
        return saved.then(() => {
          fillGuardianForm(null);
          return ensureAreaLoaded('family', true);
        });
      },
    );
  });

document.querySelector('#guardian-cancel')?.addEventListener('click', () => {
  fillGuardianForm(null);
});

document
  .querySelector('#age-setting-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!(ageSettingInput instanceof HTMLInputElement)) {
      return;
    }
    runBusyAction(
      familyStatus,
      submitButton(event),
      'Não foi possível salvar a idade.',
      () =>
        api
          .setRequireGuardianBelowAge(Number(ageSettingInput.value))
          .then(() =>
            Promise.all([
              renderStudents(true),
              ensureAreaLoaded('family', true),
            ]),
          ),
    );
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
  runBusyAction(
    productsStatus,
    submitButton(event),
    'Não foi possível salvar o produto.',
    () =>
      saved.then(() => {
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
      }),
  );
});

document.querySelector('#product-cancel')?.addEventListener('click', () => {
  fillProductForm(null);
});

document
  .querySelector('#category-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.querySelector('#category-name');
    if (!(name instanceof HTMLInputElement)) {
      return;
    }
    const saved = editingCategoryId
      ? api.updateCategory(editingCategoryId, name.value)
      : api.createCategory(name.value);
    runBusyAction(
      productsStatus,
      submitButton(event),
      'Não foi possível salvar a categoria.',
      () =>
        saved.then(() => {
          fillCategoryForm(null);
          return ensureAreaLoaded('products', true);
        }),
    );
  });

document.querySelector('#category-cancel')?.addEventListener('click', () => {
  fillCategoryForm(null);
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
  busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
    api
      .createAdHocItem({
        name: name.value,
        priceCents: cents.data,
      })
      .then(() => {
        name.value = '';
        price.value = '';
        return ensureAreaLoaded('products', true);
      })
      .catch((error: unknown) => {
        if (adHocStatus) {
          adHocStatus.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível registrar o item avulso.';
        }
      }),
  );
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
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .adjustInventory({
          productId: inventoryAdjustProduct.value,
          quantityDelta: Number(delta.value),
          reason: reason.value,
        })
        .then(() => {
          delta.value = '';
          reason.value = '';
          return ensureAreaLoaded('inventory', true);
        })
        .catch((error: unknown) => {
          if (inventoryStatus) {
            inventoryStatus.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível ajustar o estoque.';
          }
        }),
    );
  });

document
  .querySelector('#cash-open-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const amountInput = document.querySelector('#cash-opening-float');
    const raw =
      amountInput instanceof HTMLInputElement ? amountInput.value.trim() : '';
    const parsed = raw
      ? parseReaisToCents(raw)
      : { ok: true as const, data: 0 };
    if (!parsed.ok) {
      if (cashStatus) {
        cashStatus.textContent = parsed.error.message;
      }
      return;
    }
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .openCashSession({ openingFloatCents: parsed.data })
        .then(() => ensureAreaLoaded('cash', true))
        .catch((error: unknown) => {
          if (cashStatus) {
            cashStatus.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível abrir o caixa.';
          }
        }),
    );
  });

document
  .querySelector('#cash-add-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const amountInput = document.querySelector('#cash-add-amount');
    const noteInput = document.querySelector('#cash-add-note');
    if (
      !(amountInput instanceof HTMLInputElement) ||
      !(noteInput instanceof HTMLInputElement)
    ) {
      return;
    }
    const parsed = parseReaisToCents(amountInput.value);
    if (!parsed.ok) {
      if (cashStatus) {
        cashStatus.textContent = parsed.error.message;
      }
      return;
    }
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .addCashForChange({ amountCents: parsed.data, note: noteInput.value })
        .then(() => {
          amountInput.value = '';
          noteInput.value = '';
          return ensureAreaLoaded('cash', true);
        })
        .catch((error: unknown) => {
          if (cashStatus) {
            cashStatus.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível adicionar troco.';
          }
        }),
    );
  });

document
  .querySelector('#cash-remove-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const amountInput = document.querySelector('#cash-remove-amount');
    const noteInput = document.querySelector('#cash-remove-note');
    if (
      !(amountInput instanceof HTMLInputElement) ||
      !(noteInput instanceof HTMLInputElement)
    ) {
      return;
    }
    const parsed = parseReaisToCents(amountInput.value);
    if (!parsed.ok) {
      if (cashStatus) {
        cashStatus.textContent = parsed.error.message;
      }
      return;
    }
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .removeCash({ amountCents: parsed.data, note: noteInput.value })
        .then(() => {
          amountInput.value = '';
          noteInput.value = '';
          return ensureAreaLoaded('cash', true);
        })
        .catch((error: unknown) => {
          if (cashStatus) {
            cashStatus.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível retirar dinheiro.';
          }
        }),
    );
  });

document
  .querySelector('#cash-close-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const countedInput = document.querySelector('#cash-counted');
    const noteInput = document.querySelector('#cash-close-note');
    if (
      !(countedInput instanceof HTMLInputElement) ||
      !(noteInput instanceof HTMLInputElement)
    ) {
      return;
    }
    const parsed = parseReaisToCents(countedInput.value);
    if (!parsed.ok) {
      if (cashStatus) {
        cashStatus.textContent = parsed.error.message;
      }
      return;
    }
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .closeCashSession({
          countedCents: parsed.data,
          note: noteInput.value,
        })
        .then(() => {
          countedInput.value = '';
          noteInput.value = '';
          return ensureAreaLoaded('cash', true);
        })
        .catch((error: unknown) => {
          if (cashStatus) {
            cashStatus.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível fechar o caixa.';
          }
        }),
    );
  });

reverseSaleId?.addEventListener('change', () => {
  syncReverseSaleFields();
});

reversePaymentId?.addEventListener('change', () => {
  const payment = reversalsSetup?.payments.find(
    (item) =>
      item.id ===
      (reversePaymentId instanceof HTMLSelectElement
        ? reversePaymentId.value
        : ''),
  );
  if (payment && reversePaymentMethod instanceof HTMLSelectElement) {
    reversePaymentMethod.value = payment.method;
  }
});

reverseCreditId?.addEventListener('change', () => {
  const refund = reversalsSetup?.creditRefunds.find(
    (item) =>
      item.id ===
      (reverseCreditId instanceof HTMLSelectElement
        ? reverseCreditId.value
        : ''),
  );
  if (refund && reverseCreditMethod instanceof HTMLSelectElement) {
    reverseCreditMethod.value = refund.method;
  }
});

function refreshAfterReversal(successMessage: string): Promise<void> {
  invalidateAreas(
    'reversals',
    'sales',
    'inventory',
    'cash',
    'agenda',
    'payments',
    'credits',
    'adjust',
  );
  return ensureAreaLoaded('reversals', true).then(() => {
    if (reversalsStatus) {
      reversalsStatus.textContent = successMessage;
    }
  });
}

document
  .querySelector('#reverse-sale-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!(reverseSaleId instanceof HTMLSelectElement) || !reversalsStatus) {
      return;
    }
    if (!reverseSaleId.value) {
      reversalsStatus.textContent = 'Escolha a venda e informe o motivo.';
      return;
    }
    const sale = reversalsSetup?.sales.find(
      (item) => item.id === reverseSaleId.value,
    );
    const reason =
      reverseSaleReason instanceof HTMLTextAreaElement
        ? reverseSaleReason.value
        : '';
    if (!reason.trim()) {
      reversalsStatus.textContent = 'Escolha a venda e informe o motivo.';
      return;
    }
    const stockChoice = document.querySelector(
      'input[name="return-stock"]:checked',
    );
    if (sale?.hasTrackedItems && !(stockChoice instanceof HTMLInputElement)) {
      reversalsStatus.textContent =
        'Informe se o produto voltou fisicamente ao estoque.';
      return;
    }
    const refundMethod =
      sale && sale.externalAmountCents > 0
        ? reverseSaleMethod instanceof HTMLSelectElement
          ? reverseSaleMethod.value
          : ''
        : null;
    if (sale && sale.externalAmountCents > 0 && !refundMethod) {
      reversalsStatus.textContent = 'Escolha a forma da devolução.';
      return;
    }
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .reverseSale({
          saleId: reverseSaleId.value,
          refundMethod:
            refundMethod === 'pix' || refundMethod === 'cash'
              ? refundMethod
              : null,
          confirmDifferentMethod:
            reverseSaleDifferent instanceof HTMLInputElement &&
            reverseSaleDifferent.checked,
          returnItemsToStock:
            stockChoice instanceof HTMLInputElement &&
            stockChoice.value === 'yes',
          reason,
        })
        .then(() => {
          reverseSaleId.value = '';
          if (reverseSaleMethod instanceof HTMLSelectElement) {
            reverseSaleMethod.value = '';
          }
          if (reverseSaleDifferent instanceof HTMLInputElement) {
            reverseSaleDifferent.checked = false;
          }
          if (reverseSaleReason instanceof HTMLTextAreaElement) {
            reverseSaleReason.value = '';
          }
          document
            .querySelectorAll<HTMLInputElement>('input[name="return-stock"]')
            .forEach((input) => {
              input.checked = false;
            });
          return refreshAfterReversal(
            'Venda estornada; original e efeitos permanecem auditáveis.',
          );
        })
        .catch((error: unknown) => {
          reversalsStatus.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível estornar a venda.';
        }),
    );
  });

document
  .querySelector('#reverse-payment-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!(reversePaymentId instanceof HTMLSelectElement) || !reversalsStatus) {
      return;
    }
    const reason =
      reversePaymentReason instanceof HTMLTextAreaElement
        ? reversePaymentReason.value
        : '';
    if (!reversePaymentId.value || !reason.trim()) {
      reversalsStatus.textContent = 'Escolha o pagamento e informe o motivo.';
      return;
    }
    const method =
      reversePaymentMethod instanceof HTMLSelectElement
        ? reversePaymentMethod.value
        : 'pix';
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .reversePayment({
          paymentId: reversePaymentId.value,
          refundMethod: method === 'cash' ? 'cash' : 'pix',
          confirmDifferentMethod:
            reversePaymentDifferent instanceof HTMLInputElement &&
            reversePaymentDifferent.checked,
          reason,
        })
        .then(() => {
          reversePaymentId.value = '';
          if (reversePaymentDifferent instanceof HTMLInputElement) {
            reversePaymentDifferent.checked = false;
          }
          if (reversePaymentReason instanceof HTMLTextAreaElement) {
            reversePaymentReason.value = '';
          }
          return refreshAfterReversal(
            'Pagamento estornado; as dívidas correspondentes foram recalculadas.',
          );
        })
        .catch((error: unknown) => {
          reversalsStatus.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível estornar o pagamento.';
        }),
    );
  });

document
  .querySelector('#reverse-credit-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!(reverseCreditId instanceof HTMLSelectElement) || !reversalsStatus) {
      return;
    }
    const reason =
      reverseCreditReason instanceof HTMLTextAreaElement
        ? reverseCreditReason.value
        : '';
    if (!reverseCreditId.value || !reason.trim()) {
      reversalsStatus.textContent =
        'Escolha a devolução de crédito e informe o motivo.';
      return;
    }
    const method =
      reverseCreditMethod instanceof HTMLSelectElement
        ? reverseCreditMethod.value
        : 'pix';
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .reverseCreditRefund({
          creditMovementId: reverseCreditId.value,
          recoveryMethod: method === 'cash' ? 'cash' : 'pix',
          confirmDifferentMethod:
            reverseCreditDifferent instanceof HTMLInputElement &&
            reverseCreditDifferent.checked,
          reason,
        })
        .then(() => {
          reverseCreditId.value = '';
          if (reverseCreditDifferent instanceof HTMLInputElement) {
            reverseCreditDifferent.checked = false;
          }
          if (reverseCreditReason instanceof HTMLTextAreaElement) {
            reverseCreditReason.value = '';
          }
          return refreshAfterReversal(
            'Devolução de crédito estornada e saldo restaurado.',
          );
        })
        .catch((error: unknown) => {
          reversalsStatus.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível estornar a devolução de crédito.';
        }),
    );
  });

document
  .querySelector('#reservation-slot-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const label = document.querySelector('#reservation-slot-label');
    const cutoff = document.querySelector('#reservation-slot-cutoff');
    const start = document.querySelector('#reservation-slot-start');
    const end = document.querySelector('#reservation-slot-end');
    if (
      !(label instanceof HTMLInputElement) ||
      !(cutoff instanceof HTMLInputElement) ||
      !(start instanceof HTMLInputElement) ||
      !(end instanceof HTMLInputElement)
    ) {
      return;
    }
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .createReservationSlot({
          label: label.value,
          cutoffTime: cutoff.value,
          pickupStartTime: start.value,
          pickupEndTime: end.value,
        })
        .then(() => {
          label.value = '';
          cutoff.value = '';
          start.value = '';
          end.value = '';
          return refreshAfterReservation('Recreio criado.');
        })
        .catch((error: unknown) => {
          if (reservationsStatus) {
            reservationsStatus.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível criar o recreio.';
          }
        }),
    );
  });

document
  .querySelector('#reservation-create-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const classroom = document.querySelector('#reservation-classroom');
    const quantity = document.querySelector('#reservation-quantity');
    if (
      !(reservationSlotId instanceof HTMLSelectElement) ||
      !(reservationProduct instanceof HTMLSelectElement) ||
      !(reservationStudentSelect instanceof HTMLSelectElement) ||
      !(classroom instanceof HTMLInputElement) ||
      !(quantity instanceof HTMLInputElement)
    ) {
      return;
    }
    const student = reservationStudents.find(
      (item) => item.id === reservationStudentSelect.value,
    );
    if (!student) {
      if (reservationsStatus) {
        reservationsStatus.textContent = 'Escolha o aluno cadastrado.';
      }
      return;
    }
    runBusyAction(
      reservationsStatus,
      submitButton(event),
      'Não foi possível confirmar a reserva.',
      () =>
        api
          .createReservation({
            requestId: createRequestId(),
            slotId: reservationSlotId.value,
            studentNameText: student.fullName,
            classroomText: classroom.value,
            linkedStudentId: student.id,
            items: [
              {
                productId: reservationProduct.value,
                quantity: Number(quantity.value),
              },
            ],
          })
          .then(() => {
            if (reservationStudentSearch instanceof HTMLInputElement) {
              reservationStudentSearch.value = '';
            }
            reservationStudentSelect.value = '';
            classroom.value = '';
            quantity.value = '1';
            fillReservationStudentOptions();
            return refreshAfterReservation(
              'Reserva confirmada; o original e a disponibilidade permanecem auditáveis.',
            );
          }),
    );
  });

reservationsList?.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !target.dataset.reservationId) {
    return;
  }
  const reservationId = target.dataset.reservationId;
  const action = target.dataset.reservationAction;
  if (action === 'edit') {
    const entry = reservationsSetup?.reservations.find(
      (item) => item.id === reservationId,
    );
    const editId = document.querySelector('#reservation-edit-id');
    const editName = document.querySelector('#reservation-edit-name');
    const editClassroom = document.querySelector('#reservation-edit-classroom');
    const editContact = document.querySelector('#reservation-edit-contact');
    if (
      entry &&
      editId instanceof HTMLInputElement &&
      editName instanceof HTMLInputElement &&
      editClassroom instanceof HTMLInputElement &&
      editContact instanceof HTMLInputElement
    ) {
      editId.value = entry.id;
      editName.value = entry.studentNameText;
      editClassroom.value = entry.classroomText;
      editContact.value = entry.contactOptional;
    }
    if (reservationsStatus) {
      reservationsStatus.textContent = 'Altere os dados e confirme.';
    }
    return;
  }
  if (action === 'link') {
    if (
      !(reservationLinkStudent instanceof HTMLSelectElement) ||
      !reservationLinkStudent.value
    ) {
      if (reservationsStatus) {
        reservationsStatus.textContent = 'Escolha o aluno do cadastro.';
      }
      return;
    }
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .linkReservationStudent({
          reservationId,
          studentId: reservationLinkStudent.value,
        })
        .then(() => refreshAfterReservation('Aluno vinculado à reserva.'))
        .catch((error: unknown) => {
          if (reservationsStatus) {
            reservationsStatus.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível vincular o aluno.';
          }
        }),
    );
    return;
  }
  if (action === 'fulfill') {
    const entry = reservationsSetup?.reservations.find(
      (item) => item.id === reservationId,
    );
    if (!entry) {
      return;
    }
    cart.length = 0;
    for (const item of entry.items) {
      cart.push({
        productId: item.productId,
        name: item.productName,
        quantity: item.quantity,
        discountKind: 'none',
        discountInput: null,
      });
    }
    saleSourceReservationId = entry.id;
    activeArea = 'sales';
    syncWorkspace(currentSession);
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      ensureAreaLoaded('sales').then(() => {
        if (
          entry.linkedStudentId &&
          saleStudentSelect instanceof HTMLSelectElement
        ) {
          saleStudentSelect.value = entry.linkedStudentId;
          fillSaleAccounts();
        }
        renderCart();
        if (salesStatus) {
          salesStatus.textContent =
            'Entrega da reserva. Escolha o pagamento e confirme a venda.';
        }
      }),
    );
    return;
  }
  const reasonInput = document.querySelector('#reservation-action-reason');
  const reason =
    reasonInput instanceof HTMLInputElement ? reasonInput.value : '';
  const request =
    action === 'no-show'
      ? api.markReservationNoShow({
          reservationId,
          reason,
        })
      : api.cancelReservation({
          reservationId,
          reason,
        });
  runBusyAction(
    reservationsStatus,
    event.target instanceof HTMLButtonElement ? event.target : null,
    'Não foi possível atualizar a reserva.',
    () =>
      request.then(() => {
        if (reasonInput instanceof HTMLInputElement) {
          reasonInput.value = '';
        }
        return refreshAfterReservation(
          action === 'no-show'
            ? 'Não retirada registrada; a disponibilidade foi liberada.'
            : 'Reserva cancelada; a disponibilidade foi liberada.',
        );
      }),
  );
});

reservationFilterSlot?.addEventListener('change', () => {
  paintReservationQueue();
});
reservationSearch?.addEventListener('input', () => {
  paintReservationQueue();
});
reservationStudentSearch?.addEventListener('input', () => {
  fillReservationStudentOptions();
});
reservationStudentSelect?.addEventListener('change', () => {
  applyReservationStudentSelection();
});

reservationEditForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const editId = document.querySelector('#reservation-edit-id');
  const editName = document.querySelector('#reservation-edit-name');
  const editClassroom = document.querySelector('#reservation-edit-classroom');
  const editContact = document.querySelector('#reservation-edit-contact');
  if (
    !(editId instanceof HTMLInputElement) ||
    !(editName instanceof HTMLInputElement) ||
    !(editClassroom instanceof HTMLInputElement) ||
    !(editContact instanceof HTMLInputElement)
  ) {
    return;
  }
  if (!editId.value) {
    if (reservationsStatus) {
      reservationsStatus.textContent = 'Escolha uma reserva para alterar.';
    }
    return;
  }
  busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
    api
      .updateReservation({
        requestId: createRequestId(),
        reservationId: editId.value,
        studentNameText: editName.value,
        classroomText: editClassroom.value,
        contactOptional: editContact.value,
      })
      .then(() => {
        editId.value = '';
        return refreshAfterReservation('Reserva alterada.');
      })
      .catch((error: unknown) => {
        if (reservationsStatus) {
          reservationsStatus.textContent =
            error instanceof Error
              ? error.message.replace(/^[A-Z_]+:\s*/, '')
              : 'Não foi possível alterar a reserva.';
        }
      }),
  );
});

document
  .querySelector('#public-portal-form')
  ?.addEventListener('submit', (event) => {
    event.preventDefault();
    const slot = document.querySelector('#public-portal-slot');
    const name = document.querySelector('#public-portal-name');
    const classroom = document.querySelector('#public-portal-classroom');
    const contact = document.querySelector('#public-portal-contact');
    const product = document.querySelector('#public-portal-product');
    const quantity = document.querySelector('#public-portal-quantity');
    const honeypot = document.querySelector('#public-portal-honeypot');
    const status = document.querySelector('#public-portal-status');
    const code = document.querySelector('#public-portal-code');
    const confirmation = document.querySelector('#public-portal-confirmation');
    if (
      !(slot instanceof HTMLSelectElement) ||
      !(name instanceof HTMLInputElement) ||
      !(classroom instanceof HTMLInputElement) ||
      !(contact instanceof HTMLInputElement) ||
      !(product instanceof HTMLSelectElement) ||
      !(quantity instanceof HTMLInputElement)
    ) {
      return;
    }
    busyFromEvent(event, 'Não foi possível concluir a ação.', () =>
      api
        .createPublicReservation({
          requestId: createRequestId(),
          slotId: slot.value,
          studentNameText: name.value,
          classroomText: classroom.value,
          contactOptional: contact.value,
          website: honeypot instanceof HTMLInputElement ? honeypot.value : '',
          items: [
            {
              productId: product.value,
              quantity: Number(quantity.value),
            },
          ],
        })
        .then((created) => {
          name.value = '';
          classroom.value = '';
          contact.value = '';
          quantity.value = '1';
          if (code instanceof HTMLElement) {
            code.hidden = false;
            code.textContent = created.publicCodeLabel;
          }
          if (confirmation instanceof HTMLElement) {
            confirmation.hidden = false;
            confirmation.textContent = created.summaryLabel;
          }
          return renderPublicPortal().then(() => {
            if (status) {
              status.textContent =
                'Reserva enviada. Guarde o código para a retirada.';
            }
          });
        })
        .catch((error: unknown) => {
          if (status) {
            status.textContent =
              error instanceof Error
                ? error.message.replace(/^[A-Z_]+:\s*/, '')
                : 'Não foi possível enviar a reserva.';
          }
        }),
    );
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
    if (isPublicPortal()) {
      renderSession(null, false);
      syncWorkspace(null);
      await renderPublicPortal();
      return;
    }
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
