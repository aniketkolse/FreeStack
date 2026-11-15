import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { Category, Offer } from '../../types/resource';
import {
  findPrimaryTypeForSubcategory,
  getPopulatedPrimaryTypes,
  getTagSubtypesForOffers,
  hasMacroTypeGroups,
} from './categoryGroups';

const categories: Category[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'data/categories.json'), 'utf8')
);

function loadAllOffers(): Offer[] {
  const offersDir = path.resolve(process.cwd(), 'data/offers');
  const results: Offer[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.json')) {
        const parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
        if (Array.isArray(parsed)) {
          results.push(...parsed);
        } else if (parsed?.identity?.slug) {
          results.push(parsed);
        }
      }
    }
  }

  walk(offersDir);
  return results;
}

describe('categoryGroups (Important Types -> Subtypes hierarchy)', () => {
  const allOffers = loadAllOffers();

  it('groups all MCP offers into 8 Important Types with zero orphaned offers', () => {
    const mcpCat = categories.find((c) => c.slug === 'mcp')!;
    const mcpOffers = allOffers.filter((o) => o.classification.category === 'mcp');

    assert.equal(hasMacroTypeGroups('mcp'), true);
    const groups = getPopulatedPrimaryTypes(mcpCat, mcpOffers);
    assert.equal(groups.length, 8);

    const totalAcrossGroups = groups.reduce((acc, g) => acc + g.count, 0);
    assert.equal(totalAcrossGroups, mcpOffers.length);

    // Verify lookup from subtype to primary type
    assert.equal(findPrimaryTypeForSubcategory(groups, 'Databases'), 'data-dbs');
    assert.equal(findPrimaryTypeForSubcategory(groups, 'Developer Tools'), 'dev-code');
  });

  it('groups all APIs into 8 Important Types with zero orphaned offers', () => {
    const apiCat = categories.find((c) => c.slug === 'apis-integrations')!;
    const apiOffers = allOffers.filter((o) => o.classification.category === 'apis-integrations');

    assert.equal(hasMacroTypeGroups('apis-integrations'), true);
    const groups = getPopulatedPrimaryTypes(apiCat, apiOffers);
    assert.equal(groups.length, 8);

    const totalAcrossGroups = groups.reduce((acc, g) => acc + g.count, 0);
    assert.equal(totalAcrossGroups, apiOffers.length);

    assert.equal(findPrimaryTypeForSubcategory(groups, 'Cryptocurrency'), 'finance-crypto');
    assert.equal(findPrimaryTypeForSubcategory(groups, 'Weather'), 'geo-weather-travel');
  });

  it('produces clean Important Types and Tag Subtypes for standard categories', () => {
    const aiCat = categories.find((c) => c.slug === 'ai-ml')!;
    const aiOffers = allOffers.filter((o) => o.classification.category === 'ai-ml');

    assert.equal(hasMacroTypeGroups('ai-ml'), false);
    const groups = getPopulatedPrimaryTypes(aiCat, aiOffers);
    assert.ok(groups.length >= 3);
    assert.equal(
      groups.reduce((acc, g) => acc + g.count, 0),
      aiOffers.length
    );

    const tagSubtypes = getTagSubtypesForOffers(aiOffers, 8);
    assert.ok(tagSubtypes.length > 0);
    assert.ok(tagSubtypes[0].count > 0);
  });
});
