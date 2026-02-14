# Ansible droplet bootstrap

This setup targets a single droplet at `10.108.0.2` and applies:

- `geerlingguy.security` for baseline hardening
- `geerlingguy.docker` for Docker installation

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
- Default SSH user is `root`; change it if your droplet uses another user.
- Hardened SSH defaults are in `group_vars/all.yml`; update before first run as needed.
