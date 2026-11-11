/** Portal de entrenador: rol COACH, o admin (rol ADMIN o ADMIN_UIDS). */
export function canOpenCoachPortal(user) {
  return !!user && (user.role === "COACH" || user.admin === true);
}
