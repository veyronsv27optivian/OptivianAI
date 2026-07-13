/**
 * ─── Data Export Service (Item 56) ──────────────────────────────
 * Utility functions to export data as CSV or JSON files.
 */

/**
 * Convert an array of objects to CSV string
 */
function toCSV(rows, columns) {
  if (!rows || rows.length === 0) return '';

  const header = columns.map(c => {
    const label = c.label || c.key;
    return `"${String(label).replace(/"/g, '""')}"`;
  }).join(',');

  const body = rows.map(row => {
    return columns.map(col => {
      let val = '';
      if (col.getValue) {
        val = col.getValue(row);
      } else {
        val = row[col.key] ?? '';
      }
      // Escape CSV
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',');
  }).join('\n');

  return `${header}\n${body}`;
}

/**
 * Trigger a browser download of a CSV file
 */
function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export tasks to CSV
 */
export function exportTasksToCSV(tasks, filename = 'tasks-export.csv') {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    {
      key: 'assigned_to',
      label: 'Assigned To',
      getValue: (row) => (row.assignee_emails || []).join('; '),
    },
    { key: 'due_date', label: 'Due Date' },
    { key: 'created_at', label: 'Created At' },
    { key: 'updated_at', label: 'Updated At' },
  ];

  const csv = toCSV(tasks, columns);
  downloadCSV(csv, filename);
}

/**
 * Export users to CSV
 */
export function exportUsersToCSV(users, filename = 'users-export.csv') {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'email', label: 'Email' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'role', label: 'Role' },
    {
      key: 'status',
      label: 'Status',
      getValue: (row) => row.is_suspended ? 'Suspended' : 'Active',
    },
    { key: 'designation', label: 'Designation' },
    { key: 'phone', label: 'Phone' },
    { key: 'last_login', label: 'Last Login' },
    { key: 'created_at', label: 'Joined At' },
  ];

  const csv = toCSV(users, columns);
  downloadCSV(csv, filename);
}

/**
 * Export any data array to CSV
 */
export function exportToCSV(data, columns, filename = 'export.csv') {
  const csv = toCSV(data, columns);
  downloadCSV(csv, filename);
}
