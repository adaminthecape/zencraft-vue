import {
  dbPagination,
  fields,
  item,
  Archetype,
  CustomItem,
  AccessRole,
  Block,
  Module,
  Page,
  Blueprint,
  sharedTypes,
  utils,
} from 'zencraft-core';
import { QTableProps } from 'quasar';

export type ItemHandlerType = (
  item.ItemHandler |
  fields.Field |
  Block.BlockHandler |
  Module.ModuleHandler |
  Page.PageHandler |
  Archetype.ArchetypeHandler |
  Blueprint.BlueprintHandler |
  AccessRole.AccessRoleHandler |
  CustomItem.CustomHandler
);

/**
 * Essentially part of the Quasar validation opts, to be used with Quasar inputs
 */
type FieldDisplayOpts = {
  name: string;
  label: string;
  /**
   * Data property of the result object which should contain the field value
   * or a function which returns the field value (?)
   * @param row The current row being processed
   * @returns Value for this column
   */
  field: string | ((row: any) => any);
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  sort?: (a: any, b: any, rowA: any, rowB: any) => number;
  rawSort?: (a: any, b: any, rowA: any, rowB: any) => number;
  sortOrder?: 'ad' | 'da';
  /**
   * Function you can apply to format your data
   * @param val Value of the cell
   * @param row Full Row object in which the cell is contained
   * @returns The resulting formatted value
   */
  format?: (val: any, row: any) => any;
  style?: string | ((row: any) => string);
  classes?: string | ((row: any) => string);
  headerStyle?: string;
  headerClasses?: string;
}

/**
 * Convert a timestamp (as string or number) to a JS Date object.
 * TODO: Move to adam-utils
 * @param val
 * @returns
 */
export function transformSecondsToDate(val: number | unknown): Date | undefined
{
  val = utils.genericUtils.toNumber(val) ?? val;

  if(!(
    typeof val === 'number' &&
    Number.isInteger(val)
  ))
  {
    return undefined;
  }

  return new Date(val * 1000);
}

/**
 * Based on the search results and their item type, determines which fields to
 * show in a result table, and returns a list of them.
 * @param opts
 * @returns Columns to show in your table
 */
export function getTableColumns(opts: {
  results: Record<string, unknown>;
  exclude?: string[];
  knownFields?: fields.FieldData[];
}): Array<FieldDisplayOpts>
{
  const { results, exclude, knownFields } = opts;

  const shouldExclude = (
    !Array.isArray(exclude) ?
      () => false :
      (name: string) => (
        exclude.includes(name)
      )
  );

  const timestampToDate = (val: number | unknown) => (
    transformSecondsToDate(val)?.toISOString() || ''
  );

  const itemDefaultFields = [
    {
      name: 'id',
      label: 'ID',
      field: 'id',
      format: (val: string) => (val ? val.split('-').shift() : undefined)
    },
    {
      name: 'typeId',
      label: 'Type',
      field: 'typeId'
    },
    {
      name: 'createdBy',
      label: 'Author',
      field: 'createdBy'
    },
    {
      name: 'createdAt',
      label: 'Created',
      field: 'createdAt',
      format: timestampToDate
    },
    {
      name: 'updatedAt',
      label: 'Updated',
      field: 'updatedAt',
      format: timestampToDate
    }
  ].filter((field) => (!shouldExclude(field.name)));

  const actionFields = [
    { name: 'actions', label: 'Actions', field: '_actions' }
  ];

  const excludeFields: string[] = [
    ...itemDefaultFields,
    ...actionFields
  ].map(({ name }) => name);

  const itemsToAdd = [];

  if(!knownFields)
  {
    const foundFields: string[] = [];

    Object.values(results || {}).forEach((result) =>
    {
      Object.keys(result).forEach((key) =>
      {
        if(
          !foundFields.includes(key) &&
          !excludeFields.includes(key) &&
          !shouldExclude(key)
        )
        {
          foundFields.push(key);
        }
      });
    });

    itemsToAdd.push(...foundFields.map((f) => ({ name: f, label: f, field: f })));
  }
  else
  {
    // map the fields to columns
    const fieldsAsColumns = knownFields.map((field) =>
    {
      const col: FieldDisplayOpts = {
        name: field.key || field.id,
        label: field.label || field.key || field.id,
        field: field.key || field.id,
        align: 'left',
        sortable: field.isSearchable ?? undefined,
      };

      if(field.fieldType === fields.FieldType.timestamp)
      {
        col.format = timestampToDate;
      }

      return col;
    });

    itemsToAdd.push(...fieldsAsColumns);
  }

  return [
    ...itemDefaultFields,
    ...itemsToAdd,
    ...actionFields
  ].map((x: any) =>
  {
    x.align = 'left';

    return x;
  });
}

/**
 * Fields which can be added to a table for any item type
 */
export const defaultItemFields: Record<string, fields.FieldData> = {
  id: {
    id: 'c0ffa4ee-2c19-41f9-94f9-a4ea1c6271fc',
    key: 'id',
    label: 'ID',
    typeId: sharedTypes.KnownItemType.Field,
    fieldType: fields.FieldType.readonly
  }
};

/** Convert QTableProps['pagination'] into DbPaginationOpts */
export function convertPaginationFromQuasar(
  quasarPagination: QTableProps['pagination']
): dbPagination.DbPaginationOpts
{
  const internalPagination: dbPagination.DbPaginationOpts = {
    page: parseInt(`${quasarPagination?.page ?? 1}`, 10),
    pageSize: parseInt(`${quasarPagination?.rowsPerPage ?? 10}`, 10),
    totalRows: parseInt(`${quasarPagination?.rowsNumber ?? 20}`, 10),
    sortBy: quasarPagination?.sortBy ?? undefined,
    sortOrder: quasarPagination?.descending ? 'desc' : 'asc'
  };

  return internalPagination;
}

/** Convert DbPaginationOpts into QTableProps['pagination'] */
export function convertPaginationToQuasar(
  internalPagination: dbPagination.DbPaginationOpts
): QTableProps['pagination']
{
  const quasarPagination: QTableProps['pagination'] = {
    page: parseInt(`${internalPagination?.page ?? 1}`, 10),
    rowsPerPage: parseInt(`${internalPagination?.pageSize ?? 10}`, 10),
    rowsNumber: parseInt(`${internalPagination.totalRows ?? 20}`, 10),
    sortBy: internalPagination?.sortBy ?? undefined,
    descending: internalPagination?.sortOrder === 'desc' ? true : undefined
  };

  return quasarPagination;
}
