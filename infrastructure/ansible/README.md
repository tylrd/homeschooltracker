# Ansible droplet bootstrap

This setup targets a single droplet and applies:

- `geerlingguy.security` for baseline hardening
- `geerlingguy.docker` for Docker installation
- `nginx_site` local role for a basic web server on port 80
- `landing_page` local role to deploy static HTML at `/var/www/landing/index.html`

## 1) Install role dependencies

```bash
ansible-galaxy install -r requirements.yml
```

## 2) Run the playbook

```bash
ansible-playbook playbooks/site.yml
```

## Notes

- Inventory is configured in `inventories/production/hosts.yml`.
- Default SSH user is set in inventory; change it if your droplet uses another user.
- Hardened SSH defaults are in `group_vars/all.yml`; update before first run as needed.
- Port `80` is allowed by UFW and serves `homeschoolkeeper.app` with a static "Coming soon" page.
- Other host headers are denied by the default server block.
