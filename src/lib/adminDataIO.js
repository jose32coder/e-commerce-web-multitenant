import * as XLSX from "xlsx";

export const EXPORT_MIME_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const EXPORT_MIME_CSV = "text/csv; charset=utf-8";

export const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const toPipeList = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join("|");
  }
  return String(value || "");
};

export const parsePipeList = (value) =>
  String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

export const buildExportFile = ({ rows, format, sheetName = "data" }) => {
  const worksheet = XLSX.utils.json_to_sheet(rows || []);

  if (format === "csv") {
    return {
      mime: EXPORT_MIME_CSV,
      extension: "csv",
      data: XLSX.utils.sheet_to_csv(worksheet, { FS: ",", RS: "\n" }),
    };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const binary = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return {
    mime: EXPORT_MIME_XLSX,
    extension: "xlsx",
    data: binary,
  };
};

export const parseSpreadsheetFile = async (file) => {
  const fileBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(Buffer.from(fileBuffer), { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) return [];

  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {
    defval: "",
    raw: false,
  });
};
