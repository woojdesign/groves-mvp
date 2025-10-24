> **⚠️ ARCHIVED DOCUMENT**
> This document has been superseded by [Docker Autonomous Guide](/docs/operations/docker-autonomous.md).
> Kept for historical reference only.
> Last Updated: 2025-10-22

---

# Docker Setup for Safe Autonomous Claude Code Execution

## Overview

This guide explains how to set up a Docker development container to safely run Claude Code with `--dangerously-skip-permission` for autonomous, long-running tasks with minimal supervision.

## Security Rationale

Based on [Simon Willison's article](https://simonwillison.net/2025/Oct/22/living-dangerously-with-claude/), the key security principle is:

> "The best sandboxes are the ones that run on someone else's computer! That way the worst that can happen is someone else's computer getting owned."

While the article advocates for cloud-based sandboxes, Docker containers provide a practical local isolation layer by:

1. **Filesystem isolation**: Container filesystem is separated from your host system
2. **Network control**: You can restrict network access via Docker networking
3. **Resource limits**: You can set CPU, memory, and disk limits
4. **Disposability**: Easily destroy and recreate the container if something goes wrong

## Architecture

```
┌─────────────────────────────────────────┐
│ Host Machine (Your MacBook)            │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Docker Container                  │ │
│  │                                   │ │
│  │  - Node.js environment            │ │
│  │  - Claude Code CLI                │ │
│  │  - Project files (mounted)        │ │
│  │  - npm dependencies               │ │
│  │                                   │ │
│  │  Claude Code runs here with       │ │
│  │  --dangerously-skip-permission    │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## Files Required

### 1. Dockerfile.dev

```dockerfile
# Development Dockerfile for Grove MVP
# This container provides an isolated environment for Claude Code to work autonomously

FROM node:20-bookworm

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Install git and other useful dev tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Copy package files for dependency installation
# These will be cached unless package.json changes
COPY package*.json ./

# Install dependencies
RUN npm install

# The rest of the files will be mounted via docker-compose
# This allows for live code changes without rebuilding

# Expose Vite dev server port
EXPOSE 3000

# Default command: Start an interactive shell
# You can override this to run Claude Code directly
CMD ["/bin/bash"]
```

### 2. docker-compose.yml

```yaml
version: '3.8'

services:
  grove-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: grove-mvp-dev
    volumes:
      # Mount the entire project directory
      - .:/workspace
      # Prevent node_modules from being overwritten by host
      - /workspace/node_modules
    ports:
      # Vite dev server
      - "3000:3000"
    environment:
      # Set environment variables if needed
      - NODE_ENV=development
    # Optional: Limit resources
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    # Keep container running
    stdin_open: true
    tty: true
    # Optional: Restrict network access
    # network_mode: "none"  # Completely isolated
    # Or use a custom network with restricted access
```

### 3. .dockerignore

```
node_modules
dist
.git
.claude
*.log
npm-debug.log*
.DS_Store
test-output.css
.vercel
```

## Setup Instructions

### Step 1: Install Docker

If you don't have Docker Desktop installed:
```bash
brew install --cask docker
```

### Step 2: Create Docker Files

Create the three files above in your project root:
- `Dockerfile.dev`
- `docker-compose.yml`
- `.dockerignore`

### Step 3: Build the Container

```bash
docker-compose build
```

This will:
- Download the Node.js 20 base image
- Install Claude Code CLI
- Install your npm dependencies
- Cache layers for faster rebuilds

### Step 4: Start the Container

```bash
docker-compose up -d
```

The container will now be running in the background.

### Step 5: Enter the Container

```bash
docker-compose exec grove-dev bash
```

You're now inside the isolated container!

## Using Claude Code Autonomously

### Inside the Container

Once inside the container, you can run Claude Code with the dangerous flag:

```bash
claude --dangerously-skip-permission "Implement user authentication system with the following requirements..."
```

### What This Does

- **Skip permission prompts**: Claude Code will execute tools without asking for approval
- **Autonomous operation**: Claude can work through complex multi-step tasks
- **Isolated environment**: All changes happen inside the container
- **Your host machine**: Protected from accidental modifications

### Example Autonomous Tasks

```bash
# Long-running feature implementation
claude --dangerously-skip-permission "Implement the entire data visualization dashboard with charts and filters"

# Complex refactoring
claude --dangerously-skip-permission "Refactor the codebase to use TypeScript strict mode and fix all type errors"

# Testing and debugging
claude --dangerously-skip-permission "Run the test suite, identify all failing tests, and fix them"
```

## Safety Features

### 1. Filesystem Isolation

Files are mounted from your host, so changes are persisted, but:
- The container cannot access files outside the project directory
- Your system files are protected
- Easy to rollback via git

### 2. Resource Limits

The docker-compose.yml includes CPU and memory limits:
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
```

### 3. Network Control (Optional)

For maximum security, you can disable network access:

```yaml
# In docker-compose.yml
network_mode: "none"
```

Or create a custom network with restricted access:

```yaml
networks:
  restricted:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

### 4. Disposability

If something goes wrong:

```bash
# Stop and remove the container
docker-compose down

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

## Best Practices

### 1. Use Git Aggressively

Before running autonomous tasks:
```bash
git add .
git commit -m "Pre-Claude checkpoint"
```

After completion:
```bash
git diff  # Review changes
git add .  # Or selectively add
git commit -m "Feature implemented by Claude"
```

### 2. Start with Bounded Tasks

Don't start with "build the entire app". Instead:
- "Implement the login form component"
- "Add input validation to the signup flow"
- "Write tests for the API client"

### 3. Monitor Progress

You can attach to the container to watch output:
```bash
docker-compose logs -f grove-dev
```

### 4. Review Generated Code

Always review code before deploying:
- Check for security issues
- Verify logic correctness
- Ensure code quality standards
- Run tests

## Development Workflow

### Standard Development (Interactive)

```bash
# Enter container
docker-compose exec grove-dev bash

# Run Claude interactively (with permissions)
claude
```

### Autonomous Development

```bash
# Enter container
docker-compose exec grove-dev bash

# Run autonomous task
claude --dangerously-skip-permission "Your task description here"

# Exit container
exit

# Review changes on host
git diff
```

### Running the Dev Server

From inside the container:
```bash
npm run dev
```

Access the app at `http://localhost:3000` on your host machine.

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:
```yaml
# In docker-compose.yml, change:
ports:
  - "3001:3000"  # Map host 3001 to container 3000
```

### Permission Issues

If you encounter file permission issues:
```bash
# Inside container, change ownership
chown -R node:node /workspace
```

### Container Won't Start

Check logs:
```bash
docker-compose logs grove-dev
```

Rebuild:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Claude Code Not Found

Ensure it's installed in the container:
```bash
docker-compose exec grove-dev npm install -g @anthropic-ai/claude-code
```

## Advanced Configuration

### Custom Network Restrictions

For tighter network control, use Docker's `--network` flag with custom DNS:

```yaml
# docker-compose.yml
services:
  grove-dev:
    dns:
      - 8.8.8.8
    networks:
      - restricted

networks:
  restricted:
    driver: bridge
    internal: true  # No external access
```

### Volume Backups

Back up node_modules separately:
```bash
docker run --rm \
  -v grove-mvp-dev_workspace_node_modules:/source \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/node_modules.tar.gz -C /source .
```

### Multi-Container Setup

If you add a backend later:
```yaml
services:
  grove-dev:
    # ... existing config
    depends_on:
      - database

  database:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: devpassword
```

## Security Checklist

Before running with `--dangerously-skip-permission`:

- [ ] Code is committed to git
- [ ] Docker container is isolated
- [ ] Resource limits are set
- [ ] Network restrictions considered
- [ ] Task scope is clearly defined
- [ ] You're ready to review all changes
- [ ] Backup/rollback plan exists

## Conclusion

This Docker setup provides a practical isolation layer for running Claude Code autonomously. While not as secure as cloud-based sandboxes, it significantly reduces risk by:

1. Containing filesystem changes to the project directory
2. Protecting your host system
3. Making it easy to destroy and recreate the environment
4. Providing resource controls

Remember: **Always review Claude's changes before deploying to production.**

## Quick Reference

```bash
# Build container
docker-compose build

# Start container
docker-compose up -d

# Enter container
docker-compose exec grove-dev bash

# Run Claude autonomously (inside container)
claude --dangerously-skip-permission "task description"

# Stop container
docker-compose down

# View logs
docker-compose logs -f grove-dev

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```
