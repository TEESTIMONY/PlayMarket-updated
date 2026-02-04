# Contributing to PlayMarket Frontend

Thank you for considering contributing to the PlayMarket Frontend project! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager
- Git

### Setup

1. **Fork the repository**
   - Click the "Fork" button on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/playmarket-frontend.git
   cd playmarket-frontend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Guidelines

### Code Style

This project uses ESLint and Prettier for code formatting. Please ensure your code follows these standards:

```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### TypeScript

- Use TypeScript for type safety
- Add proper type annotations for all functions and variables
- Use interfaces for object shapes
- Prefer `const` over `let` when possible

### Component Structure

- Create reusable components in `src/components/`
- Use functional components with hooks
- Keep components focused and single-purpose
- Use descriptive component and variable names

### Styling

- Use Tailwind CSS classes
- Avoid inline styles when possible
- Create reusable utility classes when needed
- Follow the existing color scheme and typography

### Git Workflow

1. **Create feature branches**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make commits**
   - Write clear, descriptive commit messages
   - Use the format: `type(scope): description`
   - Examples:
     - `feat(auth): add login form validation`
     - `fix(bounties): resolve claim submission bug`
     - `docs(readme): update installation instructions`

3. **Push to your fork**
   ```bash
   git push origin feature/your-feature
   ```

4. **Create a Pull Request**
   - Go to GitHub and create a pull request
   - Describe your changes clearly
   - Reference any related issues

### Testing

- Test your changes thoroughly before submitting
- Ensure existing functionality still works
- Test on different screen sizes for responsive design

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/         # Route-specific components
├── services/      # API services
├── contexts/      # React contexts
├── hooks/         # Custom hooks
└── utils/         # Utility functions
```

## API Integration

When working with API services:

1. **Use the existing apiService**
   - Located in `src/services/api.ts`
   - Follow existing patterns for new endpoints

2. **Handle errors gracefully**
   - Use try-catch blocks
   - Display user-friendly error messages
   - Log errors for debugging

3. **Environment variables**
   - Use `import.meta.env.VITE_` for environment variables
   - Never commit sensitive information

## Performance Considerations

- Use memoization for expensive calculations
- Implement lazy loading for large lists
- Optimize images and assets
- Minimize re-renders with proper state management

## Security

- Never expose sensitive information in the frontend
- Validate all user inputs
- Use HTTPS for API calls in production
- Follow OWASP security guidelines

## Pull Request Guidelines

1. **Before submitting:**
   - Run `npm run lint` and fix any issues
   - Test your changes thoroughly
   - Ensure all existing tests pass

2. **In your PR description:**
   - Describe what your changes do
   - Explain why you made these changes
   - Mention any breaking changes
   - Reference related issues

3. **PR size:**
   - Keep PRs focused and small when possible
   - Large features can be broken into smaller, reviewable chunks

## Code Review Process

- All PRs require at least one approval
- Reviewers will check for:
  - Code quality and style
  - Functionality and testing
  - Performance implications
  - Security considerations

## Reporting Issues

When reporting bugs or requesting features:

1. **Search existing issues** first
2. **Provide clear reproduction steps**
3. **Include environment information** (browser, OS, etc.)
4. **Add relevant screenshots** if applicable

## Getting Help

- Check the existing documentation
- Create a GitHub issue for questions
- Be specific about your problem or question

## Code of Conduct

Please follow these guidelines:

- Be respectful and inclusive
- Provide constructive feedback
- Help others when possible
- Keep discussions focused and productive

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Questions?

If you have questions about contributing, please:

- Check the project documentation
- Create a GitHub issue
- Reach out to the maintainers

Thank you for contributing to PlayMarket Frontend!