export interface QrExcelItem {
  id: string;
  productId: string;
  productName: string;
  points: number;
  generatedAt: string;
  status: string;
  batchId?: string;
  batchNo?: number | string;
  productCategory?: string;
  productSubCategory?: string;
}

export function getQrExcelColumnCount(item: QrExcelItem): 2 | 4 {
  const classification = [item.productCategory, item.productSubCategory]
    .filter(Boolean)
    .join(' ');
  const isModularBox = /\bmodul(?:e|ar)\s*box\b/i.test(classification);
  const isThreeByThreeOrFourByThree = /(?:^|\D)(?:3\s*[x×]\s*3|4\s*[x×]\s*3)(?:\D|$)/i.test(item.productName);
  return isModularBox && isThreeByThreeOrFourByThree ? 4 : 2;
}

export function buildQrExcelData(items: QrExcelItem[]): {
  headers: string[];
  rows: Array<Array<string | number>>;
  qrColumnCount: 2 | 4;
} {
  const qrColumnCount = items.length ? getQrExcelColumnCount(items[0]) : 2;
  const headers = [
    'ID',
    'Product Name',
    'Points',
    'Status',
    'Batch No.',
    ...Array.from({ length: qrColumnCount }, (_, index) => `QR Code ${index + 1}`),
  ];
  const rows: Array<Array<string | number>> = [];

  for (let index = 0; index < items.length; index += qrColumnCount) {
    const qrGroup = items.slice(index, index + qrColumnCount);
    const first = qrGroup[0];
    rows.push([
      index + 1,
      first.productName,
      first.points,
      first.status === 'used' ? 'Used' : 'Pending',
      first.batchNo ?? first.batchId ?? '',
      ...Array.from({ length: qrColumnCount }, (_, qrIndex) => qrGroup[qrIndex]?.id ?? ''),
    ]);
  }

  return { headers, rows, qrColumnCount };
}

export function groupQrExcelItemsByBatch<T extends QrExcelItem>(items: T[]): T[][] {
  const batches = new Map<string, T[]>();
  items.forEach((item, index) => {
    const key = item.batchId
      ? `batch:${item.batchId}`
      : `product:${item.productId}:${item.productName}:${index}`;
    const existing = batches.get(key);
    if (existing) existing.push(item);
    else batches.set(key, [item]);
  });
  return [...batches.values()];
}
