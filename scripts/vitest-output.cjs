const COVERAGE_REGEX = /All files\s+\|\s+([\d.]+)/;
const SKIPPED_TESTS_REGEX = /Tests[^\n]*?(\d+)\s+skipped/i;

function parseVitestRunOutput(output) {
  const coverageMatch = output.match(COVERAGE_REGEX);
  const skippedMatch = output.match(SKIPPED_TESTS_REGEX);

  const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
  const skippedTests = skippedMatch ? Number.parseInt(skippedMatch[1], 10) : 0;

  return {
    coverage,
    skippedTests,
  };
}

module.exports = {
  parseVitestRunOutput,
};
