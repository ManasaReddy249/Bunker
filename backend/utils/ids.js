function nextId(rows, key, fallbackStart = 1) {
  const max = rows.reduce((acc, row) => {
    const value = Number(row[key] || 0);
    return value > acc ? value : acc;
  }, fallbackStart - 1);
  return max + 1;
}

function pad(n, width = 4) {
  return String(n).padStart(width, '0');
}

function poNumber(existing, date = new Date()) {
  const year = date.getFullYear();
  const prefix = `PO-BS-${year}-`;
  let max = 0;
  for (const row of existing) {
    const value = String(row.po_number || '');
    if (value.startsWith(prefix)) {
      const n = Number(value.slice(prefix.length));
      if (n > max) max = n;
    }
  }
  return `${prefix}${pad(max + 1)}`;
}

module.exports = { nextId, poNumber };
