variable "project_id" {
  description = "Google Cloud project ID containing the Terraform state bucket and deployment resources."
  type        = string
}

variable "state_bucket_name" {
  description = "Existing GCS bucket used for Terraform state."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository allowed to impersonate the Terraform service account, in OWNER/REPOSITORY form."
  type        = string
}

variable "terraform_project_roles" {
  description = "Project-level IAM roles granted to the Terraform deployment service account."
  type        = set(string)
  default     = []
}
