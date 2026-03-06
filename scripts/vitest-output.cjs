const COVERAGE_REGEX = /All files[ \t]+\|[ \t]+([\d.]+)/;
const SKIPPED_TESTS_REGEX = /(\d{1,10}) skipped/i;
const FAILED_TESTS_REGEX = /(\d{1,10}) failed/i;
const PASSED_TESTS_REGEX = /(\d{1,10}) passed/i;

function parseVitestRunOutput(output) {
  const coverageMatch = output.match(COVERAGE_REGEX);
  const skippedMatch = output.match(SKIPPED_TESTS_REGEX);
  const failedMatch = output.match(FAILED_TESTS_REGEX);
  const passedMatch = output.match(PASSED_TESTS_REGEX);

  const coverage = coverageMatch ? Number.parseFloat(coverageMatch[1]) : 0;
  const skippedTests = skippedMatch ? Number.parseInt(skippedMatch[1], 10) : 0;
  const failedTests = failedMatch ? Number.parseInt(failedMatch[1], 10) : 0;
  const passedTests = passedMatch ? Number.parseInt(passedMatch[1], 10) : 0;

  return {
    coverage,
    skippedTests,
    failedTests,
    passedTests,
  };
}

module.exports = {
  parseVitestRunOutput,
};
