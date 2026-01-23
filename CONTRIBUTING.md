# Contributing to Afterstill

Thank you for your interest in contributing to Afterstill! 🎉

## Code of Conduct

Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Use the bug report template
3. Include:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details

### Suggesting Features

1. Check existing feature requests
2. Describe the feature clearly
3. Explain the use case
4. Provide examples if possible

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Write/update tests if applicable
5. Ensure code passes linting: `npm run lint`
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

### Commit Messages

Follow conventional commits:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: format code`
- `refactor: restructure code`
- `perf: improve performance`
- `test: add tests`
- `chore: update dependencies`

### Code Style

- Use TypeScript
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Testing

- Write unit tests for utilities
- Test components thoroughly
- Ensure accessibility
- Test on multiple browsers

### Documentation

- Update README if needed
- Add JSDoc comments
- Update API documentation
- Include examples

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/afterstill.git

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Start development
npm run dev
```

## Project Structure

- `src/app/` - Next.js pages and API routes
- `src/components/` - React components
- `src/lib/` - Utility functions
- `src/types/` - TypeScript types
- `prisma/` - Database schema

## Questions?

Feel free to open a discussion or issue!

Thank you for contributing! 🙏
