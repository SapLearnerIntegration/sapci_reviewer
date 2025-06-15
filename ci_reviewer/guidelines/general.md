# SAP Integration Design Guidelines

## General Design Principles
1. **Single Responsibility**: Each IFlow should have a single, clearly defined purpose.
2. **Error Handling**: All IFlows must implement proper error handling with appropriate logging.Meaning that each process node in each iflow need to have an subProcess with activity type ErrorEventSubProcessTemplate
3. **Naming Convention**: IFlow names should follow the pattern `[Source]_to_[Target]_[Purpose]`.
4. **Documentation**: Each IFlow must have documentation of inputs, outputs, and business purpose.