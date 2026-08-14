import { describe, expect, it } from 'vitest';
import { FakeAppApi } from '../../src/web/shared/fake-app-api';
import { createRequestId } from '../../src/domain/request-id';

describe('reservas', () => {
  it('holds reserved quantity without changing physical stock and is idempotent', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const setup = await api.getReservationsSetup();
    const slot = setup.slots.find((item) => item.label === 'Recreio tarde');
    const coxinha = setup.reservableProducts.find(
      (item) => item.name === 'Coxinha',
    );
    if (!slot || !coxinha) {
      throw new Error('seed de reserva ausente');
    }
    const requestId = createRequestId();
    const first = await api.createReservation({
      requestId,
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    expect(first.reservations[0]?.summaryLabel).toBe(
      'Ana Souza • 3º A • Coxinha • R$ 5,50 • Recreio tarde • reservada',
    );
    expect(
      first.availability.find((item) => item.productName === 'Coxinha')
        ?.summaryLabel,
    ).toBe('Coxinha • disponível 9 • reservado 1');
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(10);

    const replay = await api.createReservation({
      requestId,
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    expect(
      replay.availability.find((item) => item.productName === 'Coxinha')
        ?.reservedQuantity,
    ).toBe(1);
    expect(replay.reservations[0]?.id).toBe(first.reservations[0]?.id);
  });

  it('refuses a second reservation of the last available unit and a morning cutoff', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const setup = await api.getReservationsSetup();
    const afternoon = setup.slots.find(
      (item) => item.label === 'Recreio tarde',
    );
    const morning = setup.slots.find((item) => item.label === 'Recreio manhã');
    const coxinha = setup.reservableProducts.find(
      (item) => item.name === 'Coxinha',
    );
    if (!afternoon || !morning || !coxinha) {
      throw new Error('seed de reserva ausente');
    }
    await api.createReservation({
      requestId: createRequestId(),
      slotId: afternoon.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 10 }],
    });
    await expect(
      api.createReservation({
        requestId: createRequestId(),
        slotId: afternoon.id,
        studentNameText: 'Bruno Lima',
        classroomText: '3º A',
        items: [{ productId: coxinha.id, quantity: 1 }],
      }),
    ).rejects.toThrow('disponibilidade suficiente');
    await expect(
      api.createReservation({
        requestId: createRequestId(),
        slotId: morning.id,
        studentNameText: 'Ana Souza',
        classroomText: '3º A',
        items: [{ productId: coxinha.id, quantity: 1 }],
      }),
    ).rejects.toThrow('corte deste recreio já passou');
  });

  it('releases reserved quantity on cancel, no-show and fulfill, and forbids prepared/partial', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const setup = await api.getReservationsSetup();
    const slot = setup.slots.find((item) => item.label === 'Recreio tarde');
    const coxinha = setup.reservableProducts.find(
      (item) => item.name === 'Coxinha',
    );
    if (!slot || !coxinha) {
      throw new Error('seed de reserva ausente');
    }
    await expect(
      api.createReservation({
        requestId: createRequestId(),
        slotId: slot.id,
        studentNameText: 'Ana Souza',
        classroomText: '3º A',
        status: 'prepared',
        items: [{ productId: coxinha.id, quantity: 1 }],
      } as never),
    ).rejects.toThrow('Não existe estado Preparada');

    const created = await api.createReservation({
      requestId: createRequestId(),
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    const reservation = created.reservations[0];
    if (!reservation) {
      throw new Error('reserva ausente');
    }
    await expect(
      api.fulfillReservation({
        reservationId: reservation.id,
        partialPickup: true,
      } as never),
    ).rejects.toThrow('retirada parcial');

    await api.cancelReservation({
      reservationId: reservation.id,
      reason: 'Pedido duplicado',
    });
    expect(
      (await api.getReservationsSetup()).availability.find(
        (item) => item.productName === 'Coxinha',
      )?.reservedQuantity,
    ).toBe(0);

    const second = await api.createReservation({
      requestId: createRequestId(),
      slotId: slot.id,
      studentNameText: 'Bruno Lima',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    await api.markReservationNoShow({
      reservationId: second.reservations[0]?.id ?? '',
      reason: 'Não apareceu no recreio',
    });
    const third = await api.createReservation({
      requestId: createRequestId(),
      slotId: slot.id,
      studentNameText: 'Carla Dias',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    const fulfilled = await api.fulfillReservation({
      reservationId: third.reservations[0]?.id ?? '',
    });
    expect(fulfilled.reservations[0]?.status).toBe('fulfilled');
    expect(
      fulfilled.availability.find((item) => item.productName === 'Coxinha')
        ?.reservedQuantity,
    ).toBe(0);
  });

  it('lets staff create a reservation but not a slot', async () => {
    const staff = new FakeAppApi();
    await staff.loginE2E('staff');
    await expect(
      staff.createReservationSlot({
        label: 'Recreio extra',
        cutoffTime: '17:00',
        pickupStartTime: '17:10',
        pickupEndTime: '17:30',
      }),
    ).rejects.toThrow('FORBIDDEN');
    const setup = await staff.getReservationsSetup();
    const slot = setup.slots.find((item) => item.label === 'Recreio tarde');
    const coxinha = setup.reservableProducts.find(
      (item) => item.name === 'Coxinha',
    );
    if (!slot || !coxinha) {
      throw new Error('seed de reserva ausente');
    }
    const created = await staff.createReservation({
      requestId: createRequestId(),
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    expect(created.reservations[0]?.status).toBe('reserved');
  });

  it('creates a public reservation without login and labels Suco as ACABOU', async () => {
    const api = new FakeAppApi();
    const portal = await api.getPublicReservationPortal();
    expect(
      portal.products.find((item) => item.name === 'Suco de uva')?.summaryLabel,
    ).toBe('Suco de uva • R$ 4,00 • ACABOU');
    expect(
      portal.products.find((item) => item.name === 'Coxinha')?.summaryLabel,
    ).toBe('Coxinha • R$ 5,50 • disponível 10');
    expect(JSON.stringify(portal)).not.toContain('Ana Souza');
    const slot = portal.slots.find((item) => item.label === 'Recreio tarde');
    const coxinha = portal.products.find((item) => item.name === 'Coxinha');
    if (!slot || !coxinha) {
      throw new Error('portal público local incompleto');
    }
    const created = await api.createPublicReservation({
      requestId: createRequestId(),
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      contactOptional: '11999990000',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    expect(created.publicCode).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(created.publicCodeLabel).toBe(`Código ${created.publicCode}`);
    expect(created.summaryLabel).toBe(
      'Ana Souza • 3º A • Coxinha • R$ 5,50 • Recreio tarde • reservada',
    );
    await expect(
      api.createPublicReservation({
        requestId: createRequestId(),
        slotId: slot.id,
        studentNameText: 'Ana Souza',
        classroomText: '3º A',
        website: 'bot',
        items: [{ productId: coxinha.id, quantity: 1 }],
      }),
    ).rejects.toThrow('RESERVATION_REJECTED');
  });

  it('lets the owner update, link, produce and fulfill without changing physical stock', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('owner');
    const setup = await api.getReservationsSetup();
    const slot = setup.slots.find((item) => item.label === 'Recreio tarde');
    const coxinha = setup.reservableProducts.find(
      (item) => item.name === 'Coxinha',
    );
    const ana = (await api.listStudents()).find(
      (item) => item.fullName === 'Ana Souza' && item.ageLabel === '~8',
    );
    if (!slot || !coxinha || !ana) {
      throw new Error('seed da fila da dona ausente');
    }
    const created = await api.createReservation({
      requestId: createRequestId(),
      slotId: slot.id,
      studentNameText: 'Ana Souza',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    const reservation = created.reservations[0];
    if (!reservation) {
      throw new Error('reserva ausente');
    }
    expect(created.production[0]?.summaryLabel).toBe('Coxinha • 1');
    const updateRequestId = createRequestId();
    const updated = await api.updateReservation({
      requestId: updateRequestId,
      reservationId: reservation.id,
      studentNameText: 'Ana Souza',
      classroomText: '4º B',
      contactOptional: '11999990000',
    });
    expect(updated.reservations[0]?.summaryLabel).toBe(
      'Ana Souza • 4º B • Coxinha • R$ 5,50 • Recreio tarde • reservada',
    );
    expect(updated.reservations[0]?.contactOptional).toBe('11999990000');
    const replay = await api.updateReservation({
      requestId: updateRequestId,
      reservationId: reservation.id,
      studentNameText: 'Ana Souza',
      classroomText: '5º C',
    });
    expect(replay.reservations[0]?.classroomText).toBe('4º B');
    const linked = await api.linkReservationStudent({
      reservationId: reservation.id,
      studentId: ana.id,
    });
    expect(linked.reservations[0]?.studentNameText).toBe('Ana Souza');
    expect(linked.reservations[0]?.linkedStudentLabel).toBe(
      'vinculada a Ana Souza • ~8',
    );
    const fulfilled = await api.fulfillReservation({
      reservationId: reservation.id,
    });
    expect(fulfilled.reservations[0]?.status).toBe('fulfilled');
    expect(fulfilled.reservations[0]?.summaryLabel).toContain('retirada');
    expect(fulfilled.production).toEqual([]);
    expect(
      fulfilled.availability.find((item) => item.productName === 'Coxinha')
        ?.reservedQuantity,
    ).toBe(0);
    expect(
      (await api.listInventoryBalances()).items.find(
        (item) => item.productName === 'Coxinha',
      )?.physicalQuantity,
    ).toBe(10);
    await expect(
      api.updateReservation({
        requestId: createRequestId(),
        reservationId: reservation.id,
        studentNameText: 'Ana Souza',
        classroomText: '4º B',
      }),
    ).rejects.toThrow('já foi encerrada');
  });

  it('lets staff deliver a reservation', async () => {
    const api = new FakeAppApi();
    await api.loginE2E('staff');
    const setup = await api.getReservationsSetup();
    const slot = setup.slots.find((item) => item.label === 'Recreio tarde');
    const coxinha = setup.reservableProducts.find(
      (item) => item.name === 'Coxinha',
    );
    if (!slot || !coxinha) {
      throw new Error('seed de reserva ausente');
    }
    const created = await api.createReservation({
      requestId: createRequestId(),
      slotId: slot.id,
      studentNameText: 'Bruno Lima',
      classroomText: '3º A',
      items: [{ productId: coxinha.id, quantity: 1 }],
    });
    const fulfilled = await api.fulfillReservation({
      reservationId: created.reservations[0]?.id ?? '',
    });
    expect(fulfilled.reservations[0]?.status).toBe('fulfilled');
  });
});
