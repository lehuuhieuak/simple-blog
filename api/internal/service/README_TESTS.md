# Service Layer Unit Tests

This directory contains comprehensive unit tests for all services in the blog API project.

## Test Files

### 1. `auth_service_test.go`
Tests for the authentication service covering:
- **Register**: User registration with validation, duplicate checking, and error handling
- **Login**: User authentication with password verification and error scenarios
- **GetUserByID**: User retrieval by ID with not found and error cases

### 2. `post_service_test.go`
Tests for the post service covering:
- **CreatePost**: Post creation with and without tags, error handling
- **GetPostBySlug**: Post retrieval by slug with not found scenarios
- **UpdatePost**: Post updates with authorization checks and validation
- **DeletePost**: Post deletion with authorization and error handling
- **GetPosts**: Paginated post listing with parameter validation
- **GetMyPosts**: Author-specific post listing (covered by pagination tests)
- **GetPostsByTag**: Tag-filtered post listing (covered by pagination tests)

### 3. `tag_service_test.go`
Tests for the tag service covering:
- **CreateTag**: Tag creation with duplicate checking and slug generation
- **GetTags**: Paginated tag listing with parameter validation
- **UpdateTag**: Tag updates with name conflict checking
- **DeleteTag**: Tag deletion with existence validation

## Test Coverage

The tests cover the following scenarios for each service method:

### Success Cases
- Valid input parameters
- Successful operations
- Proper data transformation
- Correct return values

### Error Cases
- Repository errors
- Validation failures
- Authorization failures
- Not found scenarios
- Duplicate data conflicts

### Edge Cases
- Invalid pagination parameters
- Boundary value testing
- Empty/null inputs where applicable

## Mock Repositories

Each test file includes comprehensive mock implementations:

- **MockUserRepository**: Simulates user data operations
- **MockPostRepository**: Simulates post data operations with tag relationships
- **MockTagRepository**: Simulates tag data operations

The mocks support:
- Configurable behavior through function injection
- In-memory data storage for realistic testing
- Error simulation for negative test cases

## Running Tests

### Run all service tests:
```bash
go test ./internal/service/... -v
```

### Run with coverage:
```bash
go test ./internal/service/... -v -cover
```

### Run specific service tests:
```bash
go test ./internal/service/ -run TestAuthService -v
go test ./internal/service/ -run TestPostService -v
go test ./internal/service/ -run TestTagService -v
```

### Generate coverage report:
```bash
chmod +x run_service_tests.sh
./run_service_tests.sh
```

## Test Structure

Each test follows the table-driven test pattern:

```go
tests := []struct {
    name          string
    input         InputType
    mockSetup     func(*MockRepository)
    expectedError string
    expectSuccess bool
}{
    // Test cases...
}

for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        // Test implementation...
    })
}
```

This structure provides:
- Clear test case descriptions
- Isolated test execution
- Comprehensive error checking
- Easy maintenance and extension

## Key Testing Principles

1. **Isolation**: Each test is independent and doesn't rely on external dependencies
2. **Mocking**: All repository dependencies are mocked for unit testing
3. **Coverage**: Both happy path and error scenarios are tested
4. **Clarity**: Test names clearly describe the scenario being tested
5. **Maintainability**: Tests are structured for easy updates when business logic changes

## Dependencies

The tests use only Go's standard testing package and don't require external testing frameworks, making them:
- Fast to execute
- Easy to maintain
- Compatible with standard Go tooling
- Suitable for CI/CD pipelines