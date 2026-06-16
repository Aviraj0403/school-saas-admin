# Jitsi Self-Hosting Guide for School SaaS

This guide explains how to bypass the 5-minute limit on the public `meet.jit.si` server by hosting your own 100% free, unlimited Jitsi server for the School SaaS platform.

## Why Self-Host?
By default, embedding the public `meet.jit.si` server in an iframe is considered "demo mode" by 8x8 (the company running it) and they enforce a strict **5-minute disconnect limit** for commercial/unregistered apps. To get free unlimited video classes, you must host Jitsi yourself.

## Prerequisites
- A cloud VPS (e.g., DigitalOcean Droplet, AWS EC2, or Hetzner) running Ubuntu/Debian. A basic $5-$10/month server is enough for most small-to-medium schools.
- A registered domain or subdomain (e.g., `meet.yourschool.com`) pointed to your server's IP address.

## Step-by-Step Installation (Using Docker)

The easiest and recommended way to host Jitsi is using their official Docker Compose package.

### 1. Install Docker
Log into your VPS and install Docker and Docker Compose:
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
```

### 2. Download Jitsi Docker
Clone the official Jitsi Docker repository:
```bash
git clone https://github.com/jitsi/docker-jitsi-meet
cd docker-jitsi-meet
```

### 3. Configure the Environment
Copy the example configuration:
```bash
cp env.example .env
```

Generate secure passwords for the internal Jitsi components:
```bash
./gen-passwords.sh
```

### 4. Edit the `.env` File
Open the `.env` file (`nano .env`) and update the following critical lines:

```ini
# Your actual domain/subdomain
PUBLIC_URL=https://meet.yourschool.com

# Enable Let's Encrypt for a free SSL Certificate
ENABLE_LETSENCRYPT=1
LETSENCRYPT_DOMAIN=meet.yourschool.com
LETSENCRYPT_EMAIL=admin@yourschool.com
```

### 5. Start the Server
Start all the Jitsi containers in the background:
```bash
docker-compose up -d
```

Wait a few minutes for the SSL certificates to generate. Your custom Jitsi server is now live at `https://meet.yourschool.com`.

---

## Connecting Your SaaS Platform

Once your server is running, you need to tell the School SaaS frontend to use your new server instead of the public one.

1. Open `school-saas-admin/.env.local` (or your production environment variables).
2. Set the Jitsi domain variable to your new domain:

```ini
NEXT_PUBLIC_JITSI_DOMAIN=meet.yourschool.com
```

3. Restart your frontend server. 

All your online classes will now seamlessly connect through your private server with **no limits** and **no costs**!

## Official Resources
- [Jitsi Meet GitHub Repository](https://github.com/jitsi/jitsi-meet)
- [Jitsi Docker Repository](https://github.com/jitsi/docker-jitsi-meet)
