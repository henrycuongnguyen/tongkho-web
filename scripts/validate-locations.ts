/**
 * Validate Static Location JSON Files
 * Run after generate-locations.ts to verify output.
 *
 * Usage: npm run validate:locations
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = 'public/data';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: Record<string, number>;
}

function validateJson(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).length;
}

function validateLocations(): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
    stats: {},
  };

  console.log('\n========================================');
  console.log('Validating Static Location JSON Files');
  console.log('========================================\n');

  // Check data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    result.errors.push(`Data directory not found: ${DATA_DIR}`);
    result.passed = false;
    return result;
  }

  // Validate provinces files
  for (const version of ['new', 'old']) {
    const provincesFile = path.join(DATA_DIR, `provinces-${version}.json`);

    if (!fs.existsSync(provincesFile)) {
      result.errors.push(`Missing: ${provincesFile}`);
      result.passed = false;
    } else if (!validateJson(provincesFile)) {
      result.errors.push(`Invalid JSON: ${provincesFile}`);
      result.passed = false;
    } else {
      const content = JSON.parse(fs.readFileSync(provincesFile, 'utf8'));
      const count = Array.isArray(content) ? content.length : 0;
      result.stats[`provinces-${version}`] = count;
      console.log(`  ✓ provinces-${version}.json: ${count} records`);

      if (count === 0) {
        result.warnings.push(`Empty provinces file: ${provincesFile}`);
      }
    }
  }

  // Validate district directories
  for (const version of ['new', 'old']) {
    const districtDir = path.join(DATA_DIR, 'districts', version);

    if (!fs.existsSync(districtDir)) {
      result.errors.push(`Missing directory: ${districtDir}`);
      result.passed = false;
    } else {
      const count = countFiles(districtDir);
      result.stats[`districts-${version}`] = count;
      console.log(`  ✓ districts/${version}/: ${count} files`);

      // Sample validate a few files
      const files = fs.readdirSync(districtDir).filter(f => f.endsWith('.json')).slice(0, 5);
      for (const file of files) {
        const filePath = path.join(districtDir, file);
        if (!validateJson(filePath)) {
          result.errors.push(`Invalid JSON: ${filePath}`);
          result.passed = false;
        }
      }
    }
  }

  // Validate ward directories
  for (const version of ['new', 'old']) {
    const wardDir = path.join(DATA_DIR, 'wards', version);

    if (!fs.existsSync(wardDir)) {
      result.warnings.push(`Missing directory (may be empty): ${wardDir}`);
    } else {
      const count = countFiles(wardDir);
      result.stats[`wards-${version}`] = count;
      console.log(`  ✓ wards/${version}/: ${count} files`);

      // Sample validate a few files
      const files = fs.readdirSync(wardDir).filter(f => f.endsWith('.json')).slice(0, 5);
      for (const file of files) {
        const filePath = path.join(wardDir, file);
        if (!validateJson(filePath)) {
          result.errors.push(`Invalid JSON: ${filePath}`);
          result.passed = false;
        }
      }
    }
  }

  console.log('\n========================================');
  if (result.passed) {
    console.log('✓ Validation Passed!');
  } else {
    console.log('✗ Validation Failed!');
    console.log('\nErrors:');
    result.errors.forEach(e => console.log(`  - ${e}`));
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    result.warnings.forEach(w => console.log(`  - ${w}`));
  }

  console.log('\nStats:');
  for (const [key, value] of Object.entries(result.stats)) {
    console.log(`  ${key}: ${value}`);
  }
  console.log('========================================\n');

  return result;
}

const result = validateLocations();
process.exit(result.passed ? 0 : 1);
