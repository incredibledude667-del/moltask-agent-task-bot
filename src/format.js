export function printTable(rows, columns) {
  if (!rows.length) {
    console.log('No rows.');
    return;
  }
  const widths = columns.map((column) => {
    const values = rows.map((row) => String(row[column.key] ?? ''));
    return Math.min(column.maxWidth || 40, Math.max(column.label.length, ...values.map((value) => value.length)));
  });
  console.log(columns.map((column, index) => pad(column.label, widths[index])).join('  '));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const row of rows) {
    console.log(columns.map((column, index) => pad(truncate(String(row[column.key] ?? ''), widths[index]), widths[index])).join('  '));
  }
}

export function truncate(value, maxWidth) {
  if (value.length <= maxWidth) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxWidth - 1))}…`;
}

function pad(value, width) {
  return value.padEnd(width, ' ');
}
