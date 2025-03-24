# Project Configuration Index

This index provides a central reference to all configuration and setup files for the project.

## Core Setup Documents

1. **[GLOBAL_PROJECT_RULES.md](GLOBAL_PROJECT_RULES.md)**
   - **Purpose**: Master document outlining project structure and workflow
   - **Usage**: Reference at project start and for onboarding new members
   - **Update Frequency**: When project standards change

2. **[global_code_setup.md](global_code_setup.md)**
   - **Purpose**: Defines coding standards and practices
   - **Usage**: Reference when writing new code or conducting code reviews
   - **Update Frequency**: When coding standards change

3. **[git_settings.md](git_settings.md)**
   - **Purpose**: Git workflow and repository management
   - **Usage**: Reference for maintaining repository consistency
   - **Update Frequency**: When Git workflow changes

4. **[testing_debugging.md](testing_debugging.md)**
   - **Purpose**: Testing framework and debugging procedures
   - **Usage**: Reference when implementing tests or debugging 
   - **Update Frequency**: When testing approaches change

## Document Relationships

```
GLOBAL_PROJECT_RULES.md
├── global_code_setup.md
├── git_settings.md
└── testing_debugging.md
```

## When To Use Each Document

- **Project Setup**: Start with GLOBAL_PROJECT_RULES.md
- **Writing Code**: Reference global_code_setup.md
- **Version Control**: Follow git_settings.md
- **Quality Assurance**: Use testing_debugging.md

## Update Process

All configuration documents should be reviewed at the beginning of each project phase. Updates should be committed with descriptive messages explaining what changed and why.

To propose changes to configuration standards:
1. Create a branch named `config-update-[date]`
2. Make changes to relevant files
3. Submit a pull request with detailed explanation
4. Obtain approval from project lead 