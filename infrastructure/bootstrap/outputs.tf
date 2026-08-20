output "workload_identity_provider" {
  description = "Set this as GCP_WORKLOAD_IDENTITY_PROVIDER in each GitHub Environment."
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "terraform_service_account" {
  description = "Set this as GCP_SERVICE_ACCOUNT in each GitHub Environment."
  value       = google_service_account.terraform.email
}

output "project_id" {
  description = "Set this as GCP_PROJECT_ID in each GitHub Environment."
  value       = var.project_id
}
