output "droplet_id" {
  value = digitalocean_droplet.this.id
}

output "droplet_ipv4" {
  value = digitalocean_droplet.this.ipv4_address
}
