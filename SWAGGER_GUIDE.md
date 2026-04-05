# Swagger Testing Guide (Finance Dashboard API)

This guide provides step-by-step instructions on how to use the Swagger UI to test the Finance Dashboard API correctly. It covers how to authenticate, how to retrieve user IDs, and how to test endpoints, especially considering the role-based access control (RBAC).

## 1. Seeded Test Data Credentials

When you run the database seeder (`npm run seed` or `npx prisma db seed`), three user accounts are created, each with a specific role:

| Role      | Email                   | Password        | Capabilities                                                      |
|-----------|-------------------------|-----------------|-------------------------------------------------------------------|
| **Admin** | `admin@finance.com`     | `Password123!`  | Has full access to everything (CRUD on Users, Records, etc.).     |
| **Analyst** | `analyst@finance.com` | `Password123!`  | Can view records and use GraphQL for analytics. Cannot edit data. |
| **Viewer** | `viewer@finance.com`   | `Password123!`  | Can only view basic data. Very restricted.                        |

## 2. Authentication Flow

Swagger requires you to explicitly authenticate to access protected routes. Here is how:

### Step 2.1: Login to get a Token
1. Open your Swagger UI in the browser (usually at `http://localhost:3000/api-docs`).
2. Scroll down to the **Auth** section and click on the `POST /api/auth/login` endpoint.
3. Click **Try it out**.
4. In the Request body, provide the email and password for the role you want to test. For example, to test as an Admin:
   ```json
   {
     "email": "admin@finance.com",
     "password": "Password123!"
   }
   ```
5. Click **Execute**.
6. In the **Server response** section, find the `accessToken` in the response body. Copy the value (without quotes).

### Step 2.2: Authorize Swagger UI
1. Scroll to the top of the Swagger page and click the green **Authorize** button with a lock icon.
2. Under "bearerAuth", paste the `accessToken` you copied.
3. Click **Authorize**, then **Close**. Swagger is now authenticated with that user's role!

## 3. Dealing with User IDs

Many API endpoints (like `GET /api/users/{id}` or `PATCH /api/users/{id}`) require a User UUID.

### How to get a User ID:
Because User IDs are generated dynamically by the database, they change on every fresh database seed. Here is how to find them:

**Method 1: Call `GET /api/users` (Requires Admin Token)**
1. Ensure Swagger is authorized with the `admin@finance.com` token.
2. Find the `GET /api/users` endpoint and click **Try it out** -> **Execute**.
3. In the response list, find the `id` property for whichever user you want to test and copy it.

**Method 2: Call `GET /api/users/me` (Any authenticated user)**
1. Authorize Swagger with *any* user's token.
2. Find the `GET /api/users/me` endpoint and click **Execute**.
3. The response will return the current user's profile, including their `id`.

## 4. Understanding Role-Based Access (401 vs 403 Errors)

If your requests fail, check these two common scenarios:

- **`401 Unauthorized`**: You did not click the "Authorize" button at the top to supply a token, or the token expired. The response will usually have a 69-byte size with `"Missing or invalid authorization header"`.
- **`403 Forbidden`**: You successfully provided a token, but the user *role* does not have permission for the endpoint. 
  *Example*: A Viewer test account (`viewer@finance.com`) trying to access `GET /api/users/{id}` will get a `403 Forbidden` because that endpoint is protected as **Admin Only**.

## 5. Testing Financial Records

The system includes pre-seeded financial records. Here is how you retrieve them.

### Step 5.1: Retrieve Records
1. Ensure you authorized Swagger with an **Admin**, **Analyst**, or **Viewer** token.
2. Navigate to `GET /api/records`.
3. Click **Try it out**.
4. (Optional) Provide filters like `type` (`INCOME` or `EXPENSE`), `limit`, etc.
5. Click **Execute**. This should successfully return an array of records.

### Step 5.2: Create/Update/Delete Records
1. Navigation to `POST /api/records`, `PATCH /api/records/{id}`, etc.
2. **Important Rule**: Only the **Admin** role has authorization to modify records.
3. Attempting these endpoints with a Viewer or Analyst token will correctly return a `403 Forbidden` error.

## Summary Checklist for Swagger Testing
1. Always start by logging in (`POST /api/auth/login`).
2. Copy the token and paste it into the **Authorize** lock menu.
3. Get any required UUIDs by using `GET /api/users/me` or `GET /api/users` (if admin).
4. Pay attention to the expected roles for each endpoint.
