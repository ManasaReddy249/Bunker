const fs = require('fs');
const path = require('path');

function splitLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] === undefined ? '' : cols[i];
    });
    return row;
  });
}

function loadCsv(name) {
  const file = path.join(__dirname, '..', '..', 'database', 'csv', name);
  return parseCsv(fs.readFileSync(file, 'utf8'));
}

function toInt(v, fallback = 0) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

function toNum(v, fallback = 0) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isNaN(n) ? fallback : n;
}

function toBool(v) {
  return String(v).toLowerCase() === 'true' || v === '1' || v === true;
}

function toNullInt(v) {
  if (v === undefined || v === null || v === '') return null;
  return toInt(v);
}

module.exports = { parseCsv, loadCsv, toInt, toNum, toBool, toNullInt };
