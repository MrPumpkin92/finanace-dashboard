# Azure Setup

This app uses Azure AD to get a Power BI access token with a client secret. The app also needs access to a Power BI workspace and report.

## 1. Register An Azure AD App

1. Open the Azure portal.
2. Go to Microsoft Entra ID.
3. Select App registrations.
4. Choose New registration.
5. Give the app a name, such as `finance-dashboard`.
6. Pick the account type that matches your setup. For personal use, single-tenant is usually enough.
7. Register the app.

After registration, note these values:

| Value | Where to find it |
| --- | --- |
| Tenant ID | Microsoft Entra ID overview page |
| Client ID | App registration overview page |
| Client Secret | Certificates & secrets after creating a new secret |

> ⚠️ Treat the client secret like a password. Do not commit it to git or share it in screenshots.

## 2. Create A Client Secret

1. Open the app registration.
2. Go to Certificates & secrets.
3. Create a new client secret.
4. Copy the secret value immediately. Azure will not show it again.
5. Put the value in your local `.env` file as `AZURE_CLIENT_SECRET`.

## 3. Add Power BI API Permissions

The code uses a client-credential flow against the Power BI REST API scope.

Add these application permissions in the app registration and grant admin consent:

| Permission | Why it is needed |
| --- | --- |
| `Dataset.ReadWrite.All` | Push rows, clear rows, refresh datasets, and create embed tokens |
| `Report.Read.All` | Read report metadata and pages |
| `Workspace.Read.All` | List workspaces and resolve workspace data |

If your tenant policy requires broader access for workspace management, add the least extra permission your policy allows and document it locally.

Also enable this tenant setting in Power BI:

| Setting | Purpose |
| --- | --- |
| Allow service principals to use Power BI APIs | Lets the app registration call the Power BI REST API |

## 4. Add The Service Principal To The Workspace

1. Open the target Power BI workspace.
2. Go to workspace access.
3. Add the app registration or its service principal.
4. Give it at least Member access for day-to-day use.

Without workspace access, the token may be valid but report and dataset calls will still fail.

## 5. Find Your Workspace ID And Report ID

You can copy both values from the Power BI Service URL.

| Item | Where to look |
| --- | --- |
| Workspace ID | The GUID after `/groups/` in the workspace URL |
| Report ID | The GUID after `/reports/` in the report URL |

Example URL patterns:

| URL pattern | Meaning |
| --- | --- |
| `https://app.powerbi.com/groups/<workspace-id>/...` | Workspace ID |
| `https://app.powerbi.com/groups/<workspace-id>/reports/<report-id>/...` | Workspace ID and report ID |

## 6. Create A Power BI Push Dataset For Real-Time Sync

The sync code can push rows into a dataset table named `Transactions`.

### Option A: Create It With The Power BI REST API

Call the Power BI API to create a dataset in the workspace:

`POST /groups/{workspaceId}/datasets`

Use a schema that matches the rows the app exports. A practical table shape is:

| Field | Type |
| --- | --- |
| id | string |
| date | string |
| amount | number |
| type | string |
| description | string |
| categoryId | string |
| category_id | string |
| categoryName | string |
| notes | string |
| source | string |
| import_hash | string |
| userId | string |
| createdAt | string |
| updatedAt | string |
| created_at | string |
| deletedAt | string |
| deleted_at | string |

### Option B: Create It In Power BI Service And Sync Rows

If you already have a dataset, save its ID in one of these variables:

- `POWER_BI_PUSH_DATASET_ID`
- `POWER_BI_DATASET_ID`

The app will clear and repopulate the `Transactions` table during push sync.

### Real-Time Sync Flow

The app uses these Power BI REST calls during sync:

| Action | REST call |
| --- | --- |
| Clear rows | `DELETE /groups/{workspaceId}/datasets/{datasetId}/tables/Transactions/rows` |
| Push rows | `POST /groups/{workspaceId}/datasets/{datasetId}/tables/Transactions/rows` |
| Trigger refresh | `POST /groups/{workspaceId}/datasets/{datasetId}/refreshes` |

> ⚠️ Real-time sync only works if the dataset schema matches the exported transaction rows. If the field names differ, the push can fail.

## 7. Put The Values In `.env`

At minimum, the backend expects:

```env
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
POWER_BI_WORKSPACE_ID=...
POWER_BI_REPORT_ID=...
POWER_BI_DATASET_ID=...
```

Optional sync overrides:

```env
POWER_BI_PUSH_DATASET_ID=...
POWER_BI_REFRESH_DATASET_ID=...
REFRESH_CRON=0 0 * * *
```

## Common Problems

| Problem | Likely cause |
| --- | --- |
| Token request fails | Missing Azure variables or client secret typo |
| Power BI returns 401 | Workspace permission or API permission issue |
| Report embed fails | Wrong workspace ID or report ID |
| Push sync fails | Dataset schema does not match the transaction rows |