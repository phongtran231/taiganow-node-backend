import {
  Column,
  CreatedAt,
  DeletedAt,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ modelName: 'addresses' })
export class Address extends Model {
  declare id: number;

  @Column
  erp_Telephone1: string;

  @Column
  erp_Telephone2: string;

  @Column
  erp_City: string;

  @Column
  erp_PostCode: string;

  @Column
  erp_Country: string;

  @Column
  erp_County: string;

  @Column
  erp_Address1: string;

  @Column
  erp_Address2: string;

  @Column
  erp_Address3: string;

  @Column
  erp_Fax: string;

  @Column
  erp_CustomerAddressID: string;

  @Column
  erp_CustomerAddressCode: string;

  @Column
  name: string;

  @Column
  customer_id: number;

  @Column
  sales_representative_id: number;

  @Column
  branch_id: number;

  @Column
  tax_area_id: number;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @DeletedAt
  deleted_at: Date;
}
