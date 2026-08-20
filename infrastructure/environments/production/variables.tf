variable "project_id" {
  description = "Google Cloud project ID for the production environment."
  type        = string
}

variable "region" {
  description = "Default Google Cloud region for regional resources."
  type        = string
  default     = "us-central1"
}
