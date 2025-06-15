# SAP Integration Design Guidelines

## Security Guidelines
1. **Authentication**: All external connections must use OAuth 2.0 or certificate-based authentication.
2. **Sensitive Data**: No sensitive data (passwords, API keys) should be hardcoded.
3. **Content Modification**: All message content modifications must be traceable (e.g., using message headers).
4. **Logging**: Only non-sensitive data should be logged.
