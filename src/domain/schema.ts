import { z } from 'zod';

export const attributeValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const isoDateSchema = z.string().refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, 'Expected a valid calendar date in YYYY-MM-DD format');
export const personSchema = z.object({
  id: z.string().min(1),
  name: z.string().default(''),
  birthDate: isoDateSchema.nullable().default(null),
  deathDate: isoDateSchema.nullable().default(null),
  attributes: z.record(z.string(), attributeValueSchema).default({}),
  displayAttribute: z.string().nullable().default(null),
});
export const parentageTypeSchema = z.enum(['biological_parent', 'adoptive_parent', 'step_parent', 'guardian']);
export const parentageSchema = z.object({
  id: z.string().min(1), type: parentageTypeSchema,
  parentId: z.string().min(1), childId: z.string().min(1),
});
export const partnershipTypeSchema = z.enum(['marriage', 'partnership']);
export const partnershipSchema = z.object({
  id: z.string().min(1), type: partnershipTypeSchema,
  person1Id: z.string().min(1), person2Id: z.string().min(1),
  startDate: isoDateSchema.nullable().default(null), endDate: isoDateSchema.nullable().default(null),
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
export type Project = z.infer<typeof projectSchema>;
export type AttributeValue = z.infer<typeof attributeValueSchema>;

export function createEmptyProject(): Project {
  return {
    schemaVersion: 1, id: crypto.randomUUID(), name: 'My family',
    people: [], parentage: [], partnerships: [],
    layout: { manualPositions: {} }, updatedAt: new Date().toISOString(),
  };
}