export interface Option {
  value: string;
  label: string;
}

export interface Field {
  label: string;
  type: string;
  description?: string;
  options: Option[];
  default: string | string[];
}

export interface Section {
  title: string;
  icon: string;
  fields: Record<string, Field>;
}

export interface Preset {
  key: string;
  name: string;
  sections: Record<string, Section>;
}

export interface GroupData {
  name: string;
  icon: string;
  sections: Record<string, Section>;
  presets: Preset[];
}

export interface Project {
  project: string;
  group: string;
  storage: string;
  data: GroupData;
}

export interface AppState {
  project: string;
  group: string;
  preset: string;
}