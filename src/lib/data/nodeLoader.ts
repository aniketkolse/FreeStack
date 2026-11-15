import fs from 'node:fs';
import path from 'node:path';
import type { Category, Offer, SourceRegistry } from '../../types/resource';

function walkJsonFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(full);
    }
  }
  return files;
}

export function loadCategoriesFromDisk(rootDir = process.cwd()): Category[] {
  const filePath = path.join(rootDir, 'data', 'categories.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Category[];
}

export function loadSourceRegistryFromDisk(rootDir = process.cwd()): SourceRegistry {
  const filePath = path.join(rootDir, 'data', 'sources', 'registry.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SourceRegistry;
}

export function loadOffersFromDisk(rootDir = process.cwd()): Offer[] {
  const offersDir = path.join(rootDir, 'data', 'offers');
  const files = walkJsonFiles(offersDir).sort();
  const allOffers: Offer[] = [];
  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Offer | Offer[];
    if (Array.isArray(parsed)) {
      allOffers.push(...parsed);
    } else if (parsed && typeof parsed === 'object') {
      allOffers.push(parsed);
    }
  }
  return allOffers.sort((a, b) => a.identity.name.localeCompare(b.identity.name));
}

