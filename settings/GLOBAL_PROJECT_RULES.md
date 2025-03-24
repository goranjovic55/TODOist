# Global Project Rules

## Project Structure
- **project/** - Main project implementation files
  - **models/** - Design models and implementation blueprints
    - **user/** - User-created idea models
    - **ai/** - AI-optimized models with suggestions
    - **dev/** - Final approved design models
  - **tests/** - Test scripts and testing utilities
- **doc/** - Documentation files
- **scripts/** - Automation and utility scripts
- **settings/** - Configuration and setup files
- **logs/** - Runtime logs (created as needed)
- **debug/** - Debugging information (created as needed)

## Workflow Process
1. **Idea Creation**: User creates initial idea model in `project/models/user/`
2. **AI Enhancement**: AI analyzes idea and creates optimized suggestion in `project/models/ai/`
3. **Approval**: User reviews and approves AI suggestions
4. **Implementation**: AI creates implementation files in appropriate project directories
5. **Testing**: Implementation is tested with scripts in `project/tests/`
6. **Documentation**: Documentation is updated to reflect new implementation

## Project Initialization
Upon project start, AI creates:
1. **PROJECT_PLAN.md** - Comprehensive project overview and architecture
2. **ROADMAP.md** - Timeline with milestones and delivery targets
3. **IMPLEMENTATION.md** - Technical details of implementation approach
4. **STATUS.md** - Current status tracking document
5. **INDEX.md** - Navigation index for all project components

## Documentation Standards
- All documentation follows Markdown format
- Code examples use appropriate language syntax highlighting
- Documentation is updated before each commit
- Each component has its own documentation section

## Git Commit Flow
1. Before commit:
   - Read all status documents and current context
   - Update status files and implementation files
   - Update CHANGELOG.md with new changes
   - Update README.md if necessary
   - Save context for retrieval in new chat session
2. Commit and push changes
3. Open new chat session and retrieve saved context

## Naming Conventions
- Files: lowercase with underscores (e.g., `feature_name.py`)
- Classes: PascalCase (e.g., `FeatureClass`)
- Functions/Methods: camelCase (e.g., `processFeature()`)
- Constants: UPPERCASE with underscores (e.g., `MAX_SIZE`)
- Model files: COMPONENT_NAME.model (e.g., `DATABASE_MANAGER.model`)

## Code Standards
- Use consistent indentation (4 spaces preferred)
- Include docstrings for all functions and classes
- Write unit tests for all components
- Follow language-specific best practices

## Version Control
- Main branch should always be in a stable state
- Feature development occurs in feature branches
- Pull requests require review before merging
- Semantic versioning format: MAJOR.MINOR.PATCH

## Environment Setup
- All dependencies documented in appropriate format (requirements.txt, package.json, etc.)
- Virtual environments used where applicable
- Configuration files separated from code
- Environment variables used for sensitive information

## Context Preservation
- AI context saved at end of each session
- Context includes current status, recent changes, and pending tasks
- Context retrieved at beginning of new session 