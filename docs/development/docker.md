# Running Grove MVP in Docker for Development

## Overview

This guide shows you how to run the entire Grove MVP development environment inside Docker containers, with services accessible from your host machine (your laptop/desktop).

**Benefits**:
- ✅ Consistent environment (same Node version, dependencies)
- ✅ No local Node.js/PostgreSQL/Redis installation needed
- ✅ Hot reload works (file changes auto-reload)
- ✅ Database and Redis included
- ✅ Access frontend/backend from your browser on host
- ✅ Easy cleanup (just stop containers)

**Architecture**:
```
Host Machine (Your Laptop)
│
├─ Browser → http://localhost:5173 (Frontend)
├─ Browser → http://localhost:4000 (Backend API)
│
└─ Docker Container (grove-mvp-dev)
   ├─ Vite Dev Server (port 5173)
   ├─ NestJS Dev Server (port 4000)
   │
   ├─ PostgreSQL Container (port 5433 → 5432)
   └─ Redis Container (port 6379 → 6379)
```

---

## Quick Start

### 1. Start Docker Containers

```bash
# From project root
docker-compose up -d

# Wait for containers to start (~30 seconds)
docker-compose ps
```

You should see 3 containers running:
- `grove-mvp-dev` (main app container)
- `grove-postgres` (database)
- `grove-redis` (cache)

### 2. Enter Container and Start Dev Servers

```bash
# Enter the container
docker exec -it grove-mvp-dev bash

# Inside container, run startup script
./dev-start.sh
```

The script will:
- ✅ Check PostgreSQL and Redis are ready
- ✅ Install dependencies (if needed)
- ✅ Run database migrations
- ✅ Start backend dev server (http://0.0.0.0:4000)
- ✅ Start frontend dev server (http://0.0.0.0:5173)

### 3. Access from Your Browser

On your **host machine** (outside Docker), open:

**Frontend**: http://localhost:5173
**Backend API**: http://localhost:4000/api/health

**Done!** 🎉 You're running the full app in Docker.

---

## Development Workflow

### Making Code Changes

**All file changes sync automatically** between host and container:

```bash
# On host machine (your normal editor):
# Edit src/components/Dashboard.tsx
# Save file

# Container automatically detects change
# Vite hot-reloads
# Browser updates instantly ✨
```

Same for backend:
```bash
# Edit grove-backend/src/profiles/profiles.service.ts
# Save file
# NestJS auto-restarts
# API updates instantly ✨
```

### Viewing Logs

**Inside container**:
```bash
# View both logs
tail -f logs/frontend.log logs/backend.log

# Or separately
tail -f logs/frontend.log  # Frontend only
tail -f logs/backend.log   # Backend only
```

**From host machine**:
```bash
# View container logs
docker-compose logs -f grove-dev

# View database logs
docker-compose logs -f postgres
```

### Stopping Servers

**Inside container** (if you started with `./dev-start.sh`):
```bash
# Press Ctrl+C
# Servers will stop gracefully
```

**Stop containers**:
```bash
# From host machine
docker-compose down

# Or just stop (keeps data):
docker-compose stop
```

---

## Common Tasks

### Running Commands Inside Container

**From host machine**:
```bash
# Run any command in container
docker exec -it grove-mvp-dev <command>

# Examples:
docker exec -it grove-mvp-dev npm install
docker exec -it grove-mvp-dev npx prisma studio
docker exec -it grove-mvp-dev npm run build
```

**From inside container**:
```bash
# Enter container first
docker exec -it grove-mvp-dev bash

# Then run commands normally
npm install
npx prisma studio
npm run test
```

### Database Tasks

**Access PostgreSQL**:
```bash
# From host machine
psql postgresql://postgres:postgres@localhost:5433/grove_mvp

# Or from inside container
docker exec -it grove-mvp-dev bash
psql postgresql://postgres:postgres@postgres:5432/grove_mvp
```

**Run migrations**:
```bash
# Inside container
cd grove-backend
npx prisma migrate dev --name your_migration_name
npx prisma migrate deploy
```

**Prisma Studio** (Database GUI):
```bash
# Inside container
cd grove-backend
npx prisma studio

# Access from host browser: http://localhost:5555
```

**Note**: You'll need to expose port 5555 in docker-compose.yml if you want Prisma Studio accessible from host.

### Redis Tasks

**Access Redis CLI**:
```bash
# From host machine
redis-cli -h localhost -p 6379

# Or from inside container
docker exec -it grove-redis redis-cli

# Common commands:
PING           # Test connection
KEYS *         # List all keys
GET key_name   # Get value
FLUSHALL       # Clear all data
```

### Installing New Dependencies

**Frontend**:
```bash
# Inside container
npm install <package-name>

# Or from host
docker exec -it grove-mvp-dev npm install <package-name>
```

**Backend**:
```bash
# Inside container
cd grove-backend
npm install <package-name>

# Or from host
docker exec -it grove-mvp-dev bash -c "cd grove-backend && npm install <package-name>"
```

**Important**: Dependencies installed in container stay in container (due to volume mount for node_modules).

---

## Troubleshooting

### Port Already in Use

**Symptom**: `Error: Port 5173 is already allocated`

**Solution**:
```bash
# Check what's using the port
lsof -i :5173
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml:
ports:
  - "5174:5173"  # Use 5174 on host instead
```

### Can't Access from Host

**Symptom**: `localhost:5173` not loading

**Check**:
1. Containers running?
   ```bash
   docker-compose ps
   ```

2. Servers started in container?
   ```bash
   docker exec -it grove-mvp-dev bash
   # Inside container:
   curl http://localhost:5173  # Should return HTML
   curl http://localhost:4000/api/health  # Should return {"status":"ok"}
   ```

3. Check Vite config has `host: '0.0.0.0'`
4. Check NestJS main.ts has `app.listen(port, '0.0.0.0')`

### Database Connection Error

**Symptom**: `Can't reach database server at postgres:5432`

**Solution**:
```bash
# Check PostgreSQL container is running
docker-compose ps postgres

# If not, start it
docker-compose up -d postgres

# Test connection
docker exec -it grove-mvp-dev bash
pg_isready -h postgres -U postgres
```

### Hot Reload Not Working

**Symptom**: File changes don't reload

**Solution**:
```bash
# Restart dev servers
# Inside container, press Ctrl+C
# Then re-run:
./dev-start.sh

# Or check file sync:
docker exec -it grove-mvp-dev bash
ls -la src/  # Files should match host
```

**Windows users**: May need to enable polling:

```typescript
// vite.config.ts
server: {
  watch: {
    usePolling: true,
  }
}
```

### Container Won't Start

**Symptom**: `docker-compose up -d` fails

**Solution**:
```bash
# View logs
docker-compose logs grove-dev

# Rebuild container
docker-compose build --no-cache
docker-compose up -d

# Clean slate:
docker-compose down -v  # CAUTION: Deletes database data
docker-compose up -d --build
```

---

## Port Reference

| Service | Container Port | Host Port | Access From Host |
|---------|---------------|-----------|------------------|
| Frontend (Vite) | 5173 | 5173 | http://localhost:5173 |
| Backend (NestJS) | 4000 | 4000 | http://localhost:4000/api |
| PostgreSQL | 5432 | 5433 | postgresql://localhost:5433/grove_mvp |
| Redis | 6379 | 6379 | redis://localhost:6379 |
| Prisma Studio | 5555 | (not exposed) | Add to docker-compose.yml |

---

## Environment Variables

**Frontend** (`.env` in project root):
```bash
VITE_API_URL=http://localhost:4000/api
VITE_SENTRY_DSN=your-sentry-dsn
```

**Backend** (`grove-backend/.env`):
```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/grove_mvp
REDIS_HOST=redis
REDIS_PORT=6379

JWT_SECRET=your-secret-here
ENCRYPTION_KEY=your-encryption-key-here

POSTMARK_API_KEY=your-postmark-key
FROM_EMAIL=noreply@yourdomain.com

OPENAI_API_KEY=your-openai-key
```

**Docker Compose** (already configured in `docker-compose.yml`):
```yaml
environment:
  - NODE_ENV=development
```

---

## Performance Tips

### Exclude node_modules from Scanning

If your editor is slow, exclude Docker volumes:

**VS Code** (`.vscode/settings.json`):
```json
{
  "files.watcherExclude": {
    "**/node_modules": true,
    "**/grove-backend/node_modules": true
  }
}
```

### Allocate More Resources

**Docker Desktop Settings**:
- CPUs: 4+ cores
- Memory: 4-8 GB
- Disk: 20+ GB

**docker-compose.yml** (already configured):
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
```

---

## Alternative: Run Servers Manually

If you don't want to use `dev-start.sh`:

**Terminal 1 - Backend**:
```bash
docker exec -it grove-mvp-dev bash
cd grove-backend
npm run start:dev
```

**Terminal 2 - Frontend**:
```bash
docker exec -it grove-mvp-dev bash
npm run dev
```

---

## Clean Up

**Stop but keep data**:
```bash
docker-compose stop
```

**Stop and remove containers (keeps database data)**:
```bash
docker-compose down
```

**Remove everything including database data**:
```bash
docker-compose down -v
```

**Remove images too**:
```bash
docker-compose down -v --rmi all
```

---

## Next Steps

1. **Make code changes** on host with your editor
2. **See changes instantly** in browser (hot reload)
3. **Access database** with Prisma Studio or psql
4. **Run tests** inside container
5. **Deploy** when ready (see DEPLOYMENT_QUICKSTART.md)

---

## Comparison: Docker vs Local

| Aspect | Docker | Local |
|--------|--------|-------|
| Setup | `docker-compose up` | Install Node, PostgreSQL, Redis |
| Environment | Consistent | Varies by machine |
| Cleanup | `docker-compose down` | Uninstall everything |
| Hot Reload | ✅ Works | ✅ Works |
| Speed | Slightly slower | Faster |
| Isolation | ✅ Complete | Shared with system |
| Team Consistency | ✅ Everyone same | Varies |

**Recommendation**: Use Docker for development if you want consistency and easy setup/cleanup.

---

**Updated**: 2025-10-23
**Works With**: Grove MVP Phases 0-3
**Docker Version**: 20.10+
**Docker Compose Version**: 2.0+
