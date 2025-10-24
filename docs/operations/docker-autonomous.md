# Docker Sandbox Setup for Autonomous Claude Code - Universal Guide

## Purpose

This guide enables you to set up a Docker-based sandbox environment that allows Claude Code to run autonomously with `--dangerously-skip-permission` safely, regardless of your tech stack.

## Why Docker Sandboxing?

### The Problem

Claude Code's `--dangerously-skip-permission` flag allows autonomous operation without user approval for each action. This is powerful for long-running tasks but risky because Claude can:
- Modify any file
- Execute any command
- Install packages
- Make network requests
- Potentially cause unintended damage

### The Solution

Docker containerization provides isolation:
- **Filesystem isolation**: Container cannot access host system files outside the project
- **Resource limits**: Control CPU, memory, and disk usage
- **Network controls**: Optionally restrict internet access
- **Disposability**: Easily destroy and recreate if something goes wrong
- **Auditability**: All changes happen in one place, reviewable via git

### Security Philosophy

As noted in [Simon Willison's article on Claude Code security](https://simonwillison.net/2025/Oct/22/living-dangerously-with-claude/):

> "The best sandboxes are the ones that run on someone else's computer! That way the worst that can happen is someone else's computer getting owned."

While cloud-based sandboxes are ideal, Docker provides practical local isolation that significantly reduces risk.

## Architecture Overview

```
┌────────────────────────────────────────────────────┐
│ Host Machine                                       │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Docker Container (Isolated)                  │ │
│  │                                              │ │
│  │  ├─ Language Runtime (Node/Python/Ruby/etc) │ │
│  │  ├─ Claude Code CLI                         │ │
│  │  ├─ Project Code (mounted as volume)        │ │
│  │  ├─ Dependencies                            │ │
│  │  └─ Development Tools (git, etc)            │ │
│  │                                              │ │
│  │  Claude Code runs here autonomously         │ │
│  │  Changes are written to mounted volume      │ │
│  │  Host system is protected                   │ │
│  └──────────────────────────────────────────────┘ │
│         ↕ (volume mount)                           │
│  Your project files (reviewable via git)          │
└────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Docker Desktop** installed ([download](https://www.docker.com/products/docker-desktop/))
2. **Anthropic API key** for Claude Code
3. **Git** for version control and rollback
4. **Your project** with dependencies defined (package.json, requirements.txt, etc.)

## Universal Setup Process

### Step 1: Create Dockerfile.dev

Create a file named `Dockerfile.dev` in your project root. This defines the container environment.

**Template Structure:**
```dockerfile
# Step 1: Choose base image for your stack
FROM <base-image>

# Step 2: Install Claude Code CLI (requires Node.js)
# If your base image doesn't have Node.js, install it first
RUN npm install -g @anthropic-ai/claude-code

# Step 3: Install development tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Step 4: Set working directory
WORKDIR <work-dir>

# Step 5: Copy dependency definition files
COPY <dependency-files> .

# Step 6: Install dependencies
RUN <install-command>

# Step 7: Expose ports for dev servers
EXPOSE <port>

# Step 8: Default command
CMD ["/bin/bash"]
```

### Step 2: Create docker-compose.yml

Create a file named `docker-compose.yml` in your project root. This orchestrates the container.

**Template Structure:**
```yaml
version: '3.8'

services:
  dev-container:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: <project-name>-dev
    volumes:
      # Mount project directory
      - .:<work-dir>
      # Prevent dependency directories from being overwritten
      - <work-dir>/<dependency-dir>
    ports:
      # Map container port to host
      - "<host-port>:<container-port>"
    environment:
      # Set environment variables
      - ENV_VAR_NAME=value
    # Optional: Resource limits
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    # Keep container running
    stdin_open: true
    tty: true
```

### Step 3: Create .dockerignore

Create a file named `.dockerignore` to exclude files from Docker context.

**Universal Template:**
```
# Dependencies (will be installed in container)
node_modules
__pycache__
*.pyc
vendor
.bundle

# Build outputs
dist
build
target
*.o
*.so

# Version control
.git
.gitignore

# IDE
.vscode
.idea
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Environment files (add if they contain secrets)
.env.local
.env.production

# Other
.claude
.vercel
coverage
```

### Step 4: Configure for Your Stack

Choose your stack below and customize the template:

---

## Stack-Specific Configurations

### Node.js / JavaScript / TypeScript

**Dockerfile.dev:**
```dockerfile
FROM node:20-bookworm

# Install Claude Code
RUN npm install -g @anthropic-ai/claude-code

# Install tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

EXPOSE 3000

CMD ["/bin/bash"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  dev-container:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: myapp-dev
    volumes:
      - .:/workspace
      - /workspace/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    stdin_open: true
    tty: true
```

**Common Ports:**
- React/Vite: 3000
- Next.js: 3000
- Express: 3000 or 8080
- Angular: 4200

---

### Python

**Dockerfile.dev:**
```dockerfile
FROM python:3.11-slim

# Install Node.js for Claude Code
RUN apt-get update && apt-get install -y \
    curl \
    git \
    vim \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g @anthropic-ai/claude-code \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["/bin/bash"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  dev-container:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: myapp-dev
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
      - DJANGO_SETTINGS_MODULE=myproject.settings.dev
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    stdin_open: true
    tty: true
```

**Common Ports:**
- Django: 8000
- Flask: 5000
- FastAPI: 8000

---

### Ruby / Rails

**Dockerfile.dev:**
```dockerfile
FROM ruby:3.2

# Install Node.js for Claude Code and Rails asset pipeline
RUN apt-get update && apt-get install -y \
    curl \
    git \
    vim \
    build-essential \
    libpq-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g @anthropic-ai/claude-code \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Gemfile
COPY Gemfile Gemfile.lock ./

# Install gems
RUN bundle install

EXPOSE 3000

CMD ["/bin/bash"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  dev-container:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: myapp-dev
    volumes:
      - .:/app
      - bundle_cache:/usr/local/bundle
    ports:
      - "3000:3000"
    environment:
      - RAILS_ENV=development
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    stdin_open: true
    tty: true

volumes:
  bundle_cache:
```

**Common Port:**
- Rails: 3000

---

### Go

**Dockerfile.dev:**
```dockerfile
FROM golang:1.21

# Install Node.js for Claude Code
RUN apt-get update && apt-get install -y \
    curl \
    git \
    vim \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g @anthropic-ai/claude-code \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /go/src/app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

EXPOSE 8080

CMD ["/bin/bash"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  dev-container:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: myapp-dev
    volumes:
      - .:/go/src/app
    ports:
      - "8080:8080"
    environment:
      - GO_ENV=development
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    stdin_open: true
    tty: true
```

**Common Port:**
- Go web apps: 8080

---

### PHP / Laravel

**Dockerfile.dev:**
```dockerfile
FROM php:8.2-cli

# Install Node.js for Claude Code and Composer
RUN apt-get update && apt-get install -y \
    curl \
    git \
    vim \
    zip \
    unzip \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g @anthropic-ai/claude-code \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install

EXPOSE 8000

CMD ["/bin/bash"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  dev-container:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: myapp-dev
    volumes:
      - .:/app
      - /app/vendor
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=development
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    stdin_open: true
    tty: true
```

**Common Port:**
- Laravel: 8000

---

### Multi-Service Projects (with Database)

**docker-compose.yml example with PostgreSQL:**
```yaml
version: '3.8'

services:
  dev-container:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: myapp-dev
    volumes:
      - .:/workspace
      - /workspace/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@db:5432/myapp_dev
    depends_on:
      - db
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    stdin_open: true
    tty: true

  db:
    image: postgres:16
    container_name: myapp-db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

**Other database options:**
- MySQL: `image: mysql:8`
- Redis: `image: redis:7`
- MongoDB: `image: mongo:7`

---

## Usage Instructions

### Build the Container

```bash
docker-compose build
```

This will:
1. Download the base image
2. Install Claude Code CLI
3. Install your project dependencies
4. Create the container image

**Note:** This can take 5-15 minutes on first build. Subsequent builds are faster due to layer caching.

### Start the Container

```bash
docker-compose up -d
```

The `-d` flag runs it in detached mode (background).

### Enter the Container

```bash
docker-compose exec dev-container bash
```

You're now inside the isolated container with Claude Code installed.

### Configure Claude Code (First Time Only)

Inside the container:

```bash
# Set your API key
export ANTHROPIC_API_KEY="your-key-here"

# Or configure Claude Code interactively
claude config
```

**Pro tip:** Add the API key to docker-compose.yml environment section:
```yaml
environment:
  - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
```

Then set it on your host:
```bash
export ANTHROPIC_API_KEY="your-key-here"
```

### Run Claude Code Autonomously

Inside the container:

```bash
# Interactive mode (with permissions - safer for testing)
claude

# Autonomous mode (no permission prompts)
claude --dangerously-skip-permission "Your task description here"
```

### Example Autonomous Commands

```bash
# Feature implementation
claude --dangerously-skip-permission "Implement user authentication with email/password, including signup, login, and logout endpoints"

# Bug fixing
claude --dangerously-skip-permission "Run the test suite, identify all failing tests, debug the issues, and fix them"

# Refactoring
claude --dangerously-skip-permission "Refactor the API layer to use async/await consistently and add proper error handling"

# Documentation
claude --dangerously-skip-permission "Add comprehensive JSDoc comments to all functions in the utils directory"
```

### Exit the Container

```bash
exit
```

The container keeps running in the background. Your changes are saved to the mounted volume (your project directory on the host).

### Stop the Container

```bash
docker-compose down
```

### View Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f dev-container

# View last 50 lines
docker-compose logs --tail=50 dev-container
```

---

## Safety Best Practices

### 1. Use Git Aggressively

**Before running autonomous tasks:**
```bash
# Commit current state
git add .
git commit -m "Checkpoint before autonomous Claude task"

# Or create a branch
git checkout -b claude-feature-name
```

**After task completion:**
```bash
# Review all changes
git diff

# Review specific files
git diff path/to/file

# Use a GUI tool
git difftool

# If satisfied, commit
git add .
git commit -m "Feature implemented by Claude Code"

# If not satisfied, rollback
git reset --hard HEAD
```

### 2. Start with Bounded Tasks

Don't start with "build the entire app". Instead:

**Good examples:**
- "Implement the login form component with validation"
- "Add unit tests for the User model"
- "Create a REST API endpoint for fetching posts"
- "Fix the responsive layout on mobile"
- "Add TypeScript types to the auth module"

**Too broad:**
- "Build the entire e-commerce platform"
- "Implement everything in the requirements doc"
- "Fix all bugs in the app"

### 3. Set Task Time Limits

Start with shorter tasks (15-30 minutes) to build confidence:

```bash
# Short task
claude --dangerously-skip-permission "Add input validation to the signup form - should take about 15 minutes"
```

### 4. Review Before Deploying

**Always review generated code for:**
- Security vulnerabilities (SQL injection, XSS, etc.)
- Logic errors
- Performance issues
- Code quality and style
- Proper error handling
- Test coverage

**Never deploy directly to production without review.**

### 5. Monitor Resource Usage

```bash
# Check container resource usage
docker stats

# Limit resources in docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '2'      # Max 2 CPU cores
      memory: 4G     # Max 4GB RAM
```

---

## Advanced Configuration

### Network Restrictions

For maximum security, restrict network access:

**Option 1: Complete isolation (no internet)**
```yaml
# In docker-compose.yml
services:
  dev-container:
    network_mode: "none"
```

**Option 2: Internal network only (can access other containers but not internet)**
```yaml
services:
  dev-container:
    networks:
      - internal

networks:
  internal:
    internal: true
```

**Option 3: Custom DNS (restrict to specific domains)**
```yaml
services:
  dev-container:
    dns:
      - 8.8.8.8
      - 8.8.4.4
```

### Environment Variables from File

Create `.env` file (add to .gitignore):
```
ANTHROPIC_API_KEY=your-key
DATABASE_URL=postgresql://...
API_SECRET=your-secret
```

Reference in docker-compose.yml:
```yaml
services:
  dev-container:
    env_file:
      - .env
```

### Persistent Shell History

```yaml
services:
  dev-container:
    volumes:
      - .:/workspace
      - bash_history:/root

volumes:
  bash_history:
```

### Custom Startup Script

Create `docker-entrypoint.sh`:
```bash
#!/bin/bash
echo "Welcome to Claude Code sandbox!"
echo "Project: $(basename $(pwd))"
echo "Claude Code version: $(claude --version)"
exec "$@"
```

In Dockerfile.dev:
```dockerfile
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["/bin/bash"]
```

---

## Troubleshooting

### Claude Code Not Found

**Error:** `claude: command not found`

**Solutions:**
1. Rebuild container: `docker-compose down && docker-compose build --no-cache`
2. Manually install inside container:
   ```bash
   docker-compose exec dev-container bash
   npm install -g @anthropic-ai/claude-code
   ```

### Port Already in Use

**Error:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution:** Change host port in docker-compose.yml:
```yaml
ports:
  - "3001:3000"  # Host:Container
```

### Permission Denied Errors

**Error:** `EACCES: permission denied`

**Solution:** Fix ownership inside container:
```bash
docker-compose exec dev-container chown -R $(whoami) /workspace
```

Or add user to Dockerfile.dev:
```dockerfile
RUN useradd -m -u 1000 developer
USER developer
```

### Out of Memory

**Error:** Container crashes or becomes unresponsive

**Solutions:**
1. Increase memory limit in docker-compose.yml
2. Check usage: `docker stats`
3. Restart container: `docker-compose restart`

### Dependency Installation Fails

**Error:** Dependencies fail to install during build

**Solutions:**
1. Check dependency file is correctly copied in Dockerfile
2. Verify syntax of dependency file
3. Build with verbose output: `docker-compose build --progress=plain`
4. Clear cache and rebuild: `docker-compose build --no-cache`

### Changes Not Appearing in Container

**Problem:** Code changes on host don't appear in container

**Solutions:**
1. Verify volume mount in docker-compose.yml:
   ```yaml
   volumes:
     - .:/workspace  # Current directory → /workspace
   ```
2. Restart container: `docker-compose restart`
3. Check you're in the right directory inside container: `pwd`

### Git Issues Inside Container

**Problem:** Git commands fail or show warnings

**Solutions:**
```bash
# Configure git inside container
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Or mount your git config
```

In docker-compose.yml:
```yaml
volumes:
  - ~/.gitconfig:/root/.gitconfig:ro
```

---

## Security Checklist

Before running `--dangerously-skip-permission`, verify:

- [ ] Code is committed to git (can rollback)
- [ ] Docker container is isolated (not accessing critical host files)
- [ ] Resource limits are set (won't consume all host resources)
- [ ] Network restrictions considered (if handling sensitive data)
- [ ] Task scope is clearly defined (not too broad)
- [ ] You have time to review changes afterward
- [ ] Backup/rollback plan exists
- [ ] No production credentials in environment
- [ ] .env files with secrets are in .dockerignore
- [ ] You understand what Claude will have access to

---

## Development Workflow

### Standard Workflow

```bash
# 1. Start container
docker-compose up -d

# 2. Enter container
docker-compose exec dev-container bash

# 3. Create checkpoint
git add . && git commit -m "Before Claude task"

# 4. Run Claude autonomously
claude --dangerously-skip-permission "Implement feature X"

# 5. Exit container
exit

# 6. Review changes on host
git diff

# 7. Test the changes
npm test  # or appropriate test command

# 8. If good, commit
git add .
git commit -m "Implement feature X via Claude"

# 9. If bad, rollback
git reset --hard HEAD

# 10. Stop container when done
docker-compose down
```

### Iterative Development

```bash
# Keep container running, make multiple Claude calls
docker-compose exec dev-container bash

# Inside container:
claude --dangerously-skip-permission "Implement login UI"
# Review, commit if good

claude --dangerously-skip-permission "Add form validation"
# Review, commit if good

claude --dangerously-skip-permission "Connect login to API"
# Review, commit if good

exit
```

### Running Dev Server

Most dev servers work inside containers:

```bash
# Inside container
npm run dev        # Node.js
python manage.py runserver 0.0.0.0:8000  # Django
rails server -b 0.0.0.0  # Rails
go run main.go     # Go
```

Access from host browser: `http://localhost:<mapped-port>`

---

## Cost Considerations

Running Claude Code autonomously can consume API credits quickly:

**Typical costs:**
- Simple task (15 min): $0.50 - $2
- Medium task (1 hour): $5 - $15
- Complex task (4 hours): $20 - $60

**Cost optimization:**
1. **Be specific:** Clear, bounded tasks use fewer tokens
2. **Start interactive:** Debug in interactive mode first
3. **Review context:** Don't let Claude read unnecessary files
4. **Set boundaries:** "Don't explore beyond the auth module"
5. **Monitor usage:** Check your Anthropic dashboard

---

## When to Use Autonomous Mode

**Good use cases:**
- ✅ Repetitive refactoring (rename variables, update imports)
- ✅ Writing tests for existing code
- ✅ Implementing well-specified features
- ✅ Debugging specific, isolated issues
- ✅ Documentation generation
- ✅ Code formatting and linting fixes
- ✅ Boilerplate generation

**Bad use cases:**
- ❌ Exploratory architecture decisions
- ❌ Security-critical code without review
- ❌ Production database migrations
- ❌ Ambiguous requirements
- ❌ When you need to provide ongoing feedback
- ❌ Learning a new codebase (interactive is better)

---

## Cleanup

### Remove Everything

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker rmi $(docker images -q <project-name>*)

# Remove volumes (careful: deletes data!)
docker volume rm $(docker volume ls -q | grep <project-name>)

# Remove all unused Docker resources
docker system prune -a --volumes
```

### Keep Images, Remove Containers

```bash
# Just stop and remove containers
docker-compose down

# Restart fresh later
docker-compose up -d
```

---

## Quick Reference Commands

```bash
# Build container
docker-compose build

# Start container (background)
docker-compose up -d

# Enter container
docker-compose exec dev-container bash

# Run Claude autonomously (inside container)
claude --dangerously-skip-permission "task description"

# View logs
docker-compose logs -f dev-container

# Stop container
docker-compose down

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check resource usage
docker stats

# List running containers
docker ps

# Remove everything
docker-compose down -v
```

---

## Conclusion

This Docker sandbox approach provides practical, stack-agnostic isolation for autonomous Claude Code operation. The key principles:

1. **Isolation**: Container protects your host system
2. **Disposability**: Easy to destroy and recreate
3. **Auditability**: All changes reviewable via git
4. **Generalizability**: Works with any tech stack
5. **Practicality**: Balances security with development velocity

Remember: **Autonomous operation requires vigilance.** Always review Claude's changes before deploying to production.

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Simon Willison on Claude Code Security](https://simonwillison.net/2025/Oct/22/living-dangerously-with-claude/)

---

## Template Customization Checklist

When adapting this for your project:

- [ ] Choose correct base image for your stack
- [ ] Update dependency installation commands
- [ ] Set correct working directory
- [ ] Configure correct ports
- [ ] Add environment variables
- [ ] Update .dockerignore for your stack
- [ ] Test container builds successfully
- [ ] Verify volume mounts work
- [ ] Test Claude Code runs inside container
- [ ] Verify dev server is accessible from host
- [ ] Document any custom setup steps for your team

---

*This guide is designed to be self-contained and can be followed by a fresh Claude context window or shared with team members to set up autonomous Claude Code development safely.*
