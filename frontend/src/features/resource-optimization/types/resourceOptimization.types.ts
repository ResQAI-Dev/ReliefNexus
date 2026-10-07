export type ResourcePriority =
  | "Critical"
  | "High"
  | "Medium"
  | "Low";

export interface ResourceAllocation {
  id: string;
  vulnerabilityAssessmentId: string;
  resourceId: string;
  resourceType: string;
  resourceName: string;
  recommendedQuantity: number;
  priority: ResourcePriority | string;
  location: string;
  createdAt: string;
}

export interface ResourceOptimizationSummary {
  totalAllocations: number;
  totalRecommendedQuantity: number;
  criticalAllocations: number;
  highAllocations: number;
  mediumAllocations: number;
  lowAllocations: number;
  locationsCovered: number;
  resourceTypes: number;
}

export interface ResourceOptimizationFilters {
  priority: string;
  resourceType: string;
  location: string;
  search: string;
}

export interface ResourceOptimizationState {
  allocations: ResourceAllocation[];
  loading: boolean;
  optimizing: boolean;
  error: string | null;
  selectedAllocation: ResourceAllocation | null;
}