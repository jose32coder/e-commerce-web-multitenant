// ─── START FILE ───
import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext } from "@/lib/tenantContext";
import ExcelJS from "exceljs";

// ── Color palette (matches the PDF report) ──
const COLORS = {
  dark: "0F172A",
  white: "FFFFFF",
  slate50: "F8FAFC",
  slate100: "F1F5F9",
  slate200: "E2E8F0",
  slate400: "94A3B8",
  slate500: "64748B",
  slate700: "334155",
  slate900: "1E293B",
  green100: "DCFCE7",
  green700: "15803D",
  amber100: "FEF3C7",
  amber700: "A16207",
  red100: "FEE2E2",
  red700: "DC2626",
  blue100: "DBEAFE",
  blue700: "1D4ED8",
};

const thinBorder = (color = COLORS.slate200) => ({
  top: { style: "thin", color: { argb: color } },
  bottom: { style: "thin", color: { argb: color } },
  left: { style: "thin", color: { argb: color } },
  right: { style: "thin", color: { argb: color } },
});

export async function GET(request) {
  try {
    const supabase = await createClient();
    const tenantFromQuery = request.nextUrl.searchParams.get("tenant_id");
    const storeNameParam = request.nextUrl.searchParams.get("store_name") || "";
    const logoUrlParam = request.nextUrl.searchParams.get("logo_url") || "";
    const { tenantId } = await resolveTenantContext(supabase, {
      fallbackTenantId: tenantFromQuery,
    });

    if (!tenantId) {
      return Response.json(
        { success: false, error: "No se pudo resolver tenant_id." },
        { status: 400 },
      );
    }

    // Resolve store name
    let storeName = decodeURIComponent(storeNameParam).trim();
    if (!storeName) {
      const { data: siteRow } = await supabase
        .from("site_settings")
        .select("site_name")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      storeName = siteRow?.site_name || "Mi Tienda";
    }

    const logoUrl = decodeURIComponent(logoUrlParam).trim();

    // Fetch orders
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const orders = data || [];

    // Stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const completedCount = orders.filter((o) => ["completed", "delivered", "paid", "pagado", "completado", "entregado", "shipped", "enviado"].includes((o.estado || "").toLowerCase())).length;
    const pendingCount = orders.filter((o) => ["pending", "pendiente", "processing", "procesando"].includes((o.estado || "").toLowerCase())).length;

    // ════════════════════════════════════════════════
    //  BUILD WORKBOOK
    // ════════════════════════════════════════════════
    const wb = new ExcelJS.Workbook();
    wb.creator = storeName;
    wb.created = new Date();

    const ws = wb.addWorksheet("Ventas", {
      properties: { defaultRowHeight: 18 },
      pageSetup: {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
      },
    });

    // Column configuration
    ws.columns = [
      { key: "num", width: 5 },              // A
      { key: "order_number", width: 14 },    // B
      { key: "date", width: 16 },            // C
      { key: "customer_name", width: 25 },   // D
      { key: "customer_id", width: 15 },     // E
      { key: "customer_phone", width: 16 },  // F
      { key: "status", width: 16 },          // G
      { key: "payment_method", width: 18 },  // H
      { key: "payment_ref", width: 16 },     // I
      { key: "shipping", width: 18 },        // J
      { key: "total", width: 16 },           // K
    ];

    let currentRow = 1;

    // ─── LOGO (if available) ───
    if (logoUrl) {
      try {
        const logoRes = await fetch(logoUrl);
        if (logoRes.ok) {
          const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
          const ext = logoUrl.toLowerCase().includes(".png") ? "png" : "jpeg";
          const imageId = wb.addImage({ buffer: logoBuffer, extension: ext });
          ws.addImage(imageId, {
            tl: { col: 0.2, row: 0.2 },
            ext: { width: 130, height: 130 },
            editAs: "absolute",
          });
        }
      } catch {
        // logo fetch failed silently
      }
    }

    // ─── ROW 1: Store Name ───
    const nameRow = ws.getRow(currentRow);
    ws.mergeCells(`B${currentRow}:K${currentRow}`);
    const nameCell = ws.getCell(`B${currentRow}`);
    nameCell.value = storeName;
    nameCell.font = { size: 24, bold: true, color: { argb: COLORS.dark } };
    nameCell.alignment = { vertical: "middle", horizontal: "left", indent: logoUrl ? 12 : 0 };
    nameRow.height = 70;
    currentRow++;

    // ─── ROW 2: Report subtitle ───
    ws.mergeCells(`B${currentRow}:K${currentRow}`);
    const subtitleCell = ws.getCell(`B${currentRow}`);
    subtitleCell.value = "REPORTE DETALLADO DE VENTAS";
    subtitleCell.font = { size: 9, bold: false, color: { argb: COLORS.slate500 }, letterSpacing: 200 };
    subtitleCell.alignment = { horizontal: "left", vertical: "top", indent: logoUrl ? 12 : 0 };
    ws.getRow(currentRow).height = 16;
    currentRow++;

    // ─── ROW 3: Date ───
    ws.mergeCells(`B${currentRow}:K${currentRow}`);
    const dateCell = ws.getCell(`B${currentRow}`);
    const now = new Date();
    dateCell.value = `Generado el ${now.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })} — ${now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
    dateCell.font = { size: 9, color: { argb: COLORS.slate400 } };
    dateCell.alignment = { horizontal: "left", vertical: "top", indent: logoUrl ? 12 : 0 };
    ws.getRow(currentRow).height = 16;
    currentRow++;

    // ─── ROW 4: Separator line ───
    for (let c = 1; c <= 11; c++) {
      const cell = ws.getCell(currentRow, c);
      cell.border = { bottom: { style: "medium", color: { argb: COLORS.dark } } };
    }
    ws.getRow(currentRow).height = 8;
    currentRow++;

    // ─── ROW 5: Blank spacer ───
    ws.getRow(currentRow).height = 12;
    currentRow++;

    // ─── ROWS 6–7: Statistics Cards ───
    const statsData = [
      { label: "TOTAL ÓRDENES", value: totalOrders, bgColor: COLORS.slate50, borderColor: COLORS.slate200 },
      { label: "INGRESOS (USD)", value: `$${totalRevenue.toFixed(2)}`, bgColor: "F0F9FF", borderColor: "0EA5E9" },
      { label: "COMPLETADAS", value: completedCount, bgColor: "F0FDF4", borderColor: "22C55E" },
      { label: "PENDIENTES", value: pendingCount, bgColor: "FFFBEB", borderColor: "F59E0B" },
    ];

    const statsValueRow = ws.getRow(currentRow);
    statsValueRow.height = 36;
    
    const cardMerges = [
      { start: 2, end: 3 },
      { start: 4, end: 6 },
      { start: 7, end: 9 },
      { start: 10, end: 11 }
    ];

    for (let i = 0; i < 4; i++) {
      const { start, end } = cardMerges[i];
      ws.mergeCells(currentRow, start, currentRow, end);
      const cell = ws.getCell(currentRow, start);
      cell.value = statsData[i].value;
      cell.font = { size: 18, bold: true, color: { argb: COLORS.dark } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statsData[i].bgColor } };
      
      for(let c = start; c <= end; c++) {
        const tempCell = ws.getCell(currentRow, c);
        tempCell.border = {
          top: { style: "thin", color: { argb: statsData[i].borderColor } },
          bottom: { style: "none" },
          left: c === start ? { style: "medium", color: { argb: statsData[i].borderColor } } : undefined,
          right: c === end ? { style: "thin", color: { argb: statsData[i].borderColor } } : undefined,
        };
      }
    }
    currentRow++;

    const statsLabelRow = ws.getRow(currentRow);
    statsLabelRow.height = 18;
    for (let i = 0; i < 4; i++) {
      const { start, end } = cardMerges[i];
      ws.mergeCells(currentRow, start, currentRow, end);
      const cell = ws.getCell(currentRow, start);
      cell.value = statsData[i].label;
      cell.font = { size: 7, bold: true, color: { argb: COLORS.slate500 } };
      cell.alignment = { horizontal: "center", vertical: "top" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statsData[i].bgColor } };
      
      for(let c = start; c <= end; c++) {
        const tempCell = ws.getCell(currentRow, c);
        tempCell.border = {
          bottom: { style: "thin", color: { argb: statsData[i].borderColor } },
          left: c === start ? { style: "medium", color: { argb: statsData[i].borderColor } } : undefined,
          right: c === end ? { style: "thin", color: { argb: statsData[i].borderColor } } : undefined,
        };
      }
    }
    currentRow++;

    // ─── Blank spacer ───
    ws.getRow(currentRow).height = 10;
    currentRow++;

    // ─── TABLE HEADER ───
    const headerLabels = [
      "#", "Nº ORDEN", "FECHA", "CLIENTE", "ID CLIENTE", "TELÉFONO", 
      "ESTADO", "MÉTODO PAGO", "REF. PAGO", "ENVÍO", "TOTAL (USD)"
    ];
    const headerRow = ws.getRow(currentRow);
    headerRow.height = 24;
    headerLabels.forEach((label, i) => {
      const cell = ws.getCell(currentRow, i + 1);
      cell.value = label;
      cell.font = { size: 8, bold: true, color: { argb: COLORS.white } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.dark } };
      cell.alignment = {
        horizontal: ["#", "Nº ORDEN", "FECHA", "ESTADO", "TOTAL (USD)"].includes(label) ? "center" : "left",
        vertical: "middle",
      };
      cell.border = thinBorder(COLORS.dark);
    });
    currentRow++;

    // ─── DATA ROWS ───
    orders.forEach((o, idx) => {
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? COLORS.white : COLORS.slate50;
      const statusLabel = o.estado || "Desconocido";
      const isCompleted = ["completed", "delivered", "paid", "pagado", "completado", "entregado", "shipped", "enviado"].includes((o.estado || "").toLowerCase());
      const isCancelled = ["cancelled", "cancelado"].includes((o.estado || "").toLowerCase());
      const isPending = ["pending", "pendiente", "processing", "procesando"].includes((o.estado || "").toLowerCase());

      const row = ws.getRow(currentRow);
      row.height = 20;

      const commonStyle = (cell, alignment = "left") => {
        cell.font = { size: 9, color: { argb: COLORS.slate700 } };
        cell.alignment = { horizontal: alignment, vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
        cell.border = thinBorder(COLORS.slate100);
      };

      // 1. #
      const numCell = ws.getCell(currentRow, 1);
      numCell.value = idx + 1;
      commonStyle(numCell, "center");
      numCell.font = { size: 8, color: { argb: COLORS.slate400 } };

      // 2. Nº ORDEN
      const orderNumCell = ws.getCell(currentRow, 2);
      const orderCode = o.order_number ? String(o.order_number).padStart(5, "0") : String(o.id || "").slice(-6).toUpperCase();
      orderNumCell.value = `#${orderCode}`;
      commonStyle(orderNumCell, "center");
      orderNumCell.font = { size: 9, bold: true, color: { argb: COLORS.slate900 } };

      // 3. FECHA
      const dateCell = ws.getCell(currentRow, 3);
      dateCell.value = new Date(o.created_at).toLocaleDateString("es-ES");
      commonStyle(dateCell, "center");

      // 4. CLIENTE
      const clientCell = ws.getCell(currentRow, 4);
      clientCell.value = o.customer_name || "Desconocido";
      commonStyle(clientCell, "left");
      clientCell.font = { size: 9, bold: true, color: { argb: COLORS.slate900 } };

      // 5. ID CLIENTE
      const idClientCell = ws.getCell(currentRow, 5);
      idClientCell.value = o.customer_id_number || "—";
      commonStyle(idClientCell, "left");

      // 6. TELÉFONO
      const phoneCell = ws.getCell(currentRow, 6);
      phoneCell.value = o.customer_phone || "—";
      commonStyle(phoneCell, "left");

      // 7. ESTADO
      const statusCell = ws.getCell(currentRow, 7);
      statusCell.value = statusLabel.toUpperCase();
      commonStyle(statusCell, "center");
      
      let statusColor = COLORS.slate700;
      let statusBg = rowBg;
      
      if (isCompleted) { statusColor = COLORS.green700; statusBg = COLORS.green100; }
      else if (isCancelled) { statusColor = COLORS.red700; statusBg = COLORS.red100; }
      else if (isPending) { statusColor = COLORS.amber700; statusBg = COLORS.amber100; }
      else { statusColor = COLORS.blue700; statusBg = COLORS.blue100; }

      statusCell.font = { size: 8, bold: true, color: { argb: statusColor } };
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusBg } };

      // 8. MÉTODO PAGO
      const payMethodCell = ws.getCell(currentRow, 8);
      payMethodCell.value = o.metodo_pago || "—";
      commonStyle(payMethodCell, "left");

      // 9. REF. PAGO
      const payRefCell = ws.getCell(currentRow, 9);
      payRefCell.value = o.referencia_pago || "—";
      commonStyle(payRefCell, "left");

      // 10. ENVÍO
      const shipCell = ws.getCell(currentRow, 10);
      shipCell.value = o.shipping_method || "—";
      commonStyle(shipCell, "left");

      // 11. TOTAL (USD)
      const totalCell = ws.getCell(currentRow, 11);
      totalCell.value = Number(o.total || 0);
      totalCell.numFmt = '"$"#,##0.00';
      commonStyle(totalCell, "center");
      totalCell.font = { size: 10, bold: true, color: { argb: COLORS.dark } };

      currentRow++;
    });

    // ─── Blank spacer ───
    ws.getRow(currentRow).height = 6;
    currentRow++;

    // ─── FOOTER ───
    for (let c = 1; c <= 11; c++) {
      const cell = ws.getCell(currentRow, c);
      cell.border = { top: { style: "thin", color: { argb: COLORS.slate200 } } };
    }

    ws.mergeCells(`A${currentRow}:D${currentRow}`);
    const footerLeftCell = ws.getCell(`A${currentRow}`);
    footerLeftCell.value = storeName;
    footerLeftCell.font = { size: 8, bold: true, color: { argb: COLORS.slate500 } };
    footerLeftCell.alignment = { horizontal: "left", vertical: "middle" };

    ws.mergeCells(`E${currentRow}:K${currentRow}`);
    const footerRightCell = ws.getCell(`E${currentRow}`);
    footerRightCell.value = `${totalOrders} orden(es) · ${now.toLocaleDateString("es-ES")}`;
    footerRightCell.font = { size: 8, color: { argb: COLORS.slate400 } };
    footerRightCell.alignment = { horizontal: "right", vertical: "middle" };

    ws.getRow(currentRow).height = 20;

    // ─── Print area ───
    ws.pageSetup.printArea = `A1:K${currentRow}`;

    // ════════════════════════════════════════════════
    //  GENERATE BUFFER & RESPOND
    // ════════════════════════════════════════════════
    const buffer = await wb.xlsx.writeBuffer();
    const dateCode = new Date().toISOString().slice(0, 10);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ventas_${dateCode}.xlsx"`,
      },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message || "Error exportando ventas." },
      { status: 500 },
    );
  }
}
// ─── END FILE ───
