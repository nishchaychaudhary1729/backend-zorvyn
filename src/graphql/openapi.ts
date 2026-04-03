/**
 * @openapi
 * tags:
 *   - name: GraphQL
 *     description: Dashboard analytics exposed via GraphQL.
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     GraphQLRequest:
 *       type: object
 *       description: Standard GraphQL POST body.
 *       required: [query]
 *       properties:
 *         query:
 *           type: string
 *           description: GraphQL query document.
 *         variables:
 *           type: object
 *           additionalProperties: true
 *           nullable: true
 *         operationName:
 *           type: string
 *           nullable: true
 *     GraphQLError:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         locations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               line: { type: integer }
 *               column: { type: integer }
 *         path:
 *           type: array
 *           items: {}
 *         extensions:
 *           type: object
 *           additionalProperties: true
 *     GraphQLResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           nullable: true
 *           additionalProperties: true
 *         errors:
 *           type: array
 *           nullable: true
 *           items:
 *             $ref: '#/components/schemas/GraphQLError'
 */

/**
 * @openapi
 * /graphql:
 *   post:
 *     tags: [GraphQL]
 *     summary: GraphQL endpoint (Dashboard analytics)
 *     description: |
 *       The dashboard analytics API is exposed via GraphQL.
 *
 *       Authentication is done using the `Authorization: Bearer <accessToken>` header.
 *
 *       Available queries:
 *       - `dashboardSummary` (Viewer/Analyst/Admin)
 *       - `dashboardCategoryTotals` (Viewer/Analyst/Admin)
 *       - `dashboardRecentActivity(limit: Int)` (Viewer/Analyst/Admin)
 *       - `dashboardMonthlyTrends(months: Int = 12)` (Analyst/Admin)
 *       - `dashboardWeeklyTrends(weeks: Int = 12)` (Analyst/Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GraphQLRequest'
 *           examples:
 *             DashboardSummary:
 *               summary: Fetch dashboard summary
 *               value:
 *                 query: "query { dashboardSummary { totalIncome totalExpenses netBalance } }"
 *             MonthlyTrends:
 *               summary: Fetch monthly trends (Analyst/Admin)
 *               value:
 *                 query: "query ($months: Int!) { dashboardMonthlyTrends(months: $months) { month income expenses } }"
 *                 variables:
 *                   months: 12
 *     responses:
 *       200:
 *         description: GraphQL response (may include `errors`)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GraphQLResponse'
 */

export {}; // Ensures this file is treated as a module
