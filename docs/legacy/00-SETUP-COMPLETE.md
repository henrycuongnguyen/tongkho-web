# Legacy Code Reference System - Setup Complete ✓

**Setup Date:** 2026-02-06  
**Status:** Ready to use

---

## What Was Created

### 1. Directory Structure
```
reference/                          # Legacy codebases (read-only)
├── README.md                       # How to use reference directory
├── resaland_v1/
│   ├── README.md                   # Resaland V1 overview & search guide
│   └── [original codebase]
└── tongkho_v1/
    ├── README.md                   # Tongkho V1 overview & search guide
    └── [original codebase]

docs/legacy/                        # Documentation
├── 00-SETUP-COMPLETE.md            # This file
├── legacy-code-index.md            # Master index (START HERE)
├── resaland-v1-features.md         # Detailed Resaland docs (template)
└── tongkho-v1-features.md          # Detailed Tongkho docs (template)
```

### 2. Configuration Changes
- **Updated `.gitignore`**: Legacy codebases won't be committed (read-only reference)

---

## How to Use

### Quick Start
1. **Read the master index**: [docs/legacy/legacy-code-index.md](legacy-code-index.md)
2. **Before implementing a feature**: Check if similar logic exists in V1
3. **Search V1 code**: Use Claude Code's Grep/Glob tools
4. **Update docs**: Document what you learn during migration

### Common Workflows

#### Workflow 1: Find Similar Feature in V1
```markdown
1. Open: docs/legacy/legacy-code-index.md
2. Search the "Quick Reference Table" for your feature
3. Check "Old Location (V1)" column
4. Use Grep to search that location in reference/ directory
```

#### Workflow 2: Extract Business Logic
```markdown
1. Identify V1 feature location in index
2. Read detailed docs (resaland-v1-features.md or tongkho-v1-features.md)
3. Use Grep to find relevant code in reference/
4. Analyze business rules and patterns
5. Design improved V2 implementation
6. Update index with migration status
```

#### Workflow 3: Scout Legacy Codebase
```markdown
Use Claude Code's /scout skill:
- Command: /scout:ext
- Target: reference/resaland_v1/ or reference/tongkho_v1/
- Output: Detailed feature analysis
- Action: Update feature documentation with findings
```

---

## Next Steps

### Immediate (Do This Week)
1. **Scout both legacy codebases**
   ```
   /scout:ext reference/resaland_v1/
   /scout:ext reference/tongkho_v1/
   ```

2. **Fill in detailed documentation**
   - Update `resaland-v1-features.md` with scout findings
   - Update `tongkho-v1-features.md` with scout findings
   - Add file locations, code patterns, business rules

3. **Complete the Quick Reference Table**
   - Add more features to `legacy-code-index.md`
   - Map V1 locations accurately
   - Set priorities for migration

### Short-term (Next 2 Weeks)
4. **Document business logic patterns**
   - Extract critical algorithms (inventory valuation, pricing, etc.)
   - Document validation rules
   - Document workflows

5. **Create V2 architecture plan**
   - Decide which V1 features to migrate
   - Design database schema for V2
   - Plan technology stack

### Long-term (Ongoing)
6. **Track migration progress**
   - Update status in Quick Reference Table as features migrate
   - Mark completed features
   - Document lessons learned

7. **Archive fully migrated features**
   - Keep index updated
   - Remove obsolete V1 code (optional)

---

## Search Examples

### Example 1: Find Authentication Code
```typescript
// Using Grep tool in Claude Code
pattern: "login|auth|jwt|token"
path: "./reference/resaland_v1/"
output_mode: "content"
```

### Example 2: Find Inventory Logic
```typescript
// Using Grep tool in Claude Code
pattern: "stock|inventory|warehouse"
path: "./reference/tongkho_v1/"
output_mode: "files_with_matches"
```

### Example 3: Find All TypeScript Services
```typescript
// Using Glob tool in Claude Code
pattern: "./reference/**/*.service.ts"
```

---

## Documentation Maintenance

### When to Update Docs
- ✅ After scouting a V1 codebase
- ✅ When starting migration of a V1 feature
- ✅ When completing migration of a V1 feature
- ✅ When discovering important business logic
- ✅ When finding V1 bugs/issues to avoid in V2

### How to Update
1. **Master Index** (`legacy-code-index.md`): Update status, add features
2. **Feature Docs** (`*-v1-features.md`): Add details, code patterns
3. **README files**: Update as system structure evolves

---

## Key Principles

### YAGNI (You Aren't Gonna Need It)
- Start simple with documentation
- Add detail only when needed
- Don't over-engineer the reference system

### KISS (Keep It Simple, Stupid)
- Just files and folders
- No complex tooling required
- Easy to search and maintain

### DRY (Don't Repeat Yourself)
- Document patterns once in index
- Reference, don't duplicate code
- Extract reusable business logic

---

## Success Metrics

You'll know this system is working when:
- ✅ You can find V1 code in < 2 minutes
- ✅ You understand V1 business logic before coding V2
- ✅ You avoid re-inventing solutions that already exist
- ✅ Migration progress is visible and tracked
- ✅ New team members can understand V1 systems quickly

---

## Support

### Questions?
1. Read `reference/README.md` - Reference directory guide
2. Read `docs/legacy/legacy-code-index.md` - Master index
3. Check individual V1 README files for system overviews

### Need Help Searching?
- Use Claude Code's Grep tool for content search
- Use Claude Code's Glob tool for file pattern search
- Use /scout skill for deep codebase analysis

---

## System Status

- [x] Reference directory created
- [x] Legacy codebases moved
- [x] README files created
- [x] Documentation structure set up
- [x] Master index created
- [x] Feature templates created
- [ ] **Next: Scout V1 codebases to populate details**

---

**Ready to use!** Start by reading [legacy-code-index.md](legacy-code-index.md) and then scout the V1 codebases.
