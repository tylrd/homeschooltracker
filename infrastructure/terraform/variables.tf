variable "region" {
  description = "Droplet region"
  type        = string
  default     = "nyc3"
}

variable "droplet_name" {
  description = "Name of the droplet"
  type        = string
  default     = "homeschooltracker"
}

variable "droplet_size" {
  description = "Droplet size slug"
  type        = string
  default     = "s-1vcpu-1gb"
}

variable "image" {
  description = "Droplet image slug"
  type        = string
  default     = "ubuntu-24-04-x64"
}

variable "tags" {
  description = "Tags for the droplet"
  type        = list(string)
  default     = ["homeschooltracker", "ansible"]
}

variable "do_ssh_key_fingerprints" {
  description = "Optional DigitalOcean account SSH key fingerprints to install at droplet create time"
  type        = list(string)
  default     = []
}

variable "ansible_public_key_path" {
  description = "Path to the SSH public key file to add for the ansible user"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "ansible_playbook" {
  description = "Path to the Ansible playbook to run"
  type        = string
  default     = "ansible/site.yml"
}

variable "ansible_extra_args" {
  description = "Optional extra CLI args appended to ansible-playbook"
  type        = string
  default     = ""
}

variable "remote_exec_timeout" {
  description = "How long Terraform should wait for SSH connectivity for remote-exec"
  type        = string
  default     = "15m"
}
