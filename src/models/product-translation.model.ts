import { Column, Model, Table } from 'sequelize-typescript';

@Table({ modelName: 'product_translations' })
export class ProductTranslation extends Model {
  declare id: number;

  @Column
  product_id: number;

  @Column
  site_locale_id: number;

  @Column
  name: string;

  @Column
  description: string;

  @Column
  short_description: string;

  @Column
  video_url: string;
}
