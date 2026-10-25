import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import { Browser } from '../../design-taste-frontend/scripts/lib/cdp.mjs';

const template = readFileSync(new URL('../assets/template.html', import.meta.url), 'utf8');
let browser;
before(async () => { browser = await Browser.launch(); });
after(async () => { if (browser) await browser.close(); });

async function fixture(req, run, { failSave = false, saveDelay = 0, design = null } = {}) {
  let saved = req;
  const payload = { prd_name: 'Review fixture', docs_dir: 'docs/review-fixture', requirements: req, design };
  const html = template.replace('/*__DATA__*/ null', JSON.stringify(payload).replace(/<\/script/gi, '<\\/script'));
  const server = createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/requirements.json') return response.end(JSON.stringify(saved));
    if (request.url === '/save') {
      if (failSave) { response.writeHead(500); return response.end('{}'); }
      let body = '';
      for await (const chunk of request) body += chunk;
      if (saveDelay) await new Promise(resolve => setTimeout(resolve, saveDelay));
      saved = JSON.parse(JSON.parse(body).content);
      return response.end('{}');
    }
    if (request.url === '/index.html') {
      response.setHeader('Content-Type', 'text/html');
      return response.end(html);
    }
    response.writeHead(404); response.end('{}');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const page = await browser.newPage();
  try {
    await page.send('Network.enable');
    await page.send('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] });
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { settleMs: 100 });
    await page.eval(() => {
      window.copied = [];
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.copied.push(text); } }, configurable: true });
    });
    await run(page, () => saved);
    assert.deepEqual(page.consoleErrors, []);
  } finally {
    await page.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

const click = (page, text) => page.eval(text => {
  const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text);
  if (!button) throw new Error('Missing button: ' + text);
  button.click();
}, text);
const inputTab = (page, bucket, status) => page.eval(({ bucket, status }) => {
  const section = document.querySelector('[data-input-bucket="' + bucket + '"]');
  if (!section) throw new Error('Missing input section: ' + bucket);
  section.querySelector('[data-input-status="' + status + '"]').click();
}, { bucket, status });
const edit = (page, label, value) => page.eval(({ label, value }) => {
  const input = [...document.querySelectorAll('[aria-label]')].find(e => e.getAttribute('aria-label') === label);
  if (!input) throw new Error('Missing input: ' + label);
  input.value = value; input.dispatchEvent(new Event('input', { bubbles: true }));
}, { label, value });
const save = async page => {
  await click(page, 'Save');
  for (let i = 0; i < 30; i++) {
    if (await page.eval(() => document.querySelector('#save-stamp').textContent.startsWith('Saved '))) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.fail('Save did not finish');
};

// B/O/U/N/D: zero/one/many, missing and invalid flags, distinct fields,
// Japanese/RTL/emoji, and hostile text. A: not applicable to this local UI.
test('only boolean true is archived; save preserves every input and normalizes legacy flags', async () => {
  const note = '税率 🙂 مرحبا <img src=x onerror="window.injected=true">';
  const req = {
    requirements: [],
    ambiguities: [{ amb_id: 'AMB-001', kind: 'absence', issue: 'Issue', question: 'Question', answer: '' }],
    qa_log: [{ qa_id: 'QA-001', question: 'Distinct question', answer: 'Distinct answer', ai_analyzed: true, analysis: { outcome: 'already_covered', summary: 'Covered', req_refs: ['REQ-009'], evidence: ['prd.txt §2'] } }],
    mom_notes: [{ mom_id: 'MOM-001', note, ai_analyzed: 'true' }],
    supporting_docs: [{ doc_id: 'DOC-001', description: 'Legacy doc', text: 'Body', ai_analyzed: null }]
  };
  await fixture(req, async (page, getSaved) => {
    assert.equal(await page.eval(() => !!document.querySelector('[aria-label="QA-001 answer"]')), false);
    assert.equal(await page.eval(() => document.querySelector('[aria-label="MOM-001 note"]').value), note);
    await save(page);
    assert.equal(getSaved().ambiguities[0].ai_analyzed, false);
    assert.equal(getSaved().qa_log[0].ai_analyzed, true);
    assert.equal(getSaved().mom_notes[0].ai_analyzed, false);
    assert.equal(getSaved().supporting_docs[0].ai_analyzed, false);
    await inputTab(page, 'qa_log', 'archived');
    const text = await page.eval(() => document.querySelector('[data-input-bucket="qa_log"]').textContent);
    assert.match(text, /QA-001/); assert.match(text, /REQ-009/); assert.match(text, /Covered/);
    assert.doesNotMatch(text, /MOM-001/);
    assert.equal(await page.eval(() => !!window.injected), false);
  });
});

// S/R: reopening an archived input, repeated edits and Save, no duplicate IDs.
test('editing an archived input returns it to pending and invalidates old analysis', async () => {
  await fixture({ requirements: [], ambiguities: [], qa_log: [], mom_notes: [{ mom_id: 'MOM-007', note: 'Old decision', ai_analyzed: true, analysis: { summary: 'Applied', req_refs: ['REQ-001'] } }] }, async (page, getSaved) => {
    await inputTab(page, 'mom_notes', 'archived');
    await click(page, 'Edit');
    await edit(page, 'MOM-007 note', 'New decision 日本語');
    await edit(page, 'MOM-007 note', 'New decision 日本語 🙂');
    await save(page);
    assert.equal(getSaved().mom_notes[0].ai_analyzed, false);
    assert.equal(getSaved().mom_notes[0].analysis, undefined);
    await page.eval(() => document.querySelector('[data-view="req"]').click());
    assert.equal(await page.eval(() => document.querySelector('[aria-label="MOM-007 note"]').value), 'New decision 日本語 🙂');
    await click(page, 'Add MOM note');
    await save(page);
    assert.deepEqual(getSaved().mom_notes.map(m => m.mom_id), ['MOM-007', 'MOM-008']);
    assert.equal(getSaved().mom_notes[1].ai_analyzed, false);
  });
});

// I: failed save must not produce a path-only prompt pointing at stale input.
test('Copy to Agent requires saved edits and copies paths with no inline snapshot', async () => {
  await fixture({ requirements: [], ambiguities: [], mom_notes: [{ mom_id: 'MOM-001', note: 'Secret fixture content' }] }, async page => {
    await click(page, 'Copy to Agent');
    let prompt = await page.eval(() => window.copied[0]);
    assert.match(prompt, /<requirements.json>\ndocs\/review-fixture\/requirements.json\n<\/requirements.json>/);
    assert.match(prompt, /BE Path: BE.txt/); assert.match(prompt, /FE Path: FE.txt/);
    assert.doesNotMatch(prompt, /Secret fixture content/);
    await edit(page, 'MOM-001 note', 'Unsaved');
    await click(page, 'Copy to Agent');
    assert.equal(await page.eval(() => window.copied.length), 1);
    await save(page);
    await click(page, 'Copy to Agent');
    assert.equal(await page.eval(() => window.copied.length), 2);
  });
  await fixture({ requirements: [], ambiguities: [], mom_notes: [{ mom_id: 'MOM-001', note: '' }] }, async page => {
    await edit(page, 'MOM-001 note', 'Pending');
    await click(page, 'Save');
    await click(page, 'Copy to Agent');
    assert.equal(await page.eval(() => window.copied.length), 0);
  }, { failSave: true });
});

// R/I/S: edits during a save cannot be marked saved or copied by a late response.
test('Copy to Agent stays blocked when input changes while Save is in flight', async () => {
  await fixture({ requirements: [], ambiguities: [], mom_notes: [{ mom_id: 'MOM-001', note: 'Original' }] }, async (page, getSaved) => {
    await edit(page, 'MOM-001 note', 'First edit');
    await click(page, 'Save');
    await edit(page, 'MOM-001 note', 'Later edit');
    await page.eval(() => new Promise(resolve => setTimeout(resolve, 250)));
    assert.equal(getSaved().mom_notes[0].note, 'First edit');
    await click(page, 'Copy to Agent');
    assert.equal(await page.eval(() => window.copied.length), 0);
    await save(page);
    assert.equal(getSaved().mom_notes[0].note, 'Later edit');
    await click(page, 'Copy to Agent');
    assert.equal(await page.eval(() => window.copied.length), 1);
  }, { saveDelay: 100 });
});

// D/E: 0 and many records on desktop/phone; no page-wide overflow.
test('archive handles empty and many inputs at wide and narrow widths', async () => {
  for (const count of [0, 40]) {
    await fixture({ requirements: [], ambiguities: [], supporting_docs: Array.from({ length: count }, (_, i) => ({ doc_id: 'DOC-' + i, description: '説明 ' + i, text: 'x'.repeat(500), ai_analyzed: true })) }, async page => {
      await inputTab(page, 'supporting_docs', 'archived');
      assert.equal(await page.eval(() => document.querySelectorAll('[data-input-bucket="supporting_docs"] tbody tr').length), count);
      for (const width of [1440, 390]) {
        await page.setViewport({ width, height: 900 });
        const layout = await page.eval(() => ({ width: innerWidth, page: document.documentElement.scrollWidth, nav: document.querySelector('#nav').getBoundingClientRect().width, sheet: document.querySelector('#sheet').getBoundingClientRect().width }));
        assert.ok(layout.page <= width, JSON.stringify(layout));
      }
    });
  }
});

test('each input section switches its own archive while Requirements and other sections stay visible', async () => {
  const req = {
    requirements: [{ req_id: 'REQ-001', requirement: 'Keep the review open.', type: 'flow', testable: true }],
    ambiguities: [{ amb_id: 'AMB-001', kind: 'absence', question: 'Pending question', answer: '', ai_analyzed: false }, { amb_id: 'AMB-002', kind: 'absence', answer: 'Archived ambiguity', ai_analyzed: true }],
    qa_log: [{ qa_id: 'QA-001', question: 'Pending Q&A', answer: '', ai_analyzed: false }, { qa_id: 'QA-002', answer: 'Archived answer', ai_analyzed: true }],
    mom_notes: [{ mom_id: 'MOM-001', note: 'Pending MOM', ai_analyzed: false }, { mom_id: 'MOM-002', note: 'Archived MOM', ai_analyzed: true }],
    supporting_docs: [{ doc_id: 'DOC-001', description: 'Pending document', text: 'Body', ai_analyzed: false }, { doc_id: 'DOC-002', text: 'Archived document', ai_analyzed: true }]
  };
  await fixture(req, async (page, getSaved) => {
    assert.equal(await page.eval(() => !!document.querySelector('#nav [data-view="archived"]')), false);
    await edit(page, 'MOM-001 note', 'Unsaved MOM 日本語 🙂');
    for (const bucket of ['ambiguities', 'qa_log', 'mom_notes', 'supporting_docs']) {
      await inputTab(page, bucket, 'archived');
      assert.equal(await page.eval(() => document.querySelector('#view h1').textContent), 'Requirements');
      assert.equal(await page.eval(() => document.querySelectorAll('[data-input-bucket]').length), 4);
      const state = await page.eval(bucket => ({
        archived: document.querySelector('[data-input-bucket="' + bucket + '"] [data-input-status="archived"]').getAttribute('aria-pressed'),
        rows: document.querySelectorAll('[data-input-bucket="' + bucket + '"] table.archived tbody tr').length
      }), bucket);
      assert.deepEqual(state, { archived: 'true', rows: 1 });
    }
    await inputTab(page, 'mom_notes', 'pending');
    assert.equal(await page.eval(() => document.querySelector('[aria-label="MOM-001 note"]').value), 'Unsaved MOM 日本語 🙂');
    assert.equal(await page.eval(() => document.querySelector('[data-input-bucket="qa_log"] [data-input-status="archived"]').getAttribute('aria-pressed')), 'true');
    await save(page);
    assert.equal(getSaved().mom_notes[0].note, 'Unsaved MOM 日本語 🙂');
    assert.equal(getSaved().mom_notes[1].ai_analyzed, true);
  });
});

// ---------- Test Cases tab: filters, per-team TDD contexts, Confluence export ----------
const tcReq = {
  meta: { prd_name: 'Review fixture' },
  requirements: [
    { req_id: 'REQ-001', requirement: 'The widget list exists', section: '2.1' },
    { req_id: 'REQ-002', requirement: 'The widget export works', section: '2.2' }
  ],
  ambiguities: [], qa_log: [], mom_notes: [], supporting_docs: []
};
const tm = (id, req) => ({
  tm_id: id, group_requirement: 'Should be able to use the widget', group_primary: 'Display',
  group_secondary: 'List', group_tertiary: 'Widget ' + id, behaviour: 'Able to verify widget behaviour ' + id,
  req_ids: [req], layer_targets: ['fe'], conflict_with: [], change_expected: false, risk: 'M', status: 'Pending', notes: ''
});
const tc = (id, layer, jenis, priority, tmId, req, extra = {}) => ({
  tc_id: id, title: 'Should be able to check ' + id, tm_ids: [tmId], req_ids: [req], jenis, priority, layer,
  preconditions: [id + ' seeded'], steps: ['open the widget', 'read the result'],
  test_data: { id }, expected_result: id + ' behaves', automation_candidate: true, ambiguity_refs: [], ...extra
});
const tcDesign = {
  meta: { counts: { matrix_entries: 4, test_cases: 8, answer_keys: 1 } },
  traceability_matrix: [tm('ID-CHECK-001', 'REQ-001'), tm('ID-CHECK-002', 'REQ-002'), tm('ID-CHECK-003', 'REQ-002'), tm('ID-CHECK-004', 'REQ-001')],
  test_cases: [
    tc('TC-Auto-WG-001', 'fe-unit', 'positive', 'P1', 'ID-CHECK-001', 'REQ-001'),
    tc('TC-Auto-WG-002', 'fe-unit', 'negative', 'P2', 'ID-CHECK-001', 'REQ-001', { ambiguity_refs: ['AMB-001'] }),
    tc('TC-Auto-WG-003', 'be-unit', 'positive', 'P1', 'ID-CHECK-002', 'REQ-002'),
    tc('TC-Auto-WG-004', 'be-unit', 'boundary', 'P2', 'ID-CHECK-002', 'REQ-002'),
    tc('TC-Auto-WG-005', 'api-integration', 'combination', 'P1', 'ID-CHECK-003', 'REQ-002'),
    tc('TC-Auto-WG-006', 'api-integration', 'interrupt', 'P2', 'ID-CHECK-003', 'REQ-002'),
    tc('TC-Auto-WG-007', 'e2e', 'positive', 'P1', 'ID-CHECK-004', 'REQ-001', { automation_candidate: false }),
    tc('TC-Auto-WG-008', 'e2e', 'flood', 'P2', 'ID-CHECK-004', 'REQ-001')
  ],
  answer_keys: [{
    ak_id: 'AK-001', tc_id: 'TC-Auto-WG-004', testcase_name: 'Should be able to check TC-Auto-WG-004',
    expected: 'Match with answerkey', result: '',
    sections: [{ title: 'Seed', kv: [['widget', 'wg-1']], table: { headers: ['a', 'b'], rows: [['1', '2']] }, expectation: 'seeded' }]
  }]
};
const openTc = async page => {
  await click(page, 'Test cases');
  assert.equal(await page.eval(() => document.querySelector('#view h1').textContent), 'Test cases');
};
const setFilter = (page, label, value) => page.eval(({ label, value }) => {
  const s = document.querySelector('select[aria-label="' + label + '"]');
  if (!s) throw new Error('missing select: ' + label);
  s.value = value;
  s.dispatchEvent(new Event('change'));
}, { label, value });
const rows = page => page.eval(() => document.querySelectorAll('.tc-main').length);

test('TC filter selects narrow by jenis, priority and layer', async () => {
  await fixture(tcReq, async page => {
    await openTc(page);
    assert.equal(await rows(page), 8);
    await setFilter(page, 'priority', 'P1');
    assert.equal(await rows(page), 4);
    await setFilter(page, 'priority', '');
    await setFilter(page, 'layer', 'e2e');
    assert.equal(await rows(page), 2);
    await setFilter(page, 'layer', '');
    await setFilter(page, 'jenis', 'negative');
    assert.equal(await rows(page), 1);
    await setFilter(page, 'jenis', '');
    assert.equal(await rows(page), 8);
  }, { design: tcDesign });
});

test('per-team TDD contexts partition TCs, embed answer keys, list the rest as reference', async () => {
  await fixture(tcReq, async page => {
    await openTc(page);
    await click(page, 'Copy BE context');
    await click(page, 'Copy FE context');
    await click(page, 'Copy Automation context');
    const [be, fe, auto] = await page.eval(() => window.copied);
    assert.ok(be.startsWith('You are a backend engineer at LDX, working in the L-DX_Backend repository.'));
    assert.ok(be.includes('We are implementing Review fixture.'));
    assert.ok(be.includes('Requirements referenced by your tests:'));
    assert.ok(be.includes('- REQ-002 (2.2): The widget export works'));
    assert.ok(be.includes('Matrix behaviours your tests cover:'));
    assert.ok(be.includes('Your test cases (4):'));
    assert.ok(be.includes('### TC-Auto-WG-003'));
    assert.ok(!be.includes('### TC-Auto-WG-001'));
    assert.ok(be.includes('Answer key AK-001:'));
    assert.ok(be.includes("Reference — the other teams' test cases (4, context only):"));
    assert.ok(be.includes('- TC-Auto-WG-001 [positive · P1 · fe-unit · ID-CHECK-001 · REQ REQ-001]'));
    assert.ok(be.includes('ask for the PRD first'));
    assert.ok(be.includes('propose it explicitly to QA — do not act silently'));
    assert.ok(fe.startsWith('You are a frontend engineer at LDX, working in the ldx-frontend repository.'));
    assert.ok(fe.includes('Your test cases (2):'));
    assert.ok(!fe.includes('Answer key'));
    assert.ok(fe.includes("Reference — the other teams' test cases (6, context only):"));
    assert.ok(auto.startsWith('You are an automation engineer at LDX, working in the L-DX-E2E repository.'));
    assert.ok(auto.includes('build and maintain the automated e2e specifications'));
    assert.ok(auto.includes('Your test cases (2):'));
    assert.ok(auto.includes("Reference — the other teams' test cases (6, context only):"));
  }, { design: tcDesign });
});

test('Copy to Confluence mirrors the active filter as paste-ready markdown', async () => {
  await fixture(tcReq, async page => {
    await openTc(page);
    await setFilter(page, 'layer', 'fe-unit');
    await click(page, 'Copy to Confluence');
    const md = await page.eval(() => window.copied[0]);
    assert.ok(md.startsWith('# Test cases — Review fixture'));
    assert.ok(md.includes('2 of 8 cases'));
    assert.ok(md.includes('## TC-Auto-WG-001 —'));
    assert.ok(md.includes('**Preconditions**'));
    assert.ok(md.includes('**Steps**'));
    assert.ok(md.includes('**Expected result**'));
    assert.ok(md.includes('AMB AMB-001'));
    assert.ok(!md.includes('## TC-Auto-WG-003 —'));
  }, { design: tcDesign });
});

test('the TC tab no longer offers Copy LLM context', async () => {
  await fixture(tcReq, async page => {
    await openTc(page);
    assert.equal(await page.eval(() =>
      [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Copy LLM context')), false);
  }, { design: tcDesign });
});
