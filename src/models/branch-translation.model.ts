import { Column, Model, Table } from 'sequelize-typescript';

@Table({ modelName: 'branch_translations' })
export class BranchTranslation extends Model {
  declare id: number;

  @Column
  branch_id: number;

  @Column
  site_locale_id: number;

  @Column
  name: string;
}
