export type SheetItem = {
  title?: string;
  subtitle?: string;
  description?: string;
  button_label?: string;
  button_url?: string;
  group?: string;
  visible?: string | boolean;
  order?: number | string;
  icon?: string;
};

export type SheetResponse = { ok?: boolean; items?: SheetItem[]; data?: any; error?: string };
