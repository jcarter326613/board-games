# Bootstrap Infrastructure

This root is applied manually by a Google Cloud project administrator. It
configures the trust and permissions required for GitHub Actions to deploy the
environment roots. It intentionally does not run in GitHub Actions.

## Prerequisites

- The GCS state bucket in `backend.hcl` already exists.
- Your administrator account has Application Default Credentials:

```bash
gcloud auth application-default login
```

## Apply

Create a local variables file from the example and replace the placeholder
repository value. Add only the project roles required by resources that the
deployment workflow will manage.

```bash
cp terraform.tfvars.example terraform.tfvars
terraform init -backend-config=backend.hcl
terraform plan
terraform apply
```

Run these commands from `infrastructure/bootstrap`.

After applying, configure the outputs as GitHub Environment variables for both
`development` and `production`:

- `workload_identity_provider` -> `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `terraform_service_account` -> `GCP_SERVICE_ACCOUNT`
- `project_id` -> `GCP_PROJECT_ID`

The bootstrap root creates the deployment service account and grants it
`roles/storage.objectAdmin` on the state bucket, not the project. Project roles
come exclusively from `terraform_project_roles` and should be reviewed before
each bootstrap apply.
