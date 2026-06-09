/**
 * Converts a Vitest JUnit XML report to SonarQube Generic Test Execution format.
 *
 * JUnit (Vitest output):
 *   <testsuites>
 *     <testsuite name="src/pages/__tests__/Foo.test.tsx" ...>
 *       <testcase name="..." time="0.05"/>
 *       <testcase name="..."><failure message="...">...</failure></testcase>
 *       <testcase name="..."><skipped/></testcase>
 *     </testsuite>
 *   </testsuites>
 *
 * SonarQube Generic format:
 *   <testExecutions version="1">
 *     <file path="src/pages/__tests__/Foo.test.tsx">
 *       <testCase name="..." duration="50"/>
 *       <testCase name="..."><failure message="...">...</failure></testCase>
 *       <testCase name="..."><skipped message=""/></testCase>
 *     </file>
 *   </testExecutions>
 *
 * Key differences:
 *   - time (seconds, float) → duration (milliseconds, integer)
 *   - <skipped/> must have a message attribute in the Sonar format
 */

import { readFileSync, writeFileSync } from 'fs';

const [,, inputPath = 'test-results.xml', outputPath = 'sonar-test-results.xml'] = process.argv;

const src = readFileSync(inputPath, 'utf8');

// ── helpers ─────────────────────────────────────────────────────────────────

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : '';
}

function secToMs(s) {
  const n = parseFloat(s) || 0;
  return Math.round(n * 1000);
}

// ── parse testsuites / testcases ─────────────────────────────────────────────

const suiteRegex = /<testsuite\s([^>]*)>([\s\S]*?)<\/testsuite>/g;
const caseRegex  = /<testcase\s([^>]*?)(?:\/>([\s\S]*?)(?=<testcase|<\/testsuite))?|<testcase\s([^>]*)>([\s\S]*?)<\/testcase>/g;

let lines = ['<testExecutions version="1">'];

let suiteMatch;
while ((suiteMatch = suiteRegex.exec(src)) !== null) {
  const suiteAttrs = suiteMatch[1];
  const suiteBody  = suiteMatch[2];
  const filePath   = attr(suiteAttrs, 'name');

  if (!filePath) continue;

  lines.push(`  <file path="${filePath}">`);

  // Re-parse each testcase inside this suite
  const tcRegex = /<testcase\s([^>]*?)(\/?>)([\s\S]*?)(?=<testcase|\s*<\/testsuite)/g;
  let tcMatch;
  while ((tcMatch = tcRegex.exec(suiteBody)) !== null) {
    const tcAttrs   = tcMatch[1];
    const selfClose = tcMatch[2] === '/>';
    const tcBody    = selfClose ? '' : tcMatch[3];
    const name      = attr(tcAttrs, 'name').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const duration  = secToMs(attr(tcAttrs, 'time'));

    const failMatch    = tcBody.match(/<failure(?:\s[^>]*)?>[\s\S]*?<\/failure>/);
    const errorMatch   = tcBody.match(/<error(?:\s[^>]*)?>[\s\S]*?<\/error>/);
    const skippedMatch = tcBody.match(/<skipped[^>]*\/?>/);

    if (skippedMatch) {
      lines.push(`    <testCase name="${name}" duration="${duration}"><skipped message=""/></testCase>`);
    } else if (failMatch || errorMatch) {
      const raw     = (failMatch || errorMatch)[0];
      const msg     = (attr(raw, 'message') || 'Test failed').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
      const inner   = raw.replace(/<[^>]+>/g, '').trim().slice(0, 2000)
                         .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const element = failMatch ? 'failure' : 'error';
      lines.push(`    <testCase name="${name}" duration="${duration}"><${element} message="${msg}">${inner}</${element}></testCase>`);
    } else {
      lines.push(`    <testCase name="${name}" duration="${duration}"/>`);
    }
  }

  lines.push('  </file>');
}

lines.push('</testExecutions>');

writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');
console.log(`Wrote ${outputPath} (${lines.length - 2} file blocks)`);
