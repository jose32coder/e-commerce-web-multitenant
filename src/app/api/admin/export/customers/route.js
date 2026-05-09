// ─── START FILE ───
import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext } from "@/lib/tenantContext";
import { safeNumber } from "@/lib/adminDataIO";
import ExcelJS from "exceljs";

// ── Color palette ──
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
  purple100: "F3E8FF",
  purple700: "7E22CE",
};

const thinBorder = (color = COLORS.slate200) => ({
  top: { style: "thin", color: { argb: color } },
  bottom: { style: "thin", color: { argb: color } },
  left: { style: "thin", color: { argb: color } },
  right: { style: "thin", color: { argb: color } },
});

const getItemsQuantity = (items) =>
  (Array.isArray(items) ? items : []).reduce(
    (acc, item) => acc + safeNumber(item?.quantity, 0),
    0,
  );

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

    const [{ data: customersData, error: customersError }, { data: ordersData, error: ordersError }] =
      await Promise.all([
        supabase
          .from("customers")
          .select("id, full_name, id_number, phone, email")
          .eq("tenant_id", tenantId)
          .order("full_name", { ascending: true }),
        supabase
          .from("orders")
          .select("customer_id, customer_name, customer_id_number, total, estado, items")
          .eq("tenant_id", tenantId),
      ]);

    if (customersError) throw customersError;
    if (ordersError) throw ordersError;

    const customers = (customersData || []).map((customer) => {
      const linkedOrders = (ordersData || []).filter(
        (order) =>
          order.customer_id === customer.id ||
          (order.customer_name || "").trim().toLowerCase() ===
            (customer.full_name || "").trim().toLowerCase(),
      );

      const paidOrders = linkedOrders.filter((order) => order.estado === "paid");

      return {
        id: customer.id,
        full_name: customer.full_name || "Desconocido",
        id_number: customer.id_number || "—",
        phone: customer.phone || "—",
        email: customer.email || "—",
        orders_count_paid: paidOrders.length,
        items_qty_paid: paidOrders.reduce(
          (sum, order) => sum + getItemsQuantity(order.items),
          0,
        ),
        total_spent_paid_usd: paidOrders.reduce(
          (sum, order) => sum + safeNumber(order.total, 0),
          0,
        ),
      };
    });

    // Stats
    const totalCustomers = customers.length;
    const buyingCustomers = customers.filter(c => c.orders_count_paid > 0).length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent_paid_usd, 0);
    const totalOrders = customers.reduce((sum, c) => sum + c.orders_count_paid, 0);

    // ════════════════════════════════════════════════
    //  BUILD WORKBOOK
    // ════════════════════════════════════════════════
    const wb = new ExcelJS.Workbook();
    wb.creator = storeName;
    wb.created = new Date();

    const ws = wb.addWorksheet("Clientes", {
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
      { key: "client_name", width: 35 },     // B
      { key: "id_number", width: 18 },       // C
      { key: "email", width: 30 },           // D
      { key: "phone", width: 20 },           // E
      { key: "orders", width: 14 },          // F
      { key: "items", width: 14 },           // G
      { key: "total", width: 18 },           // H
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
    ws.mergeCells(`B${currentRow}:H${currentRow}`);
    const nameCell = ws.getCell(`B${currentRow}`);
    nameCell.value = storeName;
    nameCell.font = { size: 24, bold: true, color: { argb: COLORS.dark } };
    nameCell.alignment = { vertical: "middle", horizontal: "left", indent: logoUrl ? 12 : 0 };
    nameRow.height = 70;
    currentRow++;

    // ─── ROW 2: Report subtitle ───
    ws.mergeCells(`B${currentRow}:H${currentRow}`);
    const subtitleCell = ws.getCell(`B${currentRow}`);
    subtitleCell.value = "REPORTE DETALLADO DE CLIENTES";
    subtitleCell.font = { size: 9, bold: false, color: { argb: COLORS.slate500 }, letterSpacing: 200 };
    subtitleCell.alignment = { horizontal: "left", vertical: "top", indent: logoUrl ? 12 : 0 };
    ws.getRow(currentRow).height = 16;
    currentRow++;

    // ─── ROW 3: Date ───
    ws.mergeCells(`B${currentRow}:H${currentRow}`);
    const dateCell = ws.getCell(`B${currentRow}`);
    const now = new Date();
    dateCell.value = `Generado el ${now.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })} — ${now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
    dateCell.font = { size: 9, color: { argb: COLORS.slate400 } };
    dateCell.alignment = { horizontal: "left", vertical: "top", indent: logoUrl ? 12 : 0 };
    ws.getRow(currentRow).height = 16;
    currentRow++;

    // ─── ROW 4: Separator line ───
    for (let c = 1; c <= 8; c++) {
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
      { label: "TOTAL CLIENTES", value: totalCustomers, bgColor: COLORS.slate50, borderColor: COLORS.slate200 },
      { label: "CON COMPRAS", value: buyingCustomers, bgColor: "F3E8FF", borderColor: "7E22CE" },
      { label: "ÓRDENES (PAGADAS)", value: totalOrders, bgColor: "FFFBEB", borderColor: "F59E0B" },
      { label: "GASTADO (USD)", value: `$${totalRevenue.toFixed(2)}`, bgColor: "F0FDF4", borderColor: "22C55E" },
    ];

    const statsValueRow = ws.getRow(currentRow);
    statsValueRow.height = 36;
    
    // We have 7 available cols (B to H)
    // Let's merge nicely:
    // Card 1: B (1 col)
    // Card 2: C (1 col)
    // Card 3: D-E (2 cols)
    // Card 4: F-H (3 cols)
    const cardMerges = [
      { start: 2, end: 2 },
      { start: 3, end: 3 },
      { start: 4, end: 5 },
      { start: 6, end: 8 }
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
      "#", "CLIENTE", "IDENTIFICACIÓN", "EMAIL", "TELÉFONO", "ÓRDENES", 
      "ARTÍCULOS", "TOTAL (USD)"
    ];
    const headerRow = ws.getRow(currentRow);
    headerRow.height = 24;
    headerLabels.forEach((label, i) => {
      const cell = ws.getCell(currentRow, i + 1);
      cell.value = label;
      cell.font = { size: 8, bold: true, color: { argb: COLORS.white } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.dark } };
      cell.alignment = {
        horizontal: ["#", "ÓRDENES", "ARTÍCULOS", "TOTAL (USD)"].includes(label) ? "center" : "left",
        vertical: "middle",
      };
      cell.border = thinBorder(COLORS.dark);
    });
    currentRow++;

    // ─── DATA ROWS ───
    customers.forEach((c, idx) => {
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? COLORS.white : COLORS.slate50;

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

      // 2. CLIENTE
      const clientCell = ws.getCell(currentRow, 2);
      clientCell.value = c.full_name;
      commonStyle(clientCell, "left");
      clientCell.font = { size: 9, bold: true, color: { argb: COLORS.slate900 } };

      // 3. IDENTIFICACIÓN
      const idCell = ws.getCell(currentRow, 3);
      idCell.value = c.id_number;
      commonStyle(idCell, "left");

      // 4. EMAIL
      const emailCell = ws.getCell(currentRow, 4);
      emailCell.value = c.email;
      commonStyle(emailCell, "left");

      // 5. TELÉFONO
      const phoneCell = ws.getCell(currentRow, 5);
      phoneCell.value = c.phone;
      commonStyle(phoneCell, "left");

      // 6. ÓRDENES
      const ordersCell = ws.getCell(currentRow, 6);
      ordersCell.value = c.orders_count_paid;
      commonStyle(ordersCell, "center");
      ordersCell.font = { size: 10, bold: c.orders_count_paid > 0, color: { argb: c.orders_count_paid > 0 ? COLORS.slate900 : COLORS.slate400 } };

      // 7. ARTÍCULOS
      const itemsCell = ws.getCell(currentRow, 7);
      itemsCell.value = c.items_qty_paid;
      commonStyle(itemsCell, "center");

      // 8. TOTAL (USD)
      const totalCell = ws.getCell(currentRow, 8);
      totalCell.value = Number(c.total_spent_paid_usd || 0);
      totalCell.numFmt = '"$"#,##0.00';
      commonStyle(totalCell, "center");
      totalCell.font = { size: 10, bold: true, color: { argb: c.total_spent_paid_usd > 0 ? COLORS.green700 : COLORS.slate400 } };

      currentRow++;
    });

    // ─── Blank spacer ───
    ws.getRow(currentRow).height = 6;
    currentRow++;

    // ─── FOOTER ───
    for (let c = 1; c <= 8; c++) {
      const cell = ws.getCell(currentRow, c);
      cell.border = { top: { style: "thin", color: { argb: COLORS.slate200 } } };
    }

    ws.mergeCells(`A${currentRow}:D${currentRow}`);
    const footerLeftCell = ws.getCell(`A${currentRow}`);
    footerLeftCell.value = storeName;
    footerLeftCell.font = { size: 8, bold: true, color: { argb: COLORS.slate500 } };
    footerLeftCell.alignment = { horizontal: "left", vertical: "middle" };

    ws.mergeCells(`E${currentRow}:H${currentRow}`);
    const footerRightCell = ws.getCell(`E${currentRow}`);
    footerRightCell.value = `${totalCustomers} cliente(s) · ${now.toLocaleDateString("es-ES")}`;
    footerRightCell.font = { size: 8, color: { argb: COLORS.slate400 } };
    footerRightCell.alignment = { horizontal: "right", vertical: "middle" };

    ws.getRow(currentRow).height = 20;

    // ─── Print area ───
    ws.pageSetup.printArea = `A1:H${currentRow}`;

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
        "Content-Disposition": `attachment; filename="clientes_${dateCode}.xlsx"`,
      },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message || "Error exportando clientes." },
      { status: 500 },
    );
  }
}
// ─── END FILE ───
