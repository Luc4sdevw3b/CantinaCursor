import { describe, expect, it } from 'vitest';
import { needsGuardian, studentAgeYears } from '../../src/domain/age';
import {
  planGuardianLink,
  siblingStudentIds,
} from '../../src/domain/guardian-link';
import { validateGuardianProfile } from '../../src/domain/guardian-profile';
import {
  planSiblingAuthorization,
  resolveSaleCharge,
} from '../../src/domain/sibling-authorization';

const ANA = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000001';
const BRUNO = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000002';
const CARLA = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000003';
const MARIA = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000011';
const PAULO = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000012';
const USER = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000099';

describe('guardians and siblings', () => {
  it('requires a name and stores WhatsApp as a flag', () => {
    expect(validateGuardianProfile({ fullName: ' ' }).ok).toBe(false);
    expect(
      validateGuardianProfile({
        fullName: 'Maria Souza',
        phone: '(11) 99999-0001',
        whatsappEnabled: true,
        relationLabel: 'mãe',
      }),
    ).toEqual({
      ok: true,
      data: {
        full_name: 'Maria Souza',
        phone: '11999990001',
        whatsapp_enabled: 'true',
        relation_label: 'mãe',
      },
    });
  });

  it('makes the first guardian primary and lists siblings who share one', () => {
    const first = planGuardianLink({
      studentId: ANA,
      guardianId: MARIA,
      isPrimary: false,
      createdAt: '2026-08-13T16:00:00.000Z',
      createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-000000000021',
      existing: [],
    });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.data.link.is_primary).toBe('true');

    const bruno = planGuardianLink({
      studentId: BRUNO,
      guardianId: MARIA,
      isPrimary: true,
      createdAt: '2026-08-13T16:00:00.000Z',
      createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-000000000022',
      existing: [first.data.link],
    });
    expect(bruno.ok).toBe(true);
    if (!bruno.ok) {
      return;
    }
    expect(siblingStudentIds([first.data.link, bruno.data.link], ANA)).toEqual([
      BRUNO,
    ]);
  });

  it('keeps credit flags when the same link is saved again as primary', () => {
    const created = planGuardianLink({
      studentId: ANA,
      guardianId: MARIA,
      isPrimary: true,
      canUseGuardianCredit: true,
      autoSettle: true,
      createdAt: '2026-08-13T16:00:00.000Z',
      createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-000000000021',
      existing: [],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const again = planGuardianLink({
      studentId: ANA,
      guardianId: MARIA,
      isPrimary: true,
      createdAt: '2026-08-13T16:00:00.000Z',
      createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-000000000099',
      existing: [created.data.link],
    });
    expect(again.ok).toBe(true);
    if (!again.ok) {
      return;
    }
    expect(again.data.link.can_use_guardian_credit).toBe('true');
    expect(again.data.link.auto_settle_debt_from_guardian_credit).toBe('true');
  });

  it('authorizes siblings separately from non-siblings', () => {
    const links = [
      planGuardianLink({
        studentId: ANA,
        guardianId: MARIA,
        isPrimary: true,
        createdAt: '2026-08-13T16:00:00.000Z',
        createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-000000000021',
        existing: [],
      }),
      planGuardianLink({
        studentId: BRUNO,
        guardianId: MARIA,
        isPrimary: true,
        createdAt: '2026-08-13T16:00:00.000Z',
        createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-000000000022',
        existing: [],
      }),
      planGuardianLink({
        studentId: CARLA,
        guardianId: PAULO,
        isPrimary: true,
        createdAt: '2026-08-13T16:00:00.000Z',
        createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-000000000023',
        existing: [],
      }),
    ].flatMap((result) => (result.ok ? [result.data.link] : []));

    const allowed = planSiblingAuthorization({
      consumerStudentId: BRUNO,
      accountStudentId: ANA,
      canChargeAccount: true,
      canUseAccountCredit: false,
      createdBy: USER,
      authorizedAt: '2026-08-13T16:00:00.000Z',
      createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-000000000031',
      links,
    });
    expect(allowed.ok).toBe(true);

    const refused = planSiblingAuthorization({
      consumerStudentId: CARLA,
      accountStudentId: ANA,
      canChargeAccount: true,
      canUseAccountCredit: false,
      createdBy: USER,
      authorizedAt: '2026-08-13T16:00:00.000Z',
      createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-000000000032',
      links,
    });
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.error.code).toBe('NOT_SIBLINGS');
    }
  });

  it('asks for a guardian when the student is younger than the setting', () => {
    const age = studentAgeYears({
      birthDate: '2016-03-10',
      approximateAge: '',
      approximateAgeReferenceYear: '',
      todayCivil: '2026-08-13',
    });
    expect(age).toEqual({ ok: true, data: 10 });
    if (age.ok) {
      expect(needsGuardian(age.data, 18, false)).toBe(true);
      expect(needsGuardian(age.data, 18, true)).toBe(false);
      expect(needsGuardian(age.data, 8, false)).toBe(false);
    }
  });

  it('lets a sibling charge another account only with directional authorization', () => {
    const authorization = {
      consumerStudentId: BRUNO,
      accountStudentId: ANA,
      canChargeAccount: true,
      canUseAccountCredit: false,
      active: true,
    };
    expect(
      resolveSaleCharge({
        consumerStudentId: BRUNO,
        chargedStudentId: ANA,
        authorizations: [authorization],
      }),
    ).toEqual({
      ok: true,
      data: { chargedStudentId: ANA, useAccountCredit: false },
    });
    expect(
      resolveSaleCharge({
        consumerStudentId: ANA,
        chargedStudentId: BRUNO,
        authorizations: [authorization],
      }).ok,
    ).toBe(false);
    expect(
      resolveSaleCharge({
        consumerStudentId: BRUNO,
        authorizations: [authorization],
      }),
    ).toEqual({
      ok: true,
      data: { chargedStudentId: BRUNO, useAccountCredit: true },
    });
  });
});
