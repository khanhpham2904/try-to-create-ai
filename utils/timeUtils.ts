/**
 * Centralized time formatting utilities for the chat application
 * Handles timezone conversion, validation, and consistent formatting
 */

export interface TimeFormatOptions {
  showSeconds?: boolean;
  useRelativeTime?: boolean;
  maxRelativeHours?: number;
  timeZone?: string;
}

/**
 * Validates if a date string is valid and reasonable
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString) {
    return false;
  }
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // Check if date is reasonable (not too old/future)
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    // Allow dates up to 2 years in the past or future
    if (diffInHours > 17520) { // 17520 hours = 2 years
      return false;
    }
    
    // Allow dates from 1990 onwards (more reasonable than 2000)
    if (date.getFullYear() < 1990) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Formats a date string to a relative time string (e.g., "5m ago", "2h ago")
 */
export const formatRelativeTime = (dateString: string, timeZone: string = 'Asia/Singapore'): string => {
  if (!dateString || !isValidDate(dateString)) {
    return 'Unknown';
  }
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}h ago`;
    } else if (diffMinutes < 10080) {
      return `${Math.floor(diffMinutes / 1440)}d ago`;
    } else {
      return date.toLocaleDateString([], {
        timeZone,
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting relative time:', error, 'Date string:', dateString);
    return 'Invalid';
  }
};

/**
 * Formats a date string to a time string (e.g., "14:30", "2:30 PM")
 */
export const formatTime = (
  dateString: string, 
  options: TimeFormatOptions = {}
): string => {
  const {
    showSeconds = false,
    timeZone = 'Asia/Singapore'
  } = options;
  
  if (!dateString || !isValidDate(dateString)) {
    return '--:--';
  }
  
  try {
    const date = new Date(dateString);
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      timeZone
    });
  } catch (error) {
    console.error('Error formatting time:', error, 'Date string:', dateString);
    return '--:--';
  }
};

/**
 * Formats a date string to a date string (e.g., "Dec 25, 2023")
 */
export const formatDate = (
  dateString: string, 
  timeZone: string = 'Asia/Singapore'
): string => {
  if (!dateString || !isValidDate(dateString)) {
    return 'Invalid';
  }
  
  try {
    const date = new Date(dateString);
    
    return date.toLocaleDateString([], {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'Date string:', dateString);
    return 'Invalid';
  }
};

/**
 * Formats a date string with smart formatting based on age
 * Shows time for recent messages, date for older ones
 */
export const formatSmartTime = (
  dateString: string,
  options: TimeFormatOptions = {}
): string => {
  const {
    useRelativeTime = false,
    maxRelativeHours = 24,
    timeZone = 'Asia/Singapore'
  } = options;
  
  if (!dateString || !isValidDate(dateString)) {
    return '--:--';
  }
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    // Use relative time if requested and within the threshold
    if (useRelativeTime && Math.abs(diffInHours) <= maxRelativeHours) {
      return formatRelativeTime(dateString, timeZone);
    }
    
    // Show time for messages within 24 hours, date for older messages
    if (Math.abs(diffInHours) < 24) {
      return formatTime(dateString, { timeZone });
    } else {
      return formatDate(dateString, timeZone);
    }
  } catch (error) {
    console.error('Error formatting smart time:', error, 'Date string:', dateString);
    return '--:--';
  }
};

/**
 * Gets a safe timestamp for sorting purposes
 */
export const getSafeTimestamp = (dateString: string): number => {
  if (!dateString || !isValidDate(dateString)) {
    return 0;
  }
  
  try {
    return new Date(dateString).getTime();
  } catch (error) {
    console.error('Error getting safe timestamp:', error, 'Date string:', dateString);
    return 0;
  }
};

/**
 * Detects the user's timezone and returns appropriate timezone string
 */
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect user timezone, defaulting to Asia/Singapore');
    return 'Asia/Singapore';
  }
};
