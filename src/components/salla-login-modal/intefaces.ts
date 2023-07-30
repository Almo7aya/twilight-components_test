export interface CustomField {
    id: number;
    label: string;
    description: string;
    type: string;
    required: boolean;
    length: number;
}

export enum CustomFieldType {
    TEXT = 'text',
    NUMBER = 'number',
    PHOTO = 'photo'
}
