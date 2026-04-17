import { ApiService } from './apiService';
import { PATH } from '../constants/app.constant';

export interface CustomField {
  id?: string;
  companyId: string;
  fieldTable: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'TEXT' | 'DROPDOWN' | 'NUMBER' | 'DATE' | 'PARAGRAPH';
  fieldDefaultValue?: string;
  fieldOptions?: { label: string; value: string }[];
  fieldOrder?: number;
  required: boolean;
  active: boolean;
  createdBy?: string;
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
}

export const customFieldsApi = {
  getCustomFields: (fieldTable: string, companyId: string) =>
    ApiService.get<CustomField[]>(`${PATH.CUSTOM_FIELDS_DATA}?fieldTable=${fieldTable}&companyId=${companyId}`),

  getCustomField: (id: string) =>
    ApiService.get<CustomField>(`${PATH.CUSTOM_FIELDS_DATA}/${id}`),

  createCustomField: (data: Omit<CustomField, 'id' | 'createdOn' | 'updatedOn'>) =>
    ApiService.post<CustomField>(PATH.CUSTOM_FIELDS_DATA, data),

  updateCustomField: (id: string, data: Partial<CustomField>) =>
    ApiService.put<CustomField>(`${PATH.CUSTOM_FIELDS_DATA}/${id}`, data),

  deleteCustomField: (id: string) =>
    ApiService.delete<void>(`${PATH.CUSTOM_FIELDS_DATA}/${id}`),
};