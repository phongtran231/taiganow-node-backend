import { Column, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'uom_translations' })
export class UomTranslation extends Model {
  declare id: number;

  @Column
  uom_id: number;

  @Column
  site_locale_id: number;

  @Column
  value: string;
}
