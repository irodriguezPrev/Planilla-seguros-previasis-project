import assert from 'node:assert';
import { calculateActuarialAge } from './age.utils';

type Case = [string, string | Date, number | null];

const cases: Case[] = [
  // Usuario: cumple en noviembre, tiene 28 -> debe ser 29 (regla <= 6 meses).
  ['1997-11-15', '2026-05-15', 29], // frontera exacta: 15/05 -> 15/11 = 6 meses exactos
  ['1997-11-15', '2026-05-16', 29], // dentro de los 6 meses
  ['1997-11-15', '2026-05-14', 28], // 1 día después de la frontera -> 28
  ['1997-11-15', '2026-04-01', 28], // > 6 meses
  ['1997-11-15', '2026-09-30', 29], // escenario/fecha de hoy del entorno
  ['1997-11-15', '2026-11-14', 29], // día antes del cumpleaños
  ['1997-11-15', '2026-11-15', 29], // día del cumpleaños -> no salta a 30
  ['1997-11-15', '2026-11-16', 29], // justo después del cumpleaños (próximo está a ~12 meses -> 29)
  ['1997-11-15', '2026-12-01', 29], // fin de año -> 29
  // Independencia de la hora del día (regla <= 6 meses por fecha, no por hora).
  ['1997-11-15', new Date(2026, 4, 16, 0, 0, 0, 0), 29],
  ['1997-11-15', new Date(2026, 4, 16, 23, 59, 59, 999), 29],
  // 29/02 en año no bisiesto: la anualidad cae al 1/3 y no debe romperse.
  ['2000-02-29', '2026-08-15', 26],
  ['2000-02-29', '2027-08-15', 27],
  // Fechas inválidas / futuras.
  ['not-a-date', '2026-01-01', null],
  ['', '2026-01-01', null],
  ['2030-01-01', '2026-01-01', null], // nacimiento en el futuro
];

for (const [birthDate, reference, expected] of cases) {
  const result = calculateActuarialAge(birthDate, reference);
  assert.strictEqual(
    result,
    expected,
    `calculateActuarialAge(${JSON.stringify(birthDate)}, ${JSON.stringify(reference)}) = ${result}, se esperaba ${expected}`,
  );
}

assert.strictEqual(calculateActuarialAge('2000-02-29', '2024-02-29'), 24); // cumple el mismo día (2024 bisiesto)
