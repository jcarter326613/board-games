terraform {
    backend "gcs" {
        bucket = "experimentation-506112-terraform-state"
        prefix = "board-games-development"
    }
}