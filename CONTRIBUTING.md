# Contributing to SoftTalks

Thank you for considering contributing to SoftTalks! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please create an issue with the following information:
- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Your environment (OS, browser, Node.js version, etc.)

### Suggesting Features

We welcome feature suggestions! Please create an issue with:
- A clear, descriptive title
- Detailed description of the proposed feature
- Any relevant examples or mock-ups
- Why this feature would be useful to most users

### Pull Requests

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes
4. Test your changes thoroughly
5. Submit a pull request with a clear description of the changes

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- Redis server
- Docker and Docker Compose (optional)

### Local Development

1. Clone the repository
2. Run `npm install` to install dependencies
3. Create a `.env` file with the required configuration
4. Use the provided scripts to start the application:
   - `./run.sh local` or `run.bat local` for local development
   - `./run.sh docker` or `run.bat docker` for Docker-based development

## Style Guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests after the first line

### JavaScript Style Guide

- Use 4 spaces for indentation
- Use semicolons
- Place opening braces on the same line as statements
- Add trailing commas for multi-line array and object literals

### Documentation Style Guide

- Use Markdown for documentation
- Reference code with backticks
- Separate paragraphs with a blank line
- Use headers to organize content

## Additional Notes

### Issue and Pull Request Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to documentation
- `help wanted`: Issues that need assistance
- `good first issue`: Good for newcomers

Thank you for contributing to SoftTalks! 