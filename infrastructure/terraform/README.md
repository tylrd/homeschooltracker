# Terraform: DigitalOcean droplet + Ansible bootstrap

## What this creates
- A DigitalOcean droplet.
- Cloud-init configuration that creates an `ansible` user and adds a public key loaded from `ansible_public_key_path` (defaults to `~/.ssh/id_ed25519.pub`).
- A `remote-exec` readiness step (using your local SSH agent) that waits for SSH and cloud-init completion.
- A `local-exec` step that runs `ansible-playbook` after the host is ready.

## Usage
1. Copy and edit variables:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```
2. Set real values in `terraform.tfvars`.
3. Run:
   ```bash
   terraform init
   terraform apply
   ```

## Notes
- `ansible-playbook` and `ssh` must be available on your local machine.
- Ensure your SSH agent has the private key matching `ansible_public_key_path` loaded (`ssh-add -l` to verify).
- `null_resource.wait_for_host_ready` uses SSH agent auth and runs `cloud-init status --wait`.
- `null_resource.run_ansible` re-runs when droplet IP/playbook/extra args change.
- Keep `do_token` secure and out of version control.
