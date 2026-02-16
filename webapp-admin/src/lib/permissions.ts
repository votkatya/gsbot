// Утилиты для проверки прав доступа

export const isAdmin = (): boolean => {
  return localStorage.getItem('admin_role') === 'admin';
};

export const canEdit = (): boolean => {
  return isAdmin();
};

export const canDelete = (): boolean => {
  return isAdmin();
};

export const canView = (): boolean => {
  // Все роли могут просматривать
  return true;
};

export const canExport = (): boolean => {
  // Все роли могут экспортировать
  return true;
};
