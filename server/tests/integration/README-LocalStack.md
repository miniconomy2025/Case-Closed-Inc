# LocalStack Integration Testing Guide

This guide explains how to set up and run AWS SQS integration tests using LocalStack for your team.

## Prerequisites

### Required Software

- **Docker** - LocalStack runs in Docker containers
- **Docker Compose** - Usually comes with Docker Desktop
- **Node.js 22** - Required for the project
- **npm** - Package manager

### Verify Prerequisites

```bash
# Check Docker is running
docker --version
docker-compose --version

# Check Node.js version
node --version  # Should be 22.x.x
npm --version
```

## Quick Start

### 1. Start LocalStack

```bash
# Navigate to server directory
cd server

# Start LocalStack using npm script (recommended)
npm run localstack:start

# Or using Docker Compose directly
docker-compose -f localstack-config.yml up -d
```

### 2. Verify LocalStack is Running

```bash
# Check if LocalStack container is running
docker ps | grep localstack

# Check LocalStack health
curl http://localhost:4566/_localstack/health
```

### 3. Run SQS Integration Tests

```bash
# Run only SQS tests
npm run test:sqs

# Or run all integration tests (includes SQS)
npm run test:integration
```

## Available Commands

### LocalStack Management

```bash
# Start LocalStack
npm run localstack:start

# Stop LocalStack
npm run localstack:stop

# View LocalStack logs
npm run localstack:logs

# Restart LocalStack
npm run localstack:stop && npm run localstack:start
```

### Test Commands

```bash
# Run only SQS integration tests
npm run test:sqs

# Run all integration tests
npm run test:integration

# Run unit tests
npm run test:unit

# Run all tests
npm run test:all
```

## LocalStack Configuration

### Services Enabled

- **SQS** - Message queuing (primary focus)
- **S3** - Object storage
- **RDS** - Relational database
- **IAM** - Identity and access management
- **SSM** - Systems Manager

### Port Configuration

- **4566** - LocalStack Gateway (main endpoint)
- **4510-4559** - External services port range

### Environment Variables

```bash
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=us-east-1
```

## Troubleshooting

### LocalStack Won't Start

```bash
# Check Docker is running
docker ps

# Check for port conflicts
netstat -an | grep 4566

# View LocalStack logs
npm run localstack:logs

# Restart LocalStack
npm run localstack:stop
npm run localstack:start
```

### Tests Failing

```bash
# Ensure LocalStack is running
curl http://localhost:4566/_localstack/health

# Check LocalStack logs for errors
npm run localstack:logs

# Verify environment variables
echo $AWS_ENDPOINT_URL
echo $AWS_REGION

# Run tests with verbose output
npm run test:sqs -- --verbose
```

### Common Issues

#### Port 4566 Already in Use

```bash
# Find process using port 4566
lsof -i :4566

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port by modifying localstack-config.yml
```

#### Docker Permission Issues

```bash
# Add user to docker group (Linux/Mac)
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker
```

#### LocalStack Container Fails to Start

```bash
# Check Docker daemon is running
docker info

# Restart Docker service
sudo systemctl restart docker  # Linux
# Or restart Docker Desktop on Windows/Mac
```

## Team Collaboration

### For New Team Members

1. **Install Prerequisites** - Docker, Node.js 22, npm
2. **Clone Repository** - Get the latest code
3. **Install Dependencies** - `npm ci` in server directory
4. **Start LocalStack** - `npm run localstack:start`
5. **Run Tests** - `npm run test:sqs`

### Development Workflow

```bash
# Daily development workflow
cd server
npm run localstack:start  # Start LocalStack
npm run test:sqs          # Run SQS tests
npm run test:integration  # Run all integration tests
npm run localstack:stop   # Stop LocalStack when done
```

### CI/CD Integration

- **GitHub Actions** - Automatically runs LocalStack in CI
- **Local Development** - Use LocalStack for testing before pushing
- **No AWS Costs** - LocalStack is free for development

## File Structure

```
server/
├── tests/integration/
│   ├── aws-sqs.test.js          # SQS integration tests
│   ├── localstack-setup.js      # LocalStack utilities
│   └── README-LocalStack.md     # This guide
├── localstack-config.yml        # Docker Compose config
└── package.json                 # npm scripts
```

## Advanced Usage

### Custom LocalStack Configuration

Edit `localstack-config.yml` to:

- Change ports
- Enable additional services
- Modify environment variables
- Add custom volumes

### Debugging SQS Issues

```bash
# View SQS queues in LocalStack
aws --endpoint-url=http://localhost:4566 sqs list-queues

# Send test message
aws --endpoint-url=http://localhost:4566 sqs send-message \
  --queue-url http://localhost:4566/000000000000/test-pickup-queue.fifo \
  --message-body '{"test": "message"}'
```

### Performance Tuning

- **Memory**: Increase Docker memory allocation
- **CPU**: Allocate more CPU cores to Docker
- **Storage**: Use SSD for better performance

## Support

### Getting Help

1. **Check Logs** - `npm run localstack:logs`
2. **Verify Prerequisites** - Docker, Node.js, npm versions
3. **Restart Services** - LocalStack, Docker, or your machine
4. **Check Documentation** - [LocalStack Docs](https://docs.localstack.cloud/)

### Common Commands Reference

```bash
# LocalStack
npm run localstack:start    # Start LocalStack
npm run localstack:stop     # Stop LocalStack
npm run localstack:logs     # View logs

# Testing
npm run test:sqs           # SQS tests only
npm run test:integration   # All integration tests
npm run test:unit          # Unit tests only
npm run test:all           # All tests

# Docker
docker ps                  # List running containers
docker logs <container>    # View container logs
docker-compose -f localstack-config.yml down  # Stop and remove containers
```

---

**Happy Testing! 🚀**

For questions or issues, check the logs first, then ask your team for help.
