import { buildSchema } from "graphql";

export const schema = buildSchema(/* GraphQL */ `
  type DashboardSummary {
    totalIncome: Float!
    totalExpenses: Float!
    netBalance: Float!
    incomeCount: Int!
    expenseCount: Int!
  }

  type CategoryTotal {
    type: String!
    category: String!
    total: Float!
    count: Int!
  }

  type MonthlyTrend {
    month: String!
    type: String!
    total: Float!
    count: Int!
  }

  type WeeklyTrend {
    week: String!
    weekStart: String!
    type: String!
    total: Float!
    count: Int!
  }

  type ActivityUser {
    id: ID!
    name: String!
  }

  type RecentActivity {
    id: ID!
    amount: Float!
    type: String!
    category: String!
    date: String!
    description: String
    createdAt: String!
    createdBy: ActivityUser!
  }

  type Query {
    dashboardSummary: DashboardSummary!
    dashboardCategoryTotals: [CategoryTotal!]!
    dashboardMonthlyTrends(months: Int = 12): [MonthlyTrend!]!
    dashboardWeeklyTrends(weeks: Int = 12): [WeeklyTrend!]!
    dashboardRecentActivity(limit: Int = 10): [RecentActivity!]!
  }
`);
