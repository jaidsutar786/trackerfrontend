// Utility function to get display name from user object
export const getDisplayName = (user) => {
  if (!user) return 'Unknown';
  
  // If first_name exists, use full name
  if (user.first_name) {
    return `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`.trim();
  }
  
  // Fallback to username
  return user.username || 'Unknown';
};

// Utility function to get initials from user object
export const getInitials = (user) => {
  if (!user) return '??';
  
  // If first_name exists, use first letter of first and last name
  if (user.first_name) {
    const firstInitial = user.first_name[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }
  
  // Fallback to first 2 letters of username
  return (user.username || '??').slice(0, 2).toUpperCase();
};