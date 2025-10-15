# Testing Framework Configuration

## Overview
This testing setup includes:
- **Jest** for test running and assertions
- **@testing-library/react** for React component testing
- **@testing-library/jest-dom** for DOM-specific matchers
- **@testing-library/user-event** for user interaction simulation

## Structure
```
src/
├── components/
│   ├── UI/__tests__/
│   │   └── Button.test.tsx
│   └── Form/__tests__/
│       └── FormComponents.test.tsx
├── hooks/__tests__/
│   └── useForm.test.ts
├── utils/
│   └── testUtils.ts
├── setupTests.ts
└── types/
    └── jest.d.ts
```

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Coverage
The configuration includes coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Writing Tests

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

test('renders button with text', () => {
  render(<Button onClick={() => {}}>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

test('increments counter', () => {
  const { result } = renderHook(() => useCounter());
  
  act(() => {
    result.current.increment();
  });
  
  expect(result.current.count).toBe(1);
});
```

### User Interaction Testing
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('handles user input', async () => {
  const user = userEvent.setup();
  render(<Input />);
  
  await user.type(screen.getByRole('textbox'), 'Hello');
  expect(screen.getByRole('textbox')).toHaveValue('Hello');
});
```

## Test Utilities

### Mock Factories
- `createMockFile()` - Creates mock File objects for upload testing
- `createMockApiResponse()` - Creates standardized API response objects
- `createMockFormData()` - Creates mock form data objects

### Custom Matchers
- `toHaveFormData()` - Validates form data contents
- `toBeValidFormField()` - Checks if element is a valid form field

## Configuration Files

### jest.config.js
- Test environment: jsdom
- Setup files: setupTests.ts
- Coverage configuration
- Module name mapping for CSS imports

### setupTests.ts
- Global Jest DOM matchers
- Mock implementations for browser APIs
- Console error suppression for expected test errors

### tsconfig.json
- TypeScript configuration for tests
- Jest type definitions included
- Path mapping for imports

## Best Practices

### Test Organization
1. Group related tests in `describe` blocks
2. Use descriptive test names that explain behavior
3. Follow AAA pattern (Arrange, Act, Assert)
4. Keep tests focused and isolated

### Assertions
- Use specific matchers (`toBeInTheDocument`, `toHaveClass`)
- Test user-visible behavior, not implementation details
- Verify accessibility attributes when relevant

### Mocking
- Mock external dependencies at module level
- Use `jest.fn()` for function mocks
- Reset mocks between tests when needed

### Async Testing
- Use `async/await` for async operations
- Use `waitFor` for elements that appear asynchronously
- Use `act` for state updates in hooks

## Integration with CI/CD
Tests are configured to run in CI environments with:
- `--ci` flag for optimized CI performance
- `--coverage` for coverage reporting
- `--watchAll=false` to run once and exit

## Troubleshooting

### Common Issues
1. **Module not found**: Check import paths and mock configurations
2. **Tests timeout**: Increase timeout in jest.config.js
3. **Coverage threshold failures**: Add tests or adjust thresholds
4. **TypeScript errors**: Ensure proper type definitions

### Debugging Tests
- Use `screen.debug()` to see rendered DOM
- Use `console.log` for debugging test state
- Use `--verbose` flag for detailed test output