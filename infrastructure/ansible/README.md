# Ansible droplet bootstrap

This setup targets a single droplet and applies:

- `geerlingguy.security` for baseline hardening
- `geerlingguy.docker` for Docker installation
- `docker_compose_app` local role to manage `/home/ansible/homeschool-docker` and run the app stack with Docker Compose
- `nginx_site` local role to reverse proxy `homeschoolkeeper.app` to the app on `127.0.0.1:3000`

## 1) Install role dependencies

```bash
ansible-galaxy install -r requirements.yml
```

## 2) Run the playbook

```bash
ansible-playbook playbooks/site.yml
```

To force pull and container recreation in one run:

```bash
ansible-playbook playbooks/site.yml -e docker_compose_pull_policy=always -e docker_compose_recreate=always
```

## Notes

- Inventory is configured in `inventories/production/hosts.yml`.
- Default SSH user is set in inventory; change it if your droplet uses another user.
- Hardened SSH defaults are in `group_vars/all.yml`; update before first run as needed.
- Create and manage `/home/ansible/homeschool-docker/.env` manually on the host; this playbook does not manage that file.
- Port `80` is allowed by UFW and serves `homeschoolkeeper.app` via reverse proxy to the Dockerized app.
- Other host headers are denied by the default server block.
