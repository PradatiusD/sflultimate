const assert = require('assert').strict
const { test } = require('node:test')
const { escapeHtml, buildBrandedEmail } = require('../app/next/lib/email-template')

test('escapes user-supplied HTML', () => {
  assert.equal(escapeHtml('Alex & Sam <script>'), 'Alex &amp; Sam &lt;script&gt;')
})

test('wraps confirmation copy in the league chrome', () => {
  const { html, text } = buildBrandedEmail({
    badge: 'Donation received',
    heading: 'Thank you!',
    intro: 'Hi Alex & Sam,',
    highlight: { label: 'Donation total', value: '$25.00' },
    rows: [
      { label: 'Date', value: 'Sep 22, 2026' },
      { label: 'Reference', value: 'abc<script>' }
    ],
    paragraphs: ['Questions about your donation? Reply to this email.']
  })

  assert.ok(html.includes('sflultimate-logo-pink-flamingo.png'))
  assert.ok(html.includes('#804399'))
  assert.ok(html.includes('https://www.instagram.com/sflultimate/'))
  assert.ok(html.includes('Stay connected with South Florida Ultimate'))
  assert.ok(html.includes('Hi Alex &amp; Sam,'))
  assert.ok(!html.includes('Hi Alex & Sam,'))
  assert.ok(html.includes('abc&lt;script&gt;'))
  assert.ok(!html.includes('abc<script>'))
  assert.ok(html.includes('$25.00'))
  assert.ok(text.includes('Hi Alex & Sam,'))
  assert.ok(text.includes('Donation total: $25.00'))
  assert.ok(text.includes('Reference: abc<script>'))
})

test('keeps trusted introHtml while escaping other fields', () => {
  const { html } = buildBrandedEmail({
    heading: "You're registered!",
    intro: 'Thanks, Sam. We received your registration for Fall League.',
    introHtml: 'Thanks, Sam. We received your registration for <strong>Fall League</strong>.'
  })
  assert.ok(html.includes('<strong>Fall League</strong>'))
  assert.ok(html.includes('You&#39;re registered!'))
})
