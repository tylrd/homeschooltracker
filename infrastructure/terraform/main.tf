provider "digitalocean" {}

locals {
  cloud_init = templatefile("${path.module}/templates/cloud-init.yaml.tftpl", {
    ansible_public_key = trimspace(file(pathexpand(var.ansible_public_key_path)))
  })
}

resource "digitalocean_droplet" "this" {
  name     = var.droplet_name
  region   = var.region
  size     = var.droplet_size
  image    = var.image
  tags     = var.tags
  ssh_keys = var.do_ssh_key_fingerprints

  user_data = local.cloud_init
}

resource "null_resource" "wait_for_host_ready" {
  depends_on = [digitalocean_droplet.this]

  triggers = {
    droplet_id = tostring(digitalocean_droplet.this.id)
    droplet_ip = digitalocean_droplet.this.ipv4_address
  }

  connection {
    type    = "ssh"
    host    = digitalocean_droplet.this.ipv4_address
    user    = "root"
    agent   = true
    timeout = var.remote_exec_timeout
  }

  provisioner "remote-exec" {
    inline = [
      "cloud-init status --wait",
      "test -f /var/lib/cloud/instance/boot-finished",
    ]
  }
}

resource "null_resource" "run_ansible" {
  depends_on = [null_resource.wait_for_host_ready]

  triggers = {
    droplet_id = tostring(digitalocean_droplet.this.id)
    droplet_ip = digitalocean_droplet.this.ipv4_address
    playbook   = var.ansible_playbook
    extra_args = var.ansible_extra_args
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-lc"]
    command     = <<-EOT
      cd '${path.module}/../ansible'
      ansible-playbook \
        -i '${digitalocean_droplet.this.ipv4_address},' \
        -u ansible \
        ${var.ansible_extra_args} \
        '${var.ansible_playbook}'
    EOT
  }
}
