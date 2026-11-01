import { z } from 'zod';

export const attributeValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
function isValidPartialDate(value: string): boolean {
  if (/^\d{4}$/.test(value)) return Number(value) >= 1;
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(value);
  if (monthMatch) return Number(monthMatch[1]) >= 1 && Number(monthMatch[2]) >= 1 && Number(monthMatch[2]) <= 12;
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!dateMatch) return false;
  const year = Number(dateMatch[1]), month = Number(dateMatch[2]), day = Number(dateMatch[3]);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return year >= 1 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
export const partialDateSchema = z.string().refine(isValidPartialDate, 'Expected YYYY, YYYY-MM, or a valid YYYY-MM-DD date');

function partialDateBounds(value: string): { start: string; end: string } {
  if (/^\\d{4}$/.test(value)) return { start: value + '-01-01', end: value + '-12-31' };
  if (/^\\d{4}-\\d{2}$/.test(value)) {
    const [year, month] = value.split('-').map(Number);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    return { start: value + '-01', end: value + '-' + String(days).padStart(2, '0') };
  }
  return { start: value, end: value };
}

export function isDefinitelyBefore(first: string, second: string): boolean {
  return partialDateBounds(first).end < partialDateBounds(second).start;
}
const isoDateSchema = partialDateSchema;
export const genderSchema = z.enum(['female', 'male', 'nonbinary']).nullable().default(null);
export const nameHistorySchema = z.object({
  id: z.string().min(1),
  previousName: z.string().min(1),
  newName: z.string().min(1),
  effectiveDate: z.unknown().optional(),
  partnershipId: z.string().min(1),
}).transform(({ effectiveDate: _legacyEffectiveDate, ...entry }) => entry);
export const personSchema = z.object({
  id: z.string().min(1),
  name: z.string().default(''),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  manualIncomplete: z.boolean().optional(),
  gender: genderSchema,
  nameHistory: z.array(nameHistorySchema).default([]),
  birthDate: isoDateSchema.nullable().default(null),
  deathDate: isoDateSchema.nullable().default(null),
  attributes: z.record(z.string(), attributeValueSchema).default({}),
  displayAttribute: z.string().nullable().default(null),
});
export const parentageTypeSchema = z.enum(['biological_parent', 'adoptive_parent', 'step_parent', 'guardian']);
export const parentageSchema = z.object({
  id: z.string().min(1), type: parentageTypeSchema,
  parentId: z.string().min(1), childId: z.string().min(1),
  manualIncomplete: z.boolean().optional(),
});
export const partnershipTypeSchema = z.enum(['marriage', 'partnership']);
export const partnershipNameChangeSchema = z.object({
  personId: z.string().min(1),
  previousName: z.string().min(1),
  newName: z.string().min(1),
  effectiveDate: z.unknown().optional(),
}).transform(({ effectiveDate: _legacyEffectiveDate, ...change }) => change);
export const partnershipSchema = z.object({
  id: z.string().min(1), type: partnershipTypeSchema,
  person1Id: z.string().min(1), person2Id: z.string().min(1),
  startDate: isoDateSchema.nullable().default(null), endDate: isoDateSchema.nullable().default(null),
  nameChanges: z.array(partnershipNameChangeSchema).default([]),
  manualIncomplete: z.boolean().optional(),
});
export const pointSchema = z.object({ x: z.number(), y: z.number() });
export const projectSchema = z.object({
  schemaVersion: z.literal(1), id: z.string().min(1), name: z.string().default('My family'),
  people: z.array(personSchema).default([]),
  parentage: z.array(parentageSchema).default([]),
  partnerships: z.array(partnershipSchema).default([]),
  layout: z.object({ manualPositions: z.record(z.string(), pointSchema).default({}) }).default({ manualPositions: {} }),
  updatedAt: z.string(),
});
export type Person = z.infer<typeof personSchema>;
export type Parentage = z.infer<typeof parentageSchema>;
export type ParentageType = z.infer<typeof parentageTypeSchema>;
export type Partnership = z.infer<typeof partnershipSchema>;
export type PartnershipType = z.infer<typeof partnershipTypeSchema>;
export type PartnershipNameChange = z.infer<typeof partnershipNameChangeSchema>;
export type NameHistoryEntry = z.infer<typeof nameHistorySchema>;
export type Gender = z.infer<typeof genderSchema>;
export type Project = z.infer<typeof projectSchema>;
export type AttributeValue = z.infer<typeof attributeValueSchema>;

export function createEmptyProject(): Project {
  return {
    schemaVersion: 1, id: crypto.randomUUID(), name: 'My family',
    people: [], parentage: [], partnerships: [],
    layout: { manualPositions: {} }, updatedAt: new Date().toISOString(),
  };
}
