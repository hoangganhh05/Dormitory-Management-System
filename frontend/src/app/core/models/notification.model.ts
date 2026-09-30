export type NotificationCategory =
  | 'GENERAL'
  | 'URGENT'
  | 'REGULATION'
  | 'FINANCE'
  | 'MAINTENANCE'
  | 'EVENT';

export type NotificationPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

export type NotificationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type NotificationTargetRole = 'ALL' | 'STUDENT' | 'ADMIN';

export interface NotificationItem {
  id: number;
  title: string;
  summary?: string;
  content: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  targetRole: NotificationTargetRole;
  targetBuilding?: string | null;
  isPinned: boolean;
  status: NotificationStatus;
  viewCount: number;
  readsCount: number;
  isRead?: boolean;
  author?: {
    id: number;
    fullName: string;
    role: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  pinned: number;
  urgent: number;
  categories: Record<string, number>;
}

export interface NotificationQueryParams {
  category?: NotificationCategory | '';
  priority?: NotificationPriority | '';
  status?: NotificationStatus | '';
  targetRole?: NotificationTargetRole | '';
  targetBuilding?: string;
  isPinned?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateNotificationDto {
  title: string;
  summary?: string;
  content: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  targetRole: NotificationTargetRole;
  targetBuilding?: string | null;
  isPinned?: boolean;
  status?: NotificationStatus;
}

export interface UpdateNotificationDto extends Partial<CreateNotificationDto> {}
