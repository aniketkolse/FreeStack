import fs from 'node:fs';
import path from 'node:path';
import type { OutdatedReport } from '../src/types/resource';

function main() {
  const reportsPath =
    process.env.REPORTS_PATH ?? path.join(process.cwd(), 'data', 'reports.json');

  if (!fs.existsSync(reportsPath)) {
    console.log(`No reports file found at ${reportsPath} (0 queued reports).`);
    process.exit(0);
  }

  const raw = fs.readFileSync(reportsPath, 'utf-8');
  const parsed = JSON.parse(raw) as OutdatedReport[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    console.log('Reports queue is empty (0 queued reports).');
    process.exit(0);
  }

  console.log(`Exporting ${parsed.length} queued report(s) from ${reportsPath}:\n`);
  console.log(JSON.stringify(parsed, null, 2));
}

main();
