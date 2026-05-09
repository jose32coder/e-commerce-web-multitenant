import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { convertPrice, formatPrice } from "@/services/exchangeRates";

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#ffffff", fontFamily: "Helvetica", color: "#1e293b" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 3,
    borderBottomColor: "#0f172a",
    paddingBottom: 16,
    marginBottom: 18,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 52,
    height: 52,
    marginRight: 14,
    objectFit: "contain",
  },
  brandTextContainer: {
    justifyContent: "center",
  },
  brandTitle: { fontSize: 22, fontWeight: "bold", textTransform: "uppercase", color: "#0f172a", letterSpacing: -0.5 },
  brandSubtitle: { fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 2, marginTop: 2 },
  
  reportDate: { textAlign: "right" },
  reportDateLabel: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 },
  reportDateValue: { fontSize: 11, color: "#334155", fontWeight: "bold", marginTop: 2 },
  reportTimeValue: { fontSize: 9, color: "#94a3b8", marginTop: 2 },

  statsBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    textAlign: "center",
    borderLeftWidth: 3,
  },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  statLabel: { fontSize: 7, textTransform: "uppercase", letterSpacing: 1, color: "#64748b", marginTop: 2 },
  
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9"
  },
  col: { width: "48%" },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 4,
  },
  value: { fontSize: 10, marginBottom: 4, color: "#1e293b" },
  valueLabel: { fontWeight: "bold", color: "#334155" },

  table: { width: "100%", marginBottom: 18 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    textTransform: "uppercase",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center"
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc"
  },
  cellQty: { width: "10%", fontSize: 9, color: "#64748b", textAlign: "center" },
  cellDesc: { width: "55%", fontSize: 9.5, fontWeight: "bold", color: "#1e293b" },
  cellPrice: { width: "15%", fontSize: 9, textAlign: "right", color: "#64748b" },
  cellTotal: {
    width: "20%",
    fontSize: 10,
    textAlign: "right",
    fontWeight: "bold",
    color: "#0f172a"
  },

  totalSection: { marginTop: 10, alignSelf: "flex-end", width: 220 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  totalRowLabel: { fontSize: 9, color: "#64748b", textTransform: "uppercase" },
  totalRowValue: { fontSize: 10, color: "#1e293b", fontWeight: "bold" },
  
  finalTotal: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    padding: 10,
    marginTop: 8,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  finalTotalLabel: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 },
  finalTotalValue: { fontSize: 14, fontWeight: "bold" },

  policyBox: { marginTop: 30, padding: 12, backgroundColor: "#f8fafc", borderRadius: 6, borderWidth: 1, borderColor: "#e2e8f0" },
  policyTitle: { fontSize: 8, fontWeight: "bold", marginBottom: 6, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 },
  policyText: { fontSize: 8, color: "#64748b", lineHeight: 1.5 },
  
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#94a3b8",
  },
  footerBrand: { fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: 1 },
});

export const InvoicePDF = ({
  formData,
  finalTotal,
  purchasedItems,
  orderCode,
  brand,
  logoUrl,
  issueDate,
  currencySymbol = "$",
  targetCurrency = "USD",
  exchangeRates = {},
}) => {
  const totalItemsCount = purchasedItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandTitle}>{brand}</Text>
              <Text style={styles.brandSubtitle}>Nota de Entrega</Text>
            </View>
          </View>
          <View style={styles.reportDate}>
            <Text style={styles.reportDateLabel}>Generado el</Text>
            <Text style={styles.reportDateValue}>{new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</Text>
            <Text style={styles.reportTimeValue}>{new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</Text>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={[styles.statCard, { borderLeftColor: "#0f172a" }]}>
            <Text style={styles.statValue}>#{orderCode}</Text>
            <Text style={styles.statLabel}>Orden</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: "#22c55e" }]}>
            <Text style={styles.statValue}>{totalItemsCount}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: "#3b82f6" }]}>
            <Text style={styles.statValue}>{formData.paymentMethod}</Text>
            <Text style={styles.statLabel}>Pago</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: "#f59e0b" }]}>
            <Text style={styles.statValue}>{currencySymbol}{formatPrice(finalTotal, targetCurrency)}</Text>
            <Text style={styles.statLabel}>Monto</Text>
          </View>
        </View>

        {/* Datos */}
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Información del Cliente</Text>
            <Text style={styles.value}><Text style={styles.valueLabel}>Nombre: </Text>{formData.name || "No registrado"}</Text>
            <Text style={styles.value}><Text style={styles.valueLabel}>CI/RIF: </Text>{formData.idNumber || "No registrado"}</Text>
            <Text style={styles.value}><Text style={styles.valueLabel}>Tlf: </Text>{formData.phone || "No registrado"}</Text>
          </View>
          <View style={[styles.col, { textAlign: "right" }]}>
            <Text style={styles.sectionTitle}>Detalles del Pago</Text>
            <Text style={styles.value}><Text style={styles.valueLabel}>Método: </Text>{formData.paymentMethod}</Text>
            <Text style={styles.value}><Text style={styles.valueLabel}>Referencia: </Text>{formData.reference}</Text>
            <Text style={styles.value}><Text style={styles.valueLabel}>Fecha: </Text>{issueDate}</Text>
          </View>
        </View>

        {/* Tabla */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.cellQty]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.cellDesc]}>Producto / Descripción</Text>
            <Text style={[styles.tableHeaderCell, styles.cellPrice]}>Precio</Text>
            <Text style={[styles.tableHeaderCell, styles.cellTotal]}>Total</Text>
          </View>
          {purchasedItems.map((item, i) => {
            const itemBaseCurrency = item.base_currency || "USD";
            const itemPrice = convertPrice(
              (Number(item.price) || 0) + (Number(item.price_adjustment) || 0),
              itemBaseCurrency,
              targetCurrency,
              exchangeRates
            );
            return (
              <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
                <Text style={styles.cellQty}>{item.quantity}</Text>
                <View style={styles.cellDesc}>
                  <Text>{item.name || item.title}</Text>
                  {item.variant && <Text style={{ fontSize: 7, color: "#64748b", marginTop: 2 }}>Variante: {item.variant}</Text>}
                </View>
                <Text style={styles.cellPrice}>{currencySymbol}{formatPrice(itemPrice, targetCurrency)}</Text>
                <Text style={styles.cellTotal}>
                  {currencySymbol}{formatPrice(itemPrice * item.quantity, targetCurrency)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totales */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>Subtotal:</Text>
            <Text style={styles.totalRowValue}>{currencySymbol}{formatPrice(finalTotal, targetCurrency)}</Text>
          </View>
          <View style={styles.finalTotal}>
            <Text style={styles.finalTotalLabel}>TOTAL {targetCurrency}</Text>
            <Text style={styles.finalTotalValue}>
              {currencySymbol}{formatPrice(finalTotal, targetCurrency)}
            </Text>
          </View>
        </View>

        {/* Políticas */}
        <View style={styles.policyBox}>
          <Text style={styles.policyTitle}>NOTAS Y POLÍTICAS:</Text>
          <Text style={styles.policyText}>
            • El despacho se realiza previa confirmación de fondos en nuestras cuentas bancarias.
          </Text>
          <Text style={styles.policyText}>
            • Conserve este documento, es su comprobante oficial de entrega de mercancía.
          </Text>
          <Text style={styles.policyText}>
            • Los cambios por defecto de fábrica aplican dentro de los plazos establecidos en tienda, conservando empaque y etiquetas originales en perfecto estado.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>{brand}</Text>
          <Text>Página 1 de 1 · {new Date().toLocaleDateString("es-ES")}</Text>
        </View>
      </Page>
    </Document>
  );
};
