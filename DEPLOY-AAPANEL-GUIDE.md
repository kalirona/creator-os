# 🚀 Deploying CreatorOS in Docker via aaPanel (Complete Guide)

This guide walks you through deploying your CreatorOS Next.js application to a server using **aaPanel** and **Docker**.

---

## 📋 Prerequisites

### 1. aaPanel Installed & Accessible
- aaPanel must be installed on your target server.
  - **Linux install script** (Ubuntu/Debian/CentOS):
    ```bash
    wget -O install.sh  http://www.aapanel.com/script/install_6.0_en.sh && sudo bash install.sh
    ```
  - After installation, log into the aaPanel web UI (default `http://your-server-ip:8888`).

### 2. Docker Installed via aaPanel
- Go to aaPanel → **"Docker"** (under the "Software" or "Apps" section).
- Install Docker if it's not already installed.
- After installation, start Docker and set it to start on boot.

> **Alternative:** Install Docker manually and add the docker socket path in aaPanel settings:
> ```
> unix:///var/run/docker.sock
> ```

### 3. Server Environment
- A Linux VPS (Ubuntu 22.04/24.04 recommended).
- Public IP address and a domain name (optional but recommended).
- Port **8888** (aaPanel), **80** (HTTP), **443** (HTTPS), and **3007** (app port) open in the firewall.

---

## 🎯 Option A: Quick Deployment via aaPanel File Manager

This is the simplest method — upload your project files and run `docker-compose up` directly from aaPanel's terminal.

### Step 1: Upload Project Files
1. In aaPanel, go to **"File"** → **"Upload"** (or use the file manager).
   2. Upload your entire project folder (including `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh`, `.dockerignore`, `.env`, and all `src/`, `prisma/`, etc.) to `/www/wwwroot/creatoros`.
    - If uploading as a ZIP, extract it in-place using aaPanel's file manager (right-click → "Extract").
    - **Important:** Ensure all files have **LF** (Unix) line endings, NOT CRLF (Windows). CRLF in `Dockerfile`, `.dockerignore`, and `docker-compose.yml` causes the Docker build to fail with `failed to read dockerfile: open Dockerfile: no such file or directory`.
      - **Recommended:** Deploy via `git clone https://github.com/kalirona/creator-os.git` on the server instead of manual upload — the `.gitattributes` file in the repo enforces LF line endings automatically.
      - **If uploading manually:** Run `sed -i 's/\r$//' Dockerfile .dockerignore docker-compose.yml docker-entrypoint.sh` after extraction to convert CRLF → LF.

### Step 2: Configure Environment Variables
Edit the `.env` file at `/www/wwwroot/creatoros/.env`:
```env
AUTH_SECRET=your-strong-32-char-secret-key-here-1234567890
DATABASE_URL=file:/app/data/creatoros.db
AUTH_COOKIE_SECURE=false
PRIMARY_HOSTS=yourdomain.com,www.yourdomain.com
```

> **Security tip:** Change `AUTH_SECRET` to a random 32+ character string. You can generate one with `openssl rand -base64 48`.

### Step 3: Build & Start the Container
Open aaPanel's **Terminal** (or SSH into the server) and run:
```bash
cd /www/wwwroot/creatoros
docker compose up -d --build
```

> If your aaPanel uses an older Docker Compose version, use `docker-compose` instead of `docker compose`.

### Step 4: Verify
- Go to **"Docker"** → **"Container List"** in aaPanel to see your `creator-os` container running.
- Click **"Logs"** to verify no errors.
- Visit `http://your-server-ip:3007` — you should see your CreatorOS app.

---

## 🌐 Option B: Behind aaPanel Nginx Reverse Proxy (Port 80/443)

This method maps the app behind port 80/443 via aaPanel's reverse proxy (no Caddy needed).

### Step 1: Upload & Configure as in Option A
Follow Steps 1–2 from Option A. Do NOT start the container yet.

### Step 2: Modify `docker-compose.yml` (Optional)
If you want the container to listen on a different port (e.g., `3008`) and let aaPanel Nginx proxy to it:

Edit `/www/wwwroot/creatoros/docker-compose.yml`:
```yaml
services:
  creator-os:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: creator-os
    restart: unless-stopped
    ports:
      - "3008:3007"          # host:container — change 3008 if desired
    environment:
      - NODE_ENV=production
      - PORT=3007
      - HOSTNAME=0.0.0.0
      - DATABASE_URL=file:/app/data/creatoros.db
      - AUTH_SECRET=your-strong-secret-here
      - AUTH_COOKIE_SECURE=false
      - PRIMARY_HOSTS=yourdomain.com,www.yourdomain.com
    volumes:
      - creator-os-data:/app/data
    healthcheck:
      test: ["CMD", "bun", "-e", "fetch('http://localhost:3007').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s

volumes:
  creator-os-data:
```

> **Important:** If you change the container port, make sure `PORT=3007` (the value the app listens on *inside* the container) matches what the `Dockerfile` `ENV PORT=3007` and `docker-entrypoint.sh` expect. The `HOST:CONTAINER` mapping in `ports:` is what you change (e.g., `3008:3007`).

### Step 3: Build & Start
```bash
cd /www/wwwroot/creatoros
docker compose up -d --build
```

### Step 4: Create a Site in aaPanel
1. In aaPanel, go to **"Web Sites"** → **"Add Site"**.
2. Choose **"Domain Name"** proxy type (or just use your IP/subdomain).
3. Enter your domain (e.g., `app.yourdomain.com`) and click **Create**.
4. Click the **"Proxy"** (reverse proxy) settings for this site.
5. Set the proxy target to `http://127.0.0.1:3008` (or whichever host port you used).
6. Add these proxy headers:
   - `Host` → `{host}`
   - `X-Forwarded-For` → `{remote_addr}`
   - `X-Forwarded-Proto` → `{scheme}`
   - `X-Real-IP` → `{remote_addr}`

### Step 5: (Optional) Enable HTTPS via Let's Encrypt
1. In the site's settings, click **"SSL"** → **"Let's Encrypt"**.
2. Select your domain and apply.
3. Enable **force HTTPS** in the site's settings.

> **Important:** If you enable HTTPS, set `AUTH_COOKIE_SECURE=true` in `.env` or the `docker-compose.yml` environment section.

---

## 🐳 Option C: Using aaPanel's Built-in Docker Compose (No CLI)

### Step 1: Upload Files
As in Option A, upload your project to `/www/wwwroot/creatoros`.

### Step 2: Add Compose Stack via aaPanel Docker Interface
1. In aaPanel, go to **"Docker"** → **"Compose"** (or **"Compose Projects"**).
2. Click **"Add"** and enter a name like `creatoros`.
3. Paste your `docker-compose.yml` content into the editor (aaPanel may let you input YAML directly).
4. Set the **working directory** to `/www/wwwroot/creatoros`.
5. Click **"Deploy"** or **"Start"**.

### Step 3: Manage
- You can now **start**, **stop**, **restart**, view **logs**, and monitor resource **metrics** all from the aaPanel Docker UI.
- The named volume `creator-os-data` will persist your SQLite database between container restarts.

---

## 📦 Data Persistence & Backups

### Volumes
The `docker-compose.yml` defines a named volume `creator-os-data` that persists `/app/data` (your SQLite DB). This survives container recreation.

### Backup the Database
```bash
docker exec creator-os sh -c "cp /app/data/creatoros.db /tmp/backup-$(date +%F).db"
docker cp creator-os:/tmp/backup-*.db /www/backup/
```
Or schedule this with aaPanel's **"Scheduled Tasks"** (Cron) feature.

### Restore the Database
```bash
docker cp /path/to/backup.db creator-os:/app/data/creatoros.db
docker restart creator-os
```

---

## 🔧 Useful aaPanel + Docker Commands (via Terminal or SSH)

| Task | Command |
|------|---------|
| Check container status | `docker ps` |
| View container logs | `docker logs creator-os` |
| Restart the app | `docker compose -f /www/wwwroot/creatoros/docker-compose.yml restart` |
| Rebuild after code changes | `docker compose -f /www/wwwroot/creatoros/docker-compose.yml up -d --build` |
| Stop & remove the container | `docker compose -f /www/wwwroot/creatoros/docker-compose.yml down` |
| Shell into the running container | `docker exec -it creator-os sh` |

---

## 🛡️ Firewall & Ports

| Port | Purpose |
|------|---------|
| `8888` | aaPanel web UI (change from default for security) |
| `80` | HTTP (proxied to app) |
| `443` | HTTPS (proxied to app) |
| `3007` or `3008` | Direct app port (only if bypassing aaPanel Nginx proxy) |

In aaPanel, go to **"Security"** → **"Firewall"** and ensure these ports are open. Or use `ufw`/`firewalld` directly.

---

## ✅ Post-Deployment Checklist

- [ ] App is accessible at your domain/IP (or port 3007/3008).
- [ ] Database is creating correctly (check container logs for "Database schema ready").
- [ ] Authentication is working (register a user).
- [ ] `AUTH_SECRET` is set to a strong, unique value.
- [ ] `AUTH_COOKIE_SECURE` is set to `true` if serving over HTTPS only.
- [ ] `PRIMARY_HOSTS` includes your real domain(s).
- [ ] SSL is enabled if using HTTPS (set `AUTH_COOKIE_SECURE=true`).
- [ ] Auto-restart is enabled (`restart: unless-stopped` in compose — ✅ already set).

---

## 🆘 Troubleshooting

### Container keeps restarting
```bash
docker logs creator-os
```
Common causes: invalid `AUTH_SECRET` length, Prisma schema mismatch, or port conflict.

### Can't access the site on port 3007
- Ensure the firewall allows the port.
- Check `docker ps` to confirm the port is mapped.
- Verify `HOST=0.0.0.0` and `PORT=3007` are in the environment.

### Database errors
```bash
docker exec -it creator-os sh
ls /app/data/
```
Confirm the SQLite file exists. Check `.env` `DATABASE_URL` is correctly set.

### Nginx 502 Bad Gateway (aaPanel)
- Ensure the proxy target port matches the `ports` host mapping in compose.
- Check `docker logs creator-os` for errors.

### Need to redeploy with new env vars
```bash
cd /www/wwwroot/creatoros
# Edit .env or docker-compose.yml
docker compose up -d --build --force-recreate
```

### aaPanel can't connect to Docker
- Ensure the Docker service is running: `sudo systemctl status docker`
- In aaPanel Docker settings, ensure the Docker socket path is correct:
  ```
  unix:///var/run/docker.sock
  ```

---

## 📖 Summary (TL;DR)

1. **Install Docker** in aaPanel.
2. **Upload** your project files to `/www/wwwroot/creatoros`.
3. **Edit `.env`** — set a strong `AUTH_SECRET`, correct domain in `PRIMARY_HOSTS`, etc.
4. (Optional) Set `AUTH_COOKIE_SECURE=true` for HTTPS.
5. Run `docker compose up -d --build`.
6. (Optional) Set up **aaPanel Nginx reverse proxy + SSL** for port 80/443.
7. **Monitor logs** from the aaPanel Docker UI.

---

For questions, check the [aaPanel documentation](https://www.aapanel.com) or the [Docker guides](https://docs.docker.com).
