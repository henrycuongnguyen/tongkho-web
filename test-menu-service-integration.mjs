/**
 * Manual Integration Test for Menu Service
 *
 * This script tests the menu service functions against a live database.
 * It verifies that all queries work correctly and return expected data.
 *
 * Usage:
 *   export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
 *   node test-menu-service-integration.mjs
 *
 * Requirements:
 *   - DATABASE_URL environment variable
 *   - PostgreSQL database with property_type and folder tables
 *   - Node.js 18+
 */

import {
  buildMenuStructure,
  buildMainNav,
  fetchPropertyTypesByTransaction,
  fetchNewsFolders,
  clearMenuCache,
} from './src/services/menu-service.ts';

// Test configuration
const TESTS = {
  fetchPropertyTypes: true,
  fetchNewsFolders: true,
  buildMenuStructure: true,
  buildMainNav: true,
  caching: true,
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.bright}${colors.cyan}[TEST] ${name}${colors.reset}`);
}

function logPass(message) {
  log(`  ✓ ${message}`, 'green');
}

function logFail(message) {
  log(`  ✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`  ℹ ${message}`, 'blue');
}

async function testFetchPropertyTypes() {
  logTest('Fetch Property Types by Transaction');

  try {
    // Test fetching sale types (transaction_type = 1)
    logInfo('Fetching sale property types (transaction_type=1)...');
    const saleTypes = await fetchPropertyTypesByTransaction(1);
    logPass(`Fetched ${saleTypes.length} sale property types`);

    if (saleTypes.length > 0) {
      logInfo(`Sample: ${saleTypes[0].title} (slug: ${saleTypes[0].slug})`);
    }

    // Test fetching rent types (transaction_type = 2)
    logInfo('Fetching rent property types (transaction_type=2)...');
    const rentTypes = await fetchPropertyTypesByTransaction(2);
    logPass(`Fetched ${rentTypes.length} rent property types`);

    // Test fetching project types (transaction_type = 3)
    logInfo('Fetching project property types (transaction_type=3)...');
    const projectTypes = await fetchPropertyTypesByTransaction(3);
    logPass(`Fetched ${projectTypes.length} project property types`);

    // Verify structure
    if (saleTypes.length > 0) {
      const sample = saleTypes[0];
      const hasRequiredFields =
        sample.id &&
        sample.title &&
        sample.transactionType === 1 &&
        typeof sample.aactive === 'boolean';

      if (hasRequiredFields) {
        logPass('Property type structure is valid');
      } else {
        logFail('Property type missing required fields');
      }
    }

    return true;
  } catch (error) {
    logFail(`Error: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testFetchNewsFolders() {
  logTest('Fetch News Folders');

  try {
    logInfo('Fetching news folders...');
    const folders = await fetchNewsFolders();
    logPass(`Fetched ${folders.length} news folders`);

    if (folders.length > 0) {
      logInfo(`Sample: ${folders[0].label} (name: ${folders[0].name})`);

      // Verify structure
      const sample = folders[0];
      const hasRequiredFields =
        sample.id && sample.label && sample.publish === 'T';

      if (hasRequiredFields) {
        logPass('Folder structure is valid');
      } else {
        logFail('Folder missing required fields');
      }
    } else {
      logFail('No news folders found - check NEWS_ROOT_FOLDER_ID');
    }

    return true;
  } catch (error) {
    logFail(`Error: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testBuildMenuStructure() {
  logTest('Build Menu Structure');

  try {
    logInfo('Building complete menu structure...');
    const startTime = Date.now();
    const structure = await buildMenuStructure();
    const duration = Date.now() - startTime;

    logPass(`Menu structure built in ${duration}ms`);

    // Verify structure
    const saleCount = structure.propertyTypes.sale.length;
    const rentCount = structure.propertyTypes.rent.length;
    const projectCount = structure.propertyTypes.project.length;
    const newsCount = structure.newsFolders.length;

    logInfo(`Sale types: ${saleCount}`);
    logInfo(`Rent types: ${rentCount}`);
    logInfo(`Project types: ${projectCount}`);
    logInfo(`News folders: ${newsCount}`);
    logInfo(`Generated at: ${structure.generatedAt.toISOString()}`);

    // Performance check
    if (duration < 500) {
      logPass(`Performance: ${duration}ms (target: <500ms)`);
    } else {
      logFail(`Performance: ${duration}ms exceeds 500ms target`);
    }

    return true;
  } catch (error) {
    logFail(`Error: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testBuildMainNav() {
  logTest('Build Main Navigation');

  try {
    logInfo('Building main navigation menu...');
    const nav = await buildMainNav();
    logPass(`Built navigation with ${nav.length} top-level items`);

    // Verify structure
    const expectedTopLevel = [
      'Trang chủ',
      'Mua bán',
      'Cho thuê',
      'Dự án',
      'Tin tức',
      'Liên hệ',
      'Mạng lưới',
      'Tiện ích',
    ];

    const topLevelLabels = nav.map((item) => item.label);
    const hasAllExpected = expectedTopLevel.every((label) =>
      topLevelLabels.includes(label)
    );

    if (hasAllExpected) {
      logPass('All expected top-level items present');
    } else {
      logFail('Missing expected top-level items');
      logInfo(`Expected: ${expectedTopLevel.join(', ')}`);
      logInfo(`Actual: ${topLevelLabels.join(', ')}`);
    }

    // Check children
    const muaBan = nav.find((item) => item.label === 'Mua bán');
    const choThue = nav.find((item) => item.label === 'Cho thuê');
    const duAn = nav.find((item) => item.label === 'Dự án');
    const tinTuc = nav.find((item) => item.label === 'Tin tức');

    if (muaBan?.children && muaBan.children.length > 0) {
      logPass(`Mua bán has ${muaBan.children.length} children`);
    } else {
      logFail('Mua bán missing children');
    }

    if (choThue?.children && choThue.children.length > 0) {
      logPass(`Cho thuê has ${choThue.children.length} children`);
    } else {
      logFail('Cho thuê missing children');
    }

    if (duAn?.children && duAn.children.length > 0) {
      logPass(`Dự án has ${duAn.children.length} children`);
    } else {
      logFail('Dự án missing children');
    }

    if (tinTuc?.children && tinTuc.children.length > 0) {
      logPass(`Tin tức has ${tinTuc.children.length} children`);
    } else {
      logFail('Tin tức missing children');
    }

    return true;
  } catch (error) {
    logFail(`Error: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function testCaching() {
  logTest('Caching Mechanism');

  try {
    // Clear cache first
    clearMenuCache();
    logPass('Cache cleared');

    // First call (cache miss)
    logInfo('First call (should be cache MISS)...');
    const start1 = Date.now();
    await buildMenuStructure();
    const duration1 = Date.now() - start1;
    logInfo(`Duration: ${duration1}ms`);

    // Second call (cache hit)
    logInfo('Second call (should be cache HIT)...');
    const start2 = Date.now();
    await buildMenuStructure();
    const duration2 = Date.now() - start2;
    logInfo(`Duration: ${duration2}ms`);

    // Cache hit should be significantly faster
    if (duration2 < duration1 / 10) {
      logPass(
        `Cache working: ${duration2}ms (cached) vs ${duration1}ms (fresh)`
      );
    } else {
      logFail(`Cache not working efficiently: ${duration2}ms vs ${duration1}ms`);
    }

    return true;
  } catch (error) {
    logFail(`Error: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function runTests() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'bright');
  log('║        Menu Service Integration Test Suite               ║', 'bright');
  log('╚═══════════════════════════════════════════════════════════╝', 'bright');

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    logFail('\n✗ DATABASE_URL environment variable not set');
    logInfo('Set DATABASE_URL before running tests:');
    logInfo('export DATABASE_URL="postgresql://user:pass@host:5432/dbname"');
    process.exit(1);
  }

  logPass('\n✓ DATABASE_URL configured');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // Run tests
  if (TESTS.fetchPropertyTypes) {
    results.total++;
    const passed = await testFetchPropertyTypes();
    if (passed) results.passed++;
    else results.failed++;
  }

  if (TESTS.fetchNewsFolders) {
    results.total++;
    const passed = await testFetchNewsFolders();
    if (passed) results.passed++;
    else results.failed++;
  }

  if (TESTS.buildMenuStructure) {
    results.total++;
    const passed = await testBuildMenuStructure();
    if (passed) results.passed++;
    else results.failed++;
  }

  if (TESTS.buildMainNav) {
    results.total++;
    const passed = await testBuildMainNav();
    if (passed) results.passed++;
    else results.failed++;
  }

  if (TESTS.caching) {
    results.total++;
    const passed = await testCaching();
    if (passed) results.passed++;
    else results.failed++;
  }

  // Summary
  log('\n╔═══════════════════════════════════════════════════════════╗', 'bright');
  log('║                    Test Summary                           ║', 'bright');
  log('╚═══════════════════════════════════════════════════════════╝', 'bright');

  log(`\nTotal Tests: ${results.total}`, 'bright');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  if (results.failed === 0) {
    log('\n✅ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed', 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  logFail(`\nUnexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
