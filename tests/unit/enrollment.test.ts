import { describe, expect, it } from 'vitest';
import { planEnrollment } from '../../src/domain/enrollment';

const STUDENT = 'aaaaaaaa-bbbb-4ccc-8ddd-111111111111';
const CLASS_A = 'aaaaaaaa-bbbb-4ccc-8ddd-222222222222';
const CLASS_B = 'aaaaaaaa-bbbb-4ccc-8ddd-333333333333';
const USER = 'aaaaaaaa-bbbb-4ccc-8ddd-444444444444';

describe('enrollment history', () => {
  it('closes the current classroom before opening another', () => {
    const current = {
      id: 'aaaaaaaa-bbbb-4ccc-8ddd-555555555555',
      student_id: STUDENT,
      classroom_id: CLASS_A,
      started_on: '2026-02-01',
      ended_on: '',
      created_by: USER,
      created_at: '2026-02-01T12:00:00.000Z',
    };

    const planned = planEnrollment({
      studentId: STUDENT,
      classroomId: CLASS_B,
      startedOn: '2026-08-13',
      createdBy: USER,
      createdAt: '2026-08-13T12:00:00.000Z',
      createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-666666666666',
      existing: [current],
    });

    expect(planned.ok).toBe(true);
    if (planned.ok) {
      expect(planned.data.close).toEqual({
        ...current,
        ended_on: '2026-08-13',
      });
      expect(planned.data.open.classroom_id).toBe(CLASS_B);
      expect(planned.data.open.ended_on).toBe('');
    }
  });

  it('refuses a sheet row number as student identity', () => {
    const planned = planEnrollment({
      studentId: '2',
      classroomId: CLASS_A,
      startedOn: '2026-08-13',
      createdBy: USER,
      createdAt: '2026-08-13T12:00:00.000Z',
      createId: () => 'aaaaaaaa-bbbb-4ccc-8ddd-666666666666',
      existing: [],
    });

    expect(planned.ok).toBe(false);
    if (!planned.ok) {
      expect(planned.error.code).toBe('INVALID_ID');
    }
  });
});
