import * as XLSX from "xlsx";

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  sheetName: string,
  fileName: string
): Buffer {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

export function exportSalesToExcel(sales: Record<string, unknown>[]): Buffer {
  return exportToExcel(sales, "Ventas", "ventas.xlsx");
}
