export enum FilterOptionTypes {
  // CATEGORIES = "categories",
  // BRANDs = "brands",
  // RATING = "rating",
  // PRICE = "price",
  // RADIO = "radio",
  VALUES = "values",
  VARIANTS = "variants",
  MINIMUM = "minimum",
  RANGE = "range",
}

export enum FilterOptionInputType {
  CHECKBOX = "checkbox",
  RADIO = "radio",
}

export interface FilterValue {
  key: string,
  count: string,
  value: string,
  from?: number| "*",
  to?: number | "*"
}

export interface Filter {
  label: string,
  key: "categories" | string,//todo:: add possible values
  inputType: FilterOptionInputType,
  type: FilterOptionTypes,
  min?: number,
  max?: number,
  values: Array<FilterValue>
}
