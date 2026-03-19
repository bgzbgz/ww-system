export type WorkshopStatus = 'draft' | 'generating' | 'ready' | 'scheduled' | 'sent';
export type EmailStatus = 'pending' | 'sent' | 'failed';
export type WarningType = 'missing_email' | 'invalid_email' | 'duplicate_name' | null;

export interface Workshop {
  id: string;
  name: string;
  status: WorkshopStatus;
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
  layout_json?: LayoutJson;
  email_subject?: string;
}

export interface Participant {
  id: string;
  workshop_id: string;
  first_name: string;
  full_name: string;
  email?: string;
  company: string;
  position?: string;
  certificate_url?: string;
  email_status: EmailStatus;
  email_error?: string;
  warning: WarningType;
}

export interface LayoutBlock {
  x: string;  // e.g. "42%"
  y: string;
  font: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface LayoutJson {
  full_name: LayoutBlock;
  company: LayoutBlock;
  date: LayoutBlock;
}
