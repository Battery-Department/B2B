/**
 * RHY Supplier Portal - Communication Utilities
 * Utility functions for customer communication system
 * Supports enterprise features and Batch 1 integration
 */

import type {
  CustomerCommunication,
  ChatMessage,
  SupportTicket,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  ChatStatus,
  MessageType,
  MessageStatus
} from '@/types/communication';

/**
 * Priority utility functions
 */
export const CommunicationPriority = {
  /**
   * Get priority score for sorting (higher = more urgent)
   */
  getScore: (priority: TicketPriority): number => {
    switch (priority) {
      case 'CRITICAL': return 5;
      case 'URGENT': return 4;
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  },

  /**
   * Get priority color for UI components
   */
  getColor: (priority: TicketPriority): string => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'URGENT': return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'LOW': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  },

  /**
   * Get priority icon
   */
  getIcon: (priority: TicketPriority): string => {
    switch (priority) {
      case 'CRITICAL':
      case 'URGENT':
        return 'alert-circle';
      case 'HIGH':
        return 'arrow-up';
      case 'MEDIUM':
        return 'minus';
      case 'LOW':
        return 'arrow-down';
      default:
        return 'circle';
    }
  },

  /**
   * Compare priorities for sorting
   */
  compare: (a: TicketPriority, b: TicketPriority): number => {
    return CommunicationPriority.getScore(b) - CommunicationPriority.getScore(a);
  }
};

/**
 * Status utility functions
 */
export const CommunicationStatus = {
  /**
   * Get status color for UI components
   */
  getColor: (status: ChatStatus | TicketStatus): string => {
    switch (status) {
      case 'ACTIVE':
      case 'OPEN':
      case 'IN_PROGRESS':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'QUEUED':
      case 'WAITING_CUSTOMER':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'ESCALATED':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'RESOLVED':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'CLOSED':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  },

  /**
   * Get status icon
   */
  getIcon: (status: ChatStatus | TicketStatus): string => {
    switch (status) {
      case 'ACTIVE':
      case 'OPEN':
        return 'circle';
      case 'IN_PROGRESS':
        return 'clock';
      case 'QUEUED':
        return 'timer';
      case 'WAITING_CUSTOMER':
        return 'user';
      case 'ESCALATED':
        return 'alert-triangle';
      case 'RESOLVED':
        return 'check-circle';
      case 'CLOSED':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  },

  /**
   * Check if status indicates an active communication
   */
  isActive: (status: ChatStatus | TicketStatus): boolean => {
    return ['ACTIVE', 'OPEN', 'IN_PROGRESS', 'QUEUED', 'WAITING_CUSTOMER', 'ESCALATED'].includes(status);
  },

  /**
   * Check if status indicates a resolved communication
   */
  isResolved: (status: ChatStatus | TicketStatus): boolean => {
    return ['RESOLVED', 'CLOSED'].includes(status);
  }
};

/**
 * Category utility functions
 */
export const CommunicationCategory = {
  /**
   * Get category display name
   */
  getDisplayName: (category: TicketCategory): string => {
    switch (category) {
      case 'PRODUCT_INQUIRY': return 'Product Inquiry';
      case 'ORDER_SUPPORT': return 'Order Support';
      case 'TECHNICAL_ISSUE': return 'Technical Issue';
      case 'BILLING_QUESTION': return 'Billing Question';
      case 'SHIPPING_INQUIRY': return 'Shipping Inquiry';
      case 'WARRANTY_CLAIM': return 'Warranty Claim';
      case 'BULK_ORDERING': return 'Bulk Ordering';
      case 'WAREHOUSE_QUESTION': return 'Warehouse Question';
      default: return 'General';
    }
  },

  /**
   * Get category color
   */
  getColor: (category: TicketCategory): string => {
    switch (category) {
      case 'PRODUCT_INQUIRY': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'ORDER_SUPPORT': return 'text-green-600 bg-green-50 border-green-200';
      case 'TECHNICAL_ISSUE': return 'text-red-600 bg-red-50 border-red-200';
      case 'BILLING_QUESTION': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'SHIPPING_INQUIRY': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'WARRANTY_CLAIM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'BULK_ORDERING': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'WAREHOUSE_QUESTION': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  },

  /**
   * Get category icon
   */
  getIcon: (category: TicketCategory): string => {
    switch (category) {
      case 'PRODUCT_INQUIRY': return 'package';
      case 'ORDER_SUPPORT': return 'shopping-cart';
      case 'TECHNICAL_ISSUE': return 'tool';
      case 'BILLING_QUESTION': return 'credit-card';
      case 'SHIPPING_INQUIRY': return 'truck';
      case 'WARRANTY_CLAIM': return 'shield';
      case 'BULK_ORDERING': return 'layers';
      case 'WAREHOUSE_QUESTION': return 'warehouse';
      default: return 'help-circle';
    }
  }
};

/**
 * Message utility functions
 */
export const MessageUtils = {
  /**
   * Get message status icon
   */
  getStatusIcon: (status: MessageStatus): string => {
    switch (status) {
      case 'SENT': return 'clock';
      case 'DELIVERED': return 'check';
      case 'READ': return 'check-check';
      case 'FAILED': return 'x-circle';
      default: return 'circle';
    }
  },

  /**
   * Get message status color
   */
  getStatusColor: (status: MessageStatus): string => {
    switch (status) {
      case 'SENT': return 'text-yellow-500';
      case 'DELIVERED': return 'text-gray-500';
      case 'READ': return 'text-blue-500';
      case 'FAILED': return 'text-red-500';
      default: return 'text-gray-400';
    }
  },

  /**
   * Format message content based on type
   */
  formatContent: (message: ChatMessage): string => {
    switch (message.messageType) {
      case 'SYSTEM':
        return `System: ${message.content}`;
      case 'ORDER_UPDATE':
        return `Order Update: ${message.content}`;
      case 'BATTERY_SUPPORT':
        return `Battery Support: ${message.content}`;
      case 'WAREHOUSE_INFO':
        return `Warehouse Info: ${message.content}`;
      default:
        return message.content;
    }
  },

  /**
   * Check if message type supports attachments
   */
  supportsAttachments: (messageType: MessageType): boolean => {
    return ['TEXT', 'IMAGE', 'FILE'].includes(messageType);
  }
};

/**
 * Time and date utility functions
 */
export const TimeUtils = {
  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelative: (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 30) return 'Just now';
    if (diffMin < 1) return `${diffSec}s ago`;
    if (diffHour < 1) return `${diffMin}m ago`;
    if (diffDay < 1) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    
    return new Date(date).toLocaleDateString();
  },

  /**
   * Format absolute time with context
   */
  formatAbsolute: (date: Date): string => {
    const now = new Date();
    const inputDate = new Date(date);
    
    const isToday = now.toDateString() === inputDate.toDateString();
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === inputDate.toDateString();
    
    if (isToday) {
      return `Today at ${inputDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    if (isYesterday) {
      return `Yesterday at ${inputDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return inputDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: inputDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Calculate response time in human-readable format
   */
  formatResponseTime: (startTime: Date, endTime: Date): string => {
    const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Less than 1 minute';
    if (diffHour < 1) return `${diffMin} minute${diffMin === 1 ? '' : 's'}`;
    if (diffDay < 1) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ${diffMin % 60} minute${diffMin % 60 === 1 ? '' : 's'}`;
    
    return `${diffDay} day${diffDay === 1 ? '' : 's'} ${diffHour % 24} hour${diffHour % 24 === 1 ? '' : 's'}`;
  }
};

/**
 * Communication filtering and sorting utilities
 */
export const CommunicationFilters = {
  /**
   * Filter communications by search query
   */
  bySearch: (communications: CustomerCommunication[], query: string): CustomerCommunication[] => {
    if (!query.trim()) return communications;
    
    const lowerQuery = query.toLowerCase();
    return communications.filter(comm =>
      comm.subject.toLowerCase().includes(lowerQuery) ||
      comm.metadata.customerType?.toLowerCase().includes(lowerQuery) ||
      comm.category.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Filter communications by status
   */
  byStatus: (communications: CustomerCommunication[], statuses: ChatStatus[]): CustomerCommunication[] => {
    if (!statuses.length) return communications;
    return communications.filter(comm => statuses.includes(comm.status));
  },

  /**
   * Filter communications by priority
   */
  byPriority: (communications: CustomerCommunication[], priorities: TicketPriority[]): CustomerCommunication[] => {
    if (!priorities.length) return communications;
    return communications.filter(comm => priorities.includes(comm.priority));
  },

  /**
   * Filter communications by category
   */
  byCategory: (communications: CustomerCommunication[], categories: TicketCategory[]): CustomerCommunication[] => {
    if (!categories.length) return communications;
    return communications.filter(comm => categories.includes(comm.category));
  },

  /**
   * Filter communications by date range
   */
  byDateRange: (communications: CustomerCommunication[], startDate: Date, endDate: Date): CustomerCommunication[] => {
    return communications.filter(comm => {
      const commDate = new Date(comm.createdAt);
      return commDate >= startDate && commDate <= endDate;
    });
  },

  /**
   * Sort communications by various criteria
   */
  sort: (
    communications: CustomerCommunication[],
    sortBy: 'priority' | 'status' | 'createdAt' | 'updatedAt' | 'lastMessageAt',
    order: 'asc' | 'desc' = 'desc'
  ): CustomerCommunication[] => {
    return [...communications].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'priority':
          comparison = CommunicationPriority.compare(a.priority, b.priority);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'lastMessageAt':
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          comparison = aTime - bTime;
          break;
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }
};

/**
 * Validation utilities
 */
export const CommunicationValidation = {
  /**
   * Validate message content
   */
  validateMessage: (content: string, maxLength: number = 4000): { isValid: boolean; error?: string } => {
    if (!content.trim()) {
      return { isValid: false, error: 'Message content cannot be empty' };
    }
    
    if (content.length > maxLength) {
      return { isValid: false, error: `Message content cannot exceed ${maxLength} characters` };
    }
    
    return { isValid: true };
  },

  /**
   * Validate ticket data
   */
  validateTicket: (title: string, description: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!title.trim()) {
      errors.push('Title is required');
    } else if (title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }
    
    if (!description.trim()) {
      errors.push('Description is required');
    } else if (description.length > 2000) {
      errors.push('Description cannot exceed 2000 characters');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  /**
   * Validate file attachments
   */
  validateAttachment: (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size cannot exceed 10MB' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not supported' };
    }
    
    return { isValid: true };
  }
};

/**
 * Performance and analytics utilities
 */
export const CommunicationAnalytics = {
  /**
   * Calculate response time metrics
   */
  calculateResponseMetrics: (communications: CustomerCommunication[]) => {
    const responseTimes: number[] = [];
    
    communications.forEach(comm => {
      if (comm.lastMessageAt) {
        const responseTime = new Date(comm.lastMessageAt).getTime() - new Date(comm.createdAt).getTime();
        responseTimes.push(responseTime);
      }
    });
    
    if (responseTimes.length === 0) {
      return { average: 0, median: 0, min: 0, max: 0 };
    }
    
    const sorted = responseTimes.sort((a, b) => a - b);
    const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    return { average, median, min, max };
  },

  /**
   * Calculate satisfaction metrics
   */
  calculateSatisfactionMetrics: (communications: CustomerCommunication[]) => {
    const ratings = communications
      .map(comm => comm.metadata.customerSatisfaction)
      .filter((rating): rating is number => typeof rating === 'number');
    
    if (ratings.length === 0) {
      return { average: 0, count: 0, distribution: {} };
    }
    
    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    const distribution = ratings.reduce((dist, rating) => {
      dist[rating] = (dist[rating] || 0) + 1;
      return dist;
    }, {} as Record<number, number>);
    
    return { average, count: ratings.length, distribution };
  },

  /**
   * Generate communication insights
   */
  generateInsights: (communications: CustomerCommunication[]): string[] => {
    const insights: string[] = [];
    
    // Status distribution
    const statusCounts = communications.reduce((counts, comm) => {
      counts[comm.status] = (counts[comm.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const totalComms = communications.length;
    const activeComms = (statusCounts['ACTIVE'] || 0) + (statusCounts['IN_PROGRESS'] || 0);
    
    if (activeComms / totalComms > 0.7) {
      insights.push('High volume of active conversations - consider additional support staff');
    }
    
    // Priority distribution
    const highPriorityCount = communications.filter(comm => 
      ['HIGH', 'URGENT', 'CRITICAL'].includes(comm.priority)
    ).length;
    
    if (highPriorityCount / totalComms > 0.3) {
      insights.push('High percentage of urgent tickets - review escalation procedures');
    }
    
    // Category insights
    const categoryCounts = communications.reduce((counts, comm) => {
      counts[comm.category] = (counts[comm.category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory && topCategory[1] / totalComms > 0.4) {
      insights.push(`${CommunicationCategory.getDisplayName(topCategory[0] as TicketCategory)} is the most common issue type`);
    }
    
    return insights;
  }
};