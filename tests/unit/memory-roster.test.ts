import { describe, expect, it } from 'vitest';
import { MemoryRoster } from '../../src/server/students/memory-roster';

describe('MemoryRoster classroom and guardian deactivate', () => {
  it('renames a classroom and refuses deactivate while students are enrolled', () => {
    const roster = new MemoryRoster(() => '2026-08-14T13:00:00.000Z');
    roster.ensureDemoRoster();
    const classrooms = roster.listClassrooms();
    if (!classrooms.ok) {
      throw new Error('turmas ausentes');
    }
    const third = classrooms.data.find((item) => item.name === '3º A');
    if (!third) {
      throw new Error('3º A ausente');
    }
    const renamed = roster.updateClassroom(third.id, '3º A manhã');
    expect(renamed.ok).toBe(true);
    if (!renamed.ok) {
      return;
    }
    expect(renamed.data.name).toBe('3º A manhã');
    const refused = roster.deactivateClassroom(third.id);
    expect(refused.ok).toBe(false);
    if (refused.ok) {
      return;
    }
    expect(refused.error.code).toBe('CLASSROOM_HAS_ACTIVE_STUDENTS');
  });

  it('deactivates an empty classroom', () => {
    const roster = new MemoryRoster(() => '2026-08-14T13:00:00.000Z');
    roster.ensureDemoRoster();
    const years = roster.listSchoolYears();
    if (!years.ok || !years.data[0]) {
      throw new Error('ano letivo ausente');
    }
    const created = roster.createClassroom({
      schoolYearId: years.data[0].id,
      name: '6º D',
    });
    if (!created.ok) {
      throw new Error('não criou turma vazia');
    }
    const result = roster.deactivateClassroom(created.data.id);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.active).toBe(false);
  });

  it('deactivates a guardian without removing the record', () => {
    const roster = new MemoryRoster(() => '2026-08-14T13:00:00.000Z');
    const created = roster.createGuardian({
      fullName: 'Carla Mendes',
      relationLabel: 'tia',
    });
    if (!created.ok) {
      throw new Error('não criou responsável');
    }
    const result = roster.deactivateGuardian(created.data.id);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.active).toBe(false);
    const again = roster.deactivateGuardian(created.data.id);
    expect(again.ok).toBe(false);
    if (again.ok) {
      return;
    }
    expect(again.error.code).toBe('GUARDIAN_ALREADY_INACTIVE');
  });
});
