export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Locale = "es" | "en" | "pt";
export type TranslationMap = Record<Locale, string>;

export interface Translations {
  es: string;
  en: string;
  pt: string;
}

export type UserRole = "admin" | "reader" | "tecnico";
export type Severity = "low" | "medium" | "high" | "critical";
export type HazardSeverity = "warning" | "caution" | "danger";
export type HazardIcon =
  | "electric"
  | "pressure"
  | "burn"
  | "crush"
  | "chemical"
  | "generic";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Machine {
  id: string;
  slug: string;
  image_url: string | null;
  translations: {
    es: { name: string; description: string };
    en: { name: string; description: string };
    pt: { name: string; description: string };
  };
  created_at: string;
  updated_at: string;
}

export interface System {
  id: string;
  slug: string;
  icon_url: string | null;
  translations: {
    es: { name: string; description: string };
    en: { name: string; description: string };
    pt: { name: string; description: string };
  };
  created_at: string;
  updated_at: string;
}

export interface MachineSystem {
  machine_id: string;
  system_id: string;
  display_order: number;
}

export interface Subsystem {
  id: string;
  system_id: string;
  slug: string;
  display_order: number;
  translations: {
    es: { name: string; description: string };
    en: { name: string; description: string };
    pt: { name: string; description: string };
  };
  created_at: string;
}

export interface ErrorCode {
  id: string;
  subsystem_id: string;
  code: string;
  severity: Severity;
  translations: {
    es: { title: string; description: string };
    en: { title: string; description: string };
    pt: { title: string; description: string };
  };
  created_at: string;
  updated_at: string;
}

export interface DiagnosticStep {
  id: string;
  error_code_id: string;
  step_order: number;
  content_json: Json;
  translations: {
    es: { content_json: Json };
    en: { content_json: Json };
    pt: { content_json: Json };
  } | null;
}

export interface RepairStep {
  id: string;
  error_code_id: string;
  step_order: number;
  content_json: Json;
  translations: {
    es: { content_json: Json };
    en: { content_json: Json };
    pt: { content_json: Json };
  } | null;
}

export interface Tool {
  id: string;
  image_url: string | null;
  part_number: string | null;
  translations: {
    es: { name: string; description: string };
    en: { name: string; description: string };
    pt: { name: string; description: string };
  };
  created_at: string;
}

export interface ErrorCodeTool {
  error_code_id: string;
  tool_id: string;
  quantity: number | null;
  notes: string | null;
  tool?: Tool;
}

export interface Hazard {
  id: string;
  error_code_id: string;
  severity: HazardSeverity;
  icon: HazardIcon;
  display_order: number;
  translations: {
    es: { title: string; description: string };
    en: { title: string; description: string };
    pt: { title: string; description: string };
  };
}

// Joined types
export interface MachineWithSystems extends Machine {
  systems: System[];
}

export interface SystemWithSubsystems extends System {
  subsystems: Subsystem[];
}

export interface SubsystemWithErrorCodes extends Subsystem {
  error_codes: ErrorCode[];
}

export interface ErrorCodeFull extends ErrorCode {
  subsystem: Subsystem & { system: System };
  diagnostic_steps: DiagnosticStep[];
  repair_steps: RepairStep[];
  tools: ErrorCodeTool[];
  hazards: Hazard[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      machines: {
        Row: Machine;
        Insert: Omit<Machine, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Machine, "id" | "created_at" | "updated_at">>;
      };
      systems: {
        Row: System;
        Insert: Omit<System, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<System, "id" | "created_at" | "updated_at">>;
      };
      machine_systems: {
        Row: MachineSystem;
        Insert: MachineSystem;
        Update: Partial<MachineSystem>;
      };
      subsystems: {
        Row: Subsystem;
        Insert: Omit<Subsystem, "id" | "created_at">;
        Update: Partial<Omit<Subsystem, "id" | "created_at">>;
      };
      error_codes: {
        Row: ErrorCode;
        Insert: Omit<ErrorCode, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ErrorCode, "id" | "created_at" | "updated_at">>;
      };
      diagnostic_steps: {
        Row: DiagnosticStep;
        Insert: Omit<DiagnosticStep, "id">;
        Update: Partial<Omit<DiagnosticStep, "id">>;
      };
      repair_steps: {
        Row: RepairStep;
        Insert: Omit<RepairStep, "id">;
        Update: Partial<Omit<RepairStep, "id">>;
      };
      tools: {
        Row: Tool;
        Insert: Omit<Tool, "id" | "created_at">;
        Update: Partial<Omit<Tool, "id" | "created_at">>;
      };
      error_code_tools: {
        Row: ErrorCodeTool;
        Insert: ErrorCodeTool;
        Update: Partial<ErrorCodeTool>;
      };
      hazards: {
        Row: Hazard;
        Insert: Omit<Hazard, "id">;
        Update: Partial<Omit<Hazard, "id">>;
      };
    };
  };
}
