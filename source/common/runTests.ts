import { getModifier } from '../tests/getModifier'
import { updateModifier } from '../tests/updateModifier'
import { Test, TestResult, TestsWithMetadata, TestsWithResults, TYPED_TEST } from '../types'
import { chain } from './flatten'

export function runTests(
  defaultTimeout: number,
  metadata: TestsWithMetadata[],
): Promise<TestsWithResults[]> {
  return Promise.all(
    findTestsToRun(metadata).map(m =>
      Promise.all(m.tests.map(runTest(defaultTimeout))).then(results => ({ ...m, results })),
    ),
  )
}

function runTest(defaultTimeout: number) {
  return (test: Test): Promise<TestResult> => {
    const { modifier, timeout = defaultTimeout } = test[TYPED_TEST]

    return test.runTest({ timeout, skip: modifier === 'skip' })
  }
}

function findTestsToRun(metadata: TestsWithMetadata[]): TestsWithMetadata[] {
  const tests = chain(x => x.tests, metadata)
  const hasOnly = tests.some(x => x[TYPED_TEST].modifier === 'only')

  return metadata.map(m => {
    const testsToRun = hasOnly
      ? m.tests.map(x => (getModifier(x) === 'only' ? x : updateModifier('skip', x)))
      : m.tests

    return {
      ...m,
      tests: testsToRun,
    }
  })
}
