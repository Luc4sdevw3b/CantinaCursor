import { todayCivilSaoPaulo } from '../../domain/civil-date';
import {
  availabilitySummaryLabel,
  buildProductionSummary,
  buildSlotTimes,
  createPublicCode,
  linkedReservationStudentLabel,
  publicProductSummaryLabel,
  publicReservationCodeLabel,
  rejectPublicHoneypot,
  isActiveReservationStatus,
  parseClassroomText,
  parseImmutableId,
  parseItemQuantity,
  parseOptionalContact,
  parseOptionalNote,
  parseReservationName,
  parseReservationReason,
  parseReservationRequestId,
  parseSlotLabel,
  PRODUCT_INACTIVE_ERROR,
  PRODUCT_NOT_RESERVABLE_ERROR,
  rejectPreparedStatus,
  RESERVATION_CREATE_OPERATION,
  RESERVATION_CUTOFF_PASSED_ERROR,
  RESERVATION_ITEMS_REQUIRED_ERROR,
  RESERVATION_NOT_ACTIVE_ERROR,
  RESERVATION_NOT_FOUND_ERROR,
  RESERVATION_PARTIAL_UNSUPPORTED_ERROR,
  RESERVATION_PAYMENT_UNPAID,
  RESERVATION_PAYMENT_PAID,
  RESERVATION_STATUS_CANCELLED,
  RESERVATION_STATUS_FULFILLED,
  RESERVATION_STATUS_NO_SHOW,
  RESERVATION_STATUS_RESERVED,
  RESERVATION_STUDENT_INACTIVE_ERROR,
  RESERVATION_STUDENT_NOT_FOUND_ERROR,
  RESERVATION_UNAVAILABLE_ERROR,
  RESERVATION_UPDATE_OPERATION,
  reservationSummaryLabel,
  SLOT_INACTIVE_ERROR,
  SLOT_NOT_FOUND_ERROR,
  slotIsOpen,
  slotSummaryLabel,
} from '../../domain/reservation';
import { err, ok, type AppError, type Result } from '../../domain/result';
import type { MemoryCatalog } from '../products/memory-catalog';
import type { MemoryStock } from '../inventory/memory-stock';
import type { MemoryRoster } from '../students/memory-roster';

const LOCAL_ACTOR_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000099';

export interface ReservationSlotView {
  id: string;
  businessDate: string;
  label: string;
  cutoffAt: string;
  pickupStartsAt: string;
  pickupEndsAt: string;
  active: boolean;
  openForReservations: boolean;
  summaryLabel: string;
}

export interface ReservationItemView {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface ReservationView {
  id: string;
  publicCode: string;
  publicCodeLabel: string;
  slotId: string;
  slotLabel: string;
  studentNameText: string;
  classroomText: string;
  contactOptional: string;
  linkedStudentId: string | null;
  linkedStudentLabel: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  summaryLabel: string;
  items: ReservationItemView[];
  createdAt: string;
}

export interface ReservationProductionView {
  productId: string;
  productName: string;
  quantity: number;
  summaryLabel: string;
}

export interface ReservationAvailabilityView {
  productId: string;
  productName: string;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  summaryLabel: string;
}

export interface ReservableProductView {
  id: string;
  name: string;
  priceCents: number;
}

export interface PublicReservationProductView {
  id: string;
  name: string;
  priceCents: number;
  availableQuantity: number;
  soldOut: boolean;
  summaryLabel: string;
}

export interface PublicReservationPortalView {
  slots: Array<{
    id: string;
    label: string;
    summaryLabel: string;
  }>;
  products: PublicReservationProductView[];
}

export interface PublicReservationConfirmationView {
  publicCode: string;
  publicCodeLabel: string;
  summaryLabel: string;
}

export interface ReservationsSetupView {
  slots: ReservationSlotView[];
  reservations: ReservationView[];
  availability: ReservationAvailabilityView[];
  reservableProducts: ReservableProductView[];
  production: ReservationProductionView[];
}

interface SlotRecord {
  id: string;
  business_date: string;
  label: string;
  pickup_starts_at: string;
  pickup_ends_at: string;
  cutoff_at: string;
  active: string;
  created_by: string;
  created_at: string;
}

interface ReservationRecord {
  id: string;
  public_code: string;
  request_id: string;
  requester_name: string;
  student_name_text: string;
  classroom_text: string;
  contact_optional: string;
  slot_id: string;
  status: string;
  payment_status: string;
  linked_student_id: string;
  total_cents: string;
  created_at: string;
  updated_at: string;
  note: string;
}

interface ItemRecord {
  id: string;
  reservation_id: string;
  product_id: string;
  description_snapshot: string;
  quantity: string;
  unit_price_cents: string;
  line_total_cents: string;
}

interface HistoryRecord {
  id: string;
  reservation_id: string;
  from_status: string;
  to_status: string;
  actor_id: string;
  created_at: string;
  reason: string;
}

interface OperationRecord {
  request_id: string;
  operation_type: string;
  result_entity_id: string;
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

export class MemoryReservations {
  private slots: SlotRecord[] = [];
  private reservations: ReservationRecord[] = [];
  private items: ItemRecord[] = [];
  private history: HistoryRecord[] = [];
  private operations: OperationRecord[] = [];
  private seeded = false;

  constructor(
    private readonly catalog: MemoryCatalog,
    private readonly stock: MemoryStock,
    private readonly roster: MemoryRoster | null = null,
    private readonly nowIso: () => string = () => new Date().toISOString(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  ensureDemoSlots(): void {
    if (this.seeded) {
      return;
    }
    this.seeded = true;
    const today = todayCivilSaoPaulo(this.nowIso());
    unwrap(
      this.createSlot({
        label: 'Recreio manhã',
        businessDate: today,
        cutoffTime: '09:15',
        pickupStartTime: '09:45',
        pickupEndTime: '10:05',
      }),
    );
    unwrap(
      this.createSlot({
        label: 'Recreio tarde',
        businessDate: today,
        cutoffTime: '18:00',
        pickupStartTime: '18:15',
        pickupEndTime: '18:35',
      }),
    );
  }

  reservedQuantity(
    productId: string,
    businessDate: string,
    excludeReservationId?: string,
  ): number {
    let total = 0;
    for (const reservation of latestById(this.reservations)) {
      if (!isActiveReservationStatus(reservation.status)) {
        continue;
      }
      if (excludeReservationId && reservation.id === excludeReservationId) {
        continue;
      }
      const slot = latestById(this.slots).find(
        (item) => item.id === reservation.slot_id,
      );
      if (!slot || slot.business_date !== businessDate) {
        continue;
      }
      for (const item of this.items.filter(
        (entry) => entry.reservation_id === reservation.id,
      )) {
        if (item.product_id === productId) {
          total += Number(item.quantity);
        }
      }
    }
    return total;
  }

  getSetup(): Result<ReservationsSetupView> {
    const now = this.nowIso();
    const today = todayCivilSaoPaulo(now);
    const slots = latestById(this.slots)
      .filter((item) => item.business_date === today)
      .map((item) => this.toSlot(item, now));
    const reservations = latestById(this.reservations)
      .slice()
      .reverse()
      .map((item) => this.toReservation(item));
    const balances = this.stock.listBalances(today);
    const availability: ReservationAvailabilityView[] = balances.ok
      ? balances.data.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          physicalQuantity: item.physicalQuantity,
          reservedQuantity: item.reservedQuantity,
          availableQuantity: item.availableQuantity,
          summaryLabel: availabilitySummaryLabel({
            productName: item.productName,
            availableQuantity: item.availableQuantity,
            reservedQuantity: item.reservedQuantity,
          }),
        }))
      : [];
    const reservableProducts = unwrap(this.catalog.listProducts())
      .filter((item) => item.active && item.reservable)
      .map((item) => ({
        id: item.id,
        name: item.name,
        priceCents: item.priceCents,
      }));
    return ok({
      slots,
      reservations,
      availability,
      reservableProducts,
      production: buildProductionSummary(reservations),
    });
  }

  getPublicPortal(): Result<PublicReservationPortalView> {
    const setup = this.getSetup();
    if (!setup.ok) {
      return err(setup.error);
    }
    const availabilityByProduct = new Map(
      setup.data.availability.map((item) => [item.productId, item]),
    );
    return ok({
      slots: setup.data.slots
        .filter((item) => item.openForReservations)
        .map((item) => ({
          id: item.id,
          label: item.label,
          summaryLabel: item.summaryLabel,
        })),
      products: setup.data.reservableProducts.map((product) => {
        const availability = availabilityByProduct.get(product.id);
        const availableQuantity = availability?.availableQuantity ?? 0;
        const soldOut = !availability || availableQuantity <= 0;
        return {
          id: product.id,
          name: product.name,
          priceCents: product.priceCents,
          availableQuantity,
          soldOut,
          summaryLabel: publicProductSummaryLabel({
            name: product.name,
            priceCents: product.priceCents,
            availableQuantity,
            soldOut,
          }),
        };
      }),
    });
  }

  toPublicConfirmation(
    requestId: string,
  ): Result<PublicReservationConfirmationView> {
    const reservation = latestById(this.reservations).find(
      (item) => item.request_id === requestId,
    );
    if (!reservation) {
      return err(RESERVATION_NOT_FOUND_ERROR);
    }
    const view = this.toReservation(reservation);
    return ok({
      publicCode: view.publicCode,
      publicCodeLabel: publicReservationCodeLabel(view.publicCode),
      summaryLabel: view.summaryLabel,
    });
  }

  createSlot(input: {
    label?: unknown;
    businessDate?: unknown;
    cutoffTime?: unknown;
    pickupStartTime?: unknown;
    pickupEndTime?: unknown;
  }): Result<ReservationsSetupView> {
    const label = parseSlotLabel(input.label);
    if (!label.ok) {
      return err(label.error);
    }
    const times = buildSlotTimes({
      businessDate: input.businessDate,
      cutoffTime: input.cutoffTime,
      pickupStartTime: input.pickupStartTime,
      pickupEndTime: input.pickupEndTime,
      fallbackCivil: todayCivilSaoPaulo(this.nowIso()),
    });
    if (!times.ok) {
      return err(times.error);
    }
    const now = this.nowIso();
    this.slots.push({
      id: this.createId(),
      business_date: times.data.businessDate,
      label: label.data,
      pickup_starts_at: times.data.pickupStartsAt,
      pickup_ends_at: times.data.pickupEndsAt,
      cutoff_at: times.data.cutoffAt,
      active: 'true',
      created_by: LOCAL_ACTOR_ID,
      created_at: now,
    });
    return this.getSetup();
  }

  createReservation(input: {
    requestId?: unknown;
    slotId?: unknown;
    studentNameText?: unknown;
    classroomText?: unknown;
    contactOptional?: unknown;
    note?: unknown;
    status?: unknown;
    items?: unknown;
    partialPickup?: unknown;
    website?: unknown;
  }): Result<ReservationsSetupView> {
    const honeypot = rejectPublicHoneypot(input.website);
    if (!honeypot.ok) {
      return err(honeypot.error);
    }
    const prepared = rejectPreparedStatus(input.status);
    if (!prepared.ok) {
      return err(prepared.error);
    }
    if (input.partialPickup === true) {
      return err(RESERVATION_PARTIAL_UNSUPPORTED_ERROR);
    }
    const requestId = parseReservationRequestId(input.requestId);
    if (!requestId.ok) {
      return err(requestId.error);
    }
    const existing = this.operations.find(
      (item) => item.request_id === requestId.data,
    );
    if (existing) {
      if (existing.operation_type !== RESERVATION_CREATE_OPERATION) {
        return err({
          code: 'REQUEST_CONFLICT',
          message: 'Este request_id já foi usado em outra operação.',
          retryable: false,
        });
      }
      return this.getSetup();
    }
    const slotId = parseImmutableId(input.slotId);
    if (!slotId.ok) {
      return err(slotId.error);
    }
    const slot = latestById(this.slots).find((item) => item.id === slotId.data);
    if (!slot) {
      return err(SLOT_NOT_FOUND_ERROR);
    }
    if (slot.active !== 'true') {
      return err(SLOT_INACTIVE_ERROR);
    }
    if (!slotIsOpen(slot.cutoff_at, this.nowIso())) {
      return err(RESERVATION_CUTOFF_PASSED_ERROR);
    }
    const studentName = parseReservationName(input.studentNameText);
    if (!studentName.ok) {
      return err(studentName.error);
    }
    const classroom = parseClassroomText(input.classroomText);
    if (!classroom.ok) {
      return err(classroom.error);
    }
    const contact = parseOptionalContact(input.contactOptional);
    if (!contact.ok) {
      return err(contact.error);
    }
    const note = parseOptionalNote(input.note);
    if (!note.ok) {
      return err(note.error);
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
      return err(RESERVATION_ITEMS_REQUIRED_ERROR);
    }
    const products = unwrap(
      this.catalog.listProducts({ includeInactive: true }),
    );
    const needed = new Map<string, number>();
    const parsedItems: Array<{
      productId: string;
      name: string;
      quantity: number;
      unitPriceCents: number;
      lineTotalCents: number;
    }> = [];
    for (const raw of input.items) {
      const row = raw as { productId?: unknown; quantity?: unknown };
      const productId = parseImmutableId(row.productId);
      if (!productId.ok) {
        return err(productId.error);
      }
      const quantity = parseItemQuantity(row.quantity);
      if (!quantity.ok) {
        return err(quantity.error);
      }
      const product = products.find((item) => item.id === productId.data);
      if (!product) {
        return err({
          code: 'PRODUCT_NOT_FOUND',
          message: 'Produto não encontrado.',
          retryable: false,
        });
      }
      if (!product.active) {
        return err(PRODUCT_INACTIVE_ERROR);
      }
      if (!product.reservable) {
        return err(PRODUCT_NOT_RESERVABLE_ERROR);
      }
      needed.set(product.id, (needed.get(product.id) ?? 0) + quantity.data);
      parsedItems.push({
        productId: product.id,
        name: product.name,
        quantity: quantity.data,
        unitPriceCents: product.priceCents,
        lineTotalCents: product.priceCents * quantity.data,
      });
    }
    for (const [productId, quantity] of needed) {
      const product = products.find((item) => item.id === productId);
      if (!product?.stockTracked) {
        continue;
      }
      const available = this.stock.availableQuantity(
        productId,
        slot.business_date,
      );
      if (!available.ok) {
        return err(available.error);
      }
      if (available.data < quantity) {
        return err(RESERVATION_UNAVAILABLE_ERROR);
      }
    }
    const now = this.nowIso();
    const reservationId = this.createId();
    const totalCents = parsedItems.reduce(
      (total, item) => total + item.lineTotalCents,
      0,
    );
    this.reservations.push({
      id: reservationId,
      public_code: this.uniquePublicCode(),
      request_id: requestId.data,
      requester_name: studentName.data,
      student_name_text: studentName.data,
      classroom_text: classroom.data,
      contact_optional: contact.data,
      slot_id: slot.id,
      status: RESERVATION_STATUS_RESERVED,
      payment_status: RESERVATION_PAYMENT_UNPAID,
      linked_student_id: '',
      total_cents: String(totalCents),
      created_at: now,
      updated_at: now,
      note: note.data,
    });
    for (const item of parsedItems) {
      this.items.push({
        id: this.createId(),
        reservation_id: reservationId,
        product_id: item.productId,
        description_snapshot: item.name,
        quantity: String(item.quantity),
        unit_price_cents: String(item.unitPriceCents),
        line_total_cents: String(item.lineTotalCents),
      });
    }
    this.history.push({
      id: this.createId(),
      reservation_id: reservationId,
      from_status: '',
      to_status: RESERVATION_STATUS_RESERVED,
      actor_id: LOCAL_ACTOR_ID,
      created_at: now,
      reason: 'Reserva criada',
    });
    this.operations.push({
      request_id: requestId.data,
      operation_type: RESERVATION_CREATE_OPERATION,
      result_entity_id: reservationId,
    });
    return this.getSetup();
  }

  cancelReservation(input: {
    reservationId?: unknown;
    reason?: unknown;
  }): Result<ReservationsSetupView> {
    return this.transition(
      input.reservationId,
      RESERVATION_STATUS_CANCELLED,
      input.reason,
    );
  }

  markReservationNoShow(input: {
    reservationId?: unknown;
    reason?: unknown;
  }): Result<ReservationsSetupView> {
    return this.transition(
      input.reservationId,
      RESERVATION_STATUS_NO_SHOW,
      input.reason,
    );
  }

  fulfillReservation(input: {
    reservationId?: unknown;
    partialPickup?: unknown;
  }): Result<ReservationsSetupView> {
    if (input.partialPickup === true) {
      return err(RESERVATION_PARTIAL_UNSUPPORTED_ERROR);
    }
    return this.transition(
      input.reservationId,
      RESERVATION_STATUS_FULFILLED,
      'Retirada no recreio',
    );
  }

  peekActiveForSale(reservationId: unknown): Result<{
    id: string;
    linkedStudentId: string | null;
    items: Array<{ productId: string; quantity: number }>;
  }> {
    const reservation = this.activeReservation(reservationId);
    if (!reservation.ok) {
      return err(reservation.error);
    }
    return ok({
      id: reservation.data.id,
      linkedStudentId: reservation.data.linked_student_id || null,
      items: this.items
        .filter((item) => item.reservation_id === reservation.data.id)
        .map((item) => ({
          productId: item.product_id,
          quantity: Number(item.quantity),
        })),
    });
  }

  fulfillFromSale(reservationId: string): Result<void> {
    const moved = this.transition(
      reservationId,
      RESERVATION_STATUS_FULFILLED,
      'Retirada no recreio',
      RESERVATION_PAYMENT_PAID,
    );
    if (!moved.ok) {
      return err(moved.error);
    }
    return ok(undefined);
  }

  cancelForWalkInOverride(reservationId: string): Result<void> {
    const moved = this.transition(
      reservationId,
      RESERVATION_STATUS_CANCELLED,
      'Venda presencial com override',
    );
    if (!moved.ok) {
      return err(moved.error);
    }
    return ok(undefined);
  }

  updateReservation(input: {
    requestId?: unknown;
    reservationId?: unknown;
    studentNameText?: unknown;
    classroomText?: unknown;
    contactOptional?: unknown;
  }): Result<ReservationsSetupView> {
    const requestId = parseReservationRequestId(input.requestId);
    if (!requestId.ok) {
      return err(requestId.error);
    }
    const existing = this.operations.find(
      (item) => item.request_id === requestId.data,
    );
    if (existing) {
      if (existing.operation_type !== RESERVATION_UPDATE_OPERATION) {
        return err({
          code: 'REQUEST_CONFLICT',
          message: 'Este request_id já foi usado em outra operação.',
          retryable: false,
        });
      }
      return this.getSetup();
    }
    const reservation = this.activeReservation(input.reservationId);
    if (!reservation.ok) {
      return err(reservation.error);
    }
    const studentName = parseReservationName(input.studentNameText);
    if (!studentName.ok) {
      return err(studentName.error);
    }
    const classroom = parseClassroomText(input.classroomText);
    if (!classroom.ok) {
      return err(classroom.error);
    }
    const contact = parseOptionalContact(input.contactOptional);
    if (!contact.ok) {
      return err(contact.error);
    }
    const now = this.nowIso();
    this.reservations.push({
      ...reservation.data,
      student_name_text: studentName.data,
      requester_name: studentName.data,
      classroom_text: classroom.data,
      contact_optional: contact.data,
      updated_at: now,
    });
    this.operations.push({
      request_id: requestId.data,
      operation_type: RESERVATION_UPDATE_OPERATION,
      result_entity_id: reservation.data.id,
    });
    return this.getSetup();
  }

  linkStudent(input: {
    reservationId?: unknown;
    studentId?: unknown;
  }): Result<ReservationsSetupView> {
    const reservation = this.activeReservation(input.reservationId);
    if (!reservation.ok) {
      return err(reservation.error);
    }
    const studentId = parseImmutableId(input.studentId);
    if (!studentId.ok) {
      return err(studentId.error);
    }
    if (!this.roster) {
      return err(RESERVATION_STUDENT_NOT_FOUND_ERROR);
    }
    const student = this.roster.getStudent(studentId.data);
    if (!student.ok) {
      return err(RESERVATION_STUDENT_NOT_FOUND_ERROR);
    }
    if (!student.data.active) {
      return err(RESERVATION_STUDENT_INACTIVE_ERROR);
    }
    this.reservations.push({
      ...reservation.data,
      linked_student_id: student.data.id,
      updated_at: this.nowIso(),
    });
    return this.getSetup();
  }

  private activeReservation(reservationId: unknown): Result<ReservationRecord> {
    const id = parseImmutableId(reservationId);
    if (!id.ok) {
      return err(id.error);
    }
    const reservation = latestById(this.reservations).find(
      (item) => item.id === id.data,
    );
    if (!reservation) {
      return err(RESERVATION_NOT_FOUND_ERROR);
    }
    if (!isActiveReservationStatus(reservation.status)) {
      return err(RESERVATION_NOT_ACTIVE_ERROR);
    }
    return ok(reservation);
  }

  private transition(
    reservationId: unknown,
    nextStatus: string,
    reasonValue: unknown,
    paymentStatus?: string,
  ): Result<ReservationsSetupView> {
    const id = parseImmutableId(reservationId);
    if (!id.ok) {
      return err(id.error);
    }
    const reservation = latestById(this.reservations).find(
      (item) => item.id === id.data,
    );
    if (!reservation) {
      return err(RESERVATION_NOT_FOUND_ERROR);
    }
    if (!isActiveReservationStatus(reservation.status)) {
      return err(RESERVATION_NOT_ACTIVE_ERROR);
    }
    const reason = parseReservationReason(reasonValue);
    if (!reason.ok) {
      return err(reason.error);
    }
    const now = this.nowIso();
    this.reservations.push({
      ...reservation,
      status: nextStatus,
      payment_status: paymentStatus || reservation.payment_status,
      updated_at: now,
    });
    this.history.push({
      id: this.createId(),
      reservation_id: reservation.id,
      from_status: reservation.status,
      to_status: nextStatus,
      actor_id: LOCAL_ACTOR_ID,
      created_at: now,
      reason: reason.data,
    });
    return this.getSetup();
  }

  private uniquePublicCode(): string {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = createPublicCode();
      const taken = latestById(this.reservations).some(
        (item) => item.public_code === code,
      );
      if (!taken) {
        return code;
      }
    }
    return createPublicCode();
  }

  private toSlot(slot: SlotRecord, nowIso: string): ReservationSlotView {
    return {
      id: slot.id,
      businessDate: slot.business_date,
      label: slot.label,
      cutoffAt: slot.cutoff_at,
      pickupStartsAt: slot.pickup_starts_at,
      pickupEndsAt: slot.pickup_ends_at,
      active: slot.active === 'true',
      openForReservations:
        slot.active === 'true' && slotIsOpen(slot.cutoff_at, nowIso),
      summaryLabel: slotSummaryLabel({
        label: slot.label,
        cutoffAt: slot.cutoff_at,
        pickupStartsAt: slot.pickup_starts_at,
        pickupEndsAt: slot.pickup_ends_at,
      }),
    };
  }

  private toReservation(reservation: ReservationRecord): ReservationView {
    const slot = latestById(this.slots).find(
      (item) => item.id === reservation.slot_id,
    );
    const items = this.items
      .filter((item) => item.reservation_id === reservation.id)
      .map((item) => ({
        productId: item.product_id,
        productName: item.description_snapshot,
        quantity: Number(item.quantity),
        unitPriceCents: Number(item.unit_price_cents),
        lineTotalCents: Number(item.line_total_cents),
      }));
    const slotLabel = slot?.label ?? '';
    const linkedStudentId = reservation.linked_student_id || null;
    let linkedStudentLabel = '';
    if (linkedStudentId && this.roster) {
      const student = this.roster.getStudent(linkedStudentId);
      if (student.ok) {
        linkedStudentLabel = linkedReservationStudentLabel(
          student.data.fullName,
          student.data.ageLabel,
        );
      }
    }
    return {
      id: reservation.id,
      publicCode: reservation.public_code,
      publicCodeLabel: publicReservationCodeLabel(reservation.public_code),
      slotId: reservation.slot_id,
      slotLabel,
      studentNameText: reservation.student_name_text,
      classroomText: reservation.classroom_text,
      contactOptional: reservation.contact_optional,
      linkedStudentId,
      linkedStudentLabel,
      status: reservation.status,
      paymentStatus: reservation.payment_status,
      totalCents: Number(reservation.total_cents),
      summaryLabel: reservationSummaryLabel({
        studentName: reservation.student_name_text,
        classroomText: reservation.classroom_text,
        itemNames: items.map((item) => item.productName),
        totalCents: Number(reservation.total_cents),
        slotLabel,
        status: reservation.status,
      }),
      items,
      createdAt: reservation.created_at,
    };
  }
}
