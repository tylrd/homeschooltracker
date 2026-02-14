do_ssh_key_fingerprints = ["16:cb:ff:c8:6a:a2:28:13:4c:2e:1a:2d:b5:c2:8a:68"]
region                  = "nyc3"
droplet_name            = "homeschooltracker"
droplet_size            = "s-1vcpu-1gb"
image                   = "ubuntu-24-04-x64"
ansible_playbook        = "./playbooks/site.yml"
ansible_extra_args      = "-vv"
