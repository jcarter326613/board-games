# Infrastructure

Terraform root modules are separated by deployment environment:

- `environments/development` manages the development deployment.
- `environments/production` manages the production deployment.
- `bootstrap` is applied manually by a project administrator to configure
  GitHub OIDC and deployment permissions.
- `modules` will contain reusable GCP infrastructure modules as services are added.

## Remote state

Each environment has a tracked `backend.hcl` file. Paste the GCS backend
settings for that environment into its file. For example:

```hcl
bucket = "board-games-terraform-state"
prefix = "development"
```

The state bucket must exist before Terraform is initialized. Give the GitHub
Actions deployment service account permission to read and write objects in the
state bucket.

## Local commands

Run Terraform commands from the selected environment directory:

```bash
terraform init -backend-config=backend.hcl
terraform plan
```

## GitHub Actions setup

Create `development` and `production` GitHub Environments. Set these GitHub
Environment variables in both:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`: full Google Cloud Workload Identity
  Provider resource name.
- `GCP_SERVICE_ACCOUNT`: deployment service account email address.
- `GCP_PROJECT_ID`: Google Cloud project ID for the selected environment.

Configure the GitHub-to-Google Cloud Workload Identity Federation trust and
grant the deployment service account the roles required by the resources it
will manage. Protect the `production` GitHub Environment with required
reviewers before enabling production deployments.

Pull requests run Terraform formatting and validation without accessing remote
state. Apply runs are started manually through the `Terraform Apply` workflow
and authenticate with GitHub OIDC; no service-account key is stored in this
repository.
