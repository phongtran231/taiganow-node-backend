import { Column, DeletedAt, HasMany, Model, Table } from 'sequelize-typescript';
import { UomTranslation } from './uom-translation.model';

@Table({ tableName: 'uom' })
export class Uom extends Model {
  declare id: number;

  @Column
  code: string;

  @DeletedAt
  deleted_at: Date;

  @HasMany(() => UomTranslation, { foreignKey: 'uom_id' })
  translations: UomTranslation[];
}
