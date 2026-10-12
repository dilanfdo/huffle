export const CLOUDKIT_CONTAINER_ID = 'iCloud.app.nexusdigitallabs.huffle';
export const CLOUDKIT_ZONE = 'Huffle';

export type CloudKitFieldMap = Record<string, { type: 'string' | 'number'; value: string | number }>;

export type CloudKitRecordLike = {
  recordType: string;
  recordName: string;
  changeTag?: string;
  zoneName?: string;
  fields: CloudKitFieldMap;
};

function fieldString(fields: CloudKitFieldMap, key: string): string {
  const value = fields[key]?.value;
  return value === undefined || value === null ? '' : String(value);
}

function fieldNumber(fields: CloudKitFieldMap, key: string): number {
  const value = fields[key]?.value;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function optionalString(value: string): string | null {
  return value.length === 0 ? null : value;
}

export function stringField(value: string | null): { type: 'string'; value: string } {
  return { type: 'string', value: value ?? '' };
}

export function numberField(value: number): { type: 'number'; value: number } {
  return { type: 'number', value };
}

export function readFields(record: { fields?: CloudKitFieldMap }): CloudKitFieldMap {
  return record.fields ?? {};
}

export { fieldString, fieldNumber, optionalString };
