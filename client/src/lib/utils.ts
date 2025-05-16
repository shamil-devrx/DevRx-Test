import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  
  // Get time difference in seconds
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  
  // Time constants
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  
  // Format based on elapsed time
  if (seconds < minute) {
    return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`;
  } else if (seconds < hour) {
    const minutes = Math.floor(seconds / minute);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (seconds < day) {
    const hours = Math.floor(seconds / hour);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (seconds < week) {
    const days = Math.floor(seconds / day);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (seconds < month) {
    const weeks = Math.floor(seconds / week);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (seconds < year) {
    const months = Math.floor(seconds / month);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(seconds / year);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  let initials = '';
  
  if (firstName) {
    initials += firstName[0].toUpperCase();
  }
  
  if (lastName) {
    initials += lastName[0].toUpperCase();
  }
  
  if (!initials && firstName) {
    // If no last name, use first two letters of first name
    initials = firstName.substring(0, 2).toUpperCase();
  }
  
  // If still no initials, use default
  if (!initials) {
    initials = 'U';
  }
  
  return initials;
}
