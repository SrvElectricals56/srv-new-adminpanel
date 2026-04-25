import * as XLSX from 'xlsx';

type ExportValue = string | number | boolean | null | undefined;
type ExportRow = Record<string, ExportValue>;

export function exportRowsToExcel(
  rows: ExportRow[] | object[],
  sheetName: string,
  fileName: string,
): void {
  const safeRows = rows.length > 0 ? rows as ExportRow[] : [{ Info: 'No data available' }];
  const worksheet = XLSX.utils.json_to_sheet(safeRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
