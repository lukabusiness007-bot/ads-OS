/**
 * Admin data access layer.
 *
 * ONLY this module may use createServiceRoleSupabaseClient() for admin features.
 * Every exported function re-verifies the caller is a platform admin.
 * Never import or call these functions in browser/client components.
 */

export type { Paginated } from "./shared";

export { getAdminOverviewStats } from "./overview";

export {
  listUsers,
  getUserDetail,
  suspendUser,
  unsuspendUser,
  setPlatformAdmin
} from "./users";

export {
  listOrganizations,
  getOrganizationDetail,
  suspendOrg,
  unsuspendOrg,
  editOrgPlan
} from "./orgs";

export type { AdminProductSearchResult } from "./review";
export {
  getReviewQueue,
  getProductForReview,
  searchProducts,
  decideReview,
  evaluateModelForAutoApproval,
  editProductStatus
} from "./review";

export type { AdminAuditEntryWithTarget } from "./audit";
export {
  recordAuditEvent,
  listAuditLog,
  listAuditActors,
  startImpersonation,
  stopImpersonation
} from "./audit";

export {
  listAdminNotifications,
  markNotificationsRead
} from "./notifications";

export type { AdminConfig } from "./config";
export {
  getAdminConfig,
  setAutoReviewEnabled
} from "./config";
