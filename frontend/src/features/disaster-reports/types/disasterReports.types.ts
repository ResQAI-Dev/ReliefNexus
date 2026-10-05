export type DisasterReportStatus =
  | "Submitted"
  | "UnderReview"
  | "Reviewed"
  | "Verified"
  | "Assigned"
  | "Response"
  | "InProgress"
  | "FieldUpdateSubmitted"
  | "FieldCompleted"
  | "Resolved"
  | "Rejected"
  | "VolunteerQueue"
  | string;

export type DisasterReport = {
  id: string;
  reporterUserId?: string | null;
  reporterName?: string | null;
  reporterEmail?: string | null;

  disasterType?: string | null;
  description?: string | null;
  location?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  severity?: string | null;
  status?: DisasterReportStatus | null;

  riskScore?: number | null;
  riskLevel?: string | null;

  assignedVolunteerUserId?: string | null;
  assignedVolunteerName?: string | null;

  createdAt?: string | null;
  reviewedAt?: string | null;
  verifiedAt?: string | null;
  assignedAt?: string | null;
  resolvedAt?: string | null;

  fieldUpdateNotes?: string | null;
  fieldSituation?: string | null;
  fieldUpdateLatitude?: number | null;
  fieldUpdateLongitude?: number | null;
  fieldUpdatedAt?: string | null;
};

export type VolunteerUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive?: boolean;
};
