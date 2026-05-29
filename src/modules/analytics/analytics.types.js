/**
 * @typedef {Object} AdminDashboardAnalytics
 * @property {Object} kpis
 * @property {Object} kpis.totalUsers
 * @property {number} kpis.totalUsers.count
 * @property {number} kpis.totalUsers.activePercentage
 * @property {number} kpis.totalUsers.newCount
 * @property {Object} kpis.verifiedProviders
 * @property {number} kpis.verifiedProviders.count
 * @property {number} kpis.verifiedProviders.pendingCount
 * @property {number} kpis.verifiedProviders.flaggedCount
 * @property {Object} kpis.openSupportTickets
 * @property {number} kpis.openSupportTickets.count
 * @property {number} kpis.openSupportTickets.criticalCount
 * @property {"HEALTHY" | "WARNING" | "CRITICAL"} kpis.openSupportTickets.slaStatus
 * @property {Object} kpis.carePlanAdherence
 * @property {number} kpis.carePlanAdherence.onTrackPercentage
 * @property {number} kpis.carePlanAdherence.atRiskPercentage
 * @property {Object} kpis.pendingApprovals
 * @property {number} kpis.pendingApprovals.queueCount
 * @property {Object} charts
 * @property {Array<{ status: string, count: number }>} charts.providerVerification
 * @property {Array<{ day: string, value: number }>} charts.cpImprovementTrend
 * @property {Array<{ day: string, value: number }>} charts.assignedDailyTasks
 */

/**
 * @typedef {Object} ProviderDashboardAnalytics
 * @property {Object} kpis
 * @property {Object} kpis.sessionsCompleted
 * @property {number} kpis.sessionsCompleted.count
 * @property {number} kpis.sessionsCompleted.averageRating
 * @property {Object} kpis.referrals
 * @property {number} kpis.referrals.pending
 * @property {number} kpis.referrals.approved
 * @property {number} kpis.referrals.declined
 * @property {Object} kpis.carePlanAdherence
 * @property {number} kpis.carePlanAdherence.onTrackPercentage
 * @property {number} kpis.carePlanAdherence.atRiskPercentage
 * @property {Object} kpis.assignedTasks
 * @property {number} kpis.assignedTasks.open
 * @property {number} kpis.assignedTasks.done
 * @property {Object} kpis.approvals
 * @property {number} kpis.approvals.pending
 * @property {number} kpis.approvals.approved
 * @property {number} kpis.approvals.rejected
 * @property {Object} charts
 * @property {Array<{ day: string, value: number }>} charts.patientProgress
 * @property {Array<{ day: string, value: number }>} charts.adherenceTrend
 * @property {Array<{ day: string, value: number }>} charts.assignedDailyTasks
 * @property {Object} charts.patientRecovery
 * @property {number} charts.patientRecovery.improved
 * @property {number} charts.patientRecovery.stable
 * @property {number} charts.patientRecovery.regressed
 */

/**
 * @typedef {Object} SupportTicketMeta
 * @property {string} ticketId
 * @property {Date} time
 * @property {string} issueType
 * @property {string} description
 * @property {string[]} usersInvolved
 * @property {string} priority
 */

/**
 * @typedef {Object} SupportDashboardAnalytics
 * @property {Object} kpis
 * @property {Object} kpis.openQueue
 * @property {number} kpis.openQueue.new
 * @property {number} kpis.openQueue.inProgress
 * @property {Object} kpis.criticalEscalations
 * @property {number} kpis.criticalEscalations.count
 * @property {Object} kpis.avgResponseTime
 * @property {string} kpis.avgResponseTime.goal
 * @property {string} kpis.avgResponseTime.actual
 * @property {"HEALTHY" | "WARNING" | "BREACHED"} kpis.avgResponseTime.slaHealth
 * @property {Object} kpis.resolvedToday
 * @property {number} kpis.resolvedToday.efficiencyPercentage
 * @property {number} kpis.resolvedToday.backlogCount
 * @property {Object} queues
 * @property {SupportTicketMeta[]} queues.newRequests
 * @property {SupportTicketMeta[]} queues.inProgress
 * @property {SupportTicketMeta[]} queues.escalated
 */

export {};
