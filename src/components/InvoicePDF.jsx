import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#FFFFFF", fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: 2,
    borderColor: "#000",
    paddingBottom: 20,
    marginBottom: 20,
  },
  brand: { fontSize: 24, fontWeight: "bold", textTransform: "uppercase" },
  orderInfo: { textAlign: "right" },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottom: 1,
    borderColor: "#EEE",
    paddingBottom: 5,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  col: { width: "45%" },
  label: { fontSize: 9, color: "#666" },
  value: { fontSize: 10, marginBottom: 4 },
  tableHeader: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#000",
    paddingBottom: 5,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#EEE",
    paddingVertical: 8,
  },
  cellQty: { width: "10%", fontSize: 10 },
  cellDesc: { width: "60%", fontSize: 10 },
  cellPrice: { width: "15%", fontSize: 10, textAlign: "right" },
  cellTotal: {
    width: "15%",
    fontSize: 10,
    textAlign: "right",
    fontWeight: "bold",
  },
  totalSection: { marginTop: 20, alignSelf: "flex-end", width: 200 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  finalTotal: {
    backgroundColor: "#000",
    color: "#FFF",
    padding: 8,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  policyBox: { marginTop: 40, padding: 10, backgroundColor: "#F9F9F9" },
  policyTitle: { fontSize: 9, fontWeight: "bold", marginBottom: 5 },
  policyText: { fontSize: 8, color: "#666", lineHeight: 1.4 },
});

import { convertPrice, formatPrice } from "@/services/exchangeRates";

export const InvoicePDF = ({
  formData,
  finalTotal,
  purchasedItems,
  orderCode,
  brand,
  issueDate,
  currencySymbol = "$",
  targetCurrency = "USD",
  exchangeRates = {},
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>{brand}</Text>
          <Text style={{ fontSize: 10, color: "#666" }}>
            Comprobante Electrónico
          </Text>
        </View>
        <View style={styles.orderInfo}>
          <Text style={{ fontSize: 12, fontWeight: "bold" }}>
            ORDEN #{orderCode}
          </Text>
          <Text style={{ fontSize: 9, color: "#666" }}>{issueDate}</Text>
        </View>
      </View>

      {/* Datos */}
      <View style={styles.grid}>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Text style={styles.value}>{formData.name}</Text>
          <Text style={styles.value}>CI/RIF: {formData.idNumber || "N/A"}</Text>
          <Text style={styles.value}>Tlf: {formData.phone}</Text>
        </View>
        <View style={[styles.col, { textAlign: "right" }]}>
          <Text style={styles.sectionTitle}>Pago</Text>
          <Text style={styles.value}>Método: {formData.paymentMethod}</Text>
          <Text style={styles.value}>Ref: {formData.reference}</Text>
        </View>
      </View>

      {/* Tabla */}
      <View style={styles.tableHeader}>
        <Text style={styles.cellQty}>Cant.</Text>
        <Text style={styles.cellDesc}>Descripción</Text>
        <Text style={styles.cellPrice}>Precio</Text>
        <Text style={styles.cellTotal}>Total</Text>
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
          <View key={i} style={styles.tableRow}>
            <Text style={styles.cellQty}>{item.quantity}</Text>
            <Text style={styles.cellDesc}>{item.name || item.title}</Text>
            <Text style={styles.cellPrice}>{currencySymbol}{formatPrice(itemPrice, targetCurrency)}</Text>
            <Text style={styles.cellTotal}>
              {currencySymbol}{formatPrice(itemPrice * item.quantity, targetCurrency)}
            </Text>
          </View>
        );
      })}

      {/* Totales */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={{ fontSize: 10 }}>Subtotal (Aprox):</Text>
          <Text style={{ fontSize: 10 }}>{currencySymbol}{formatPrice(finalTotal, targetCurrency)}</Text>
        </View>
        <View style={styles.finalTotal}>
          <Text style={{ fontSize: 10, fontWeight: "bold" }}>TOTAL {targetCurrency}</Text>
          <Text style={{ fontSize: 12, fontWeight: "bold" }}>
            {currencySymbol}{formatPrice(finalTotal, targetCurrency)}
          </Text>
        </View>
      </View>

      {/* Políticas */}
      <View style={styles.policyBox}>
        <Text style={styles.policyTitle}>POLÍTICAS DE CAMBIO:</Text>
        <Text style={styles.policyText}>
          • 15 días continuos para cambios por defecto.
        </Text>
        <Text style={styles.policyText}>
          • Ropa interior no tiene cambio por higiene.
        </Text>
        <Text style={styles.policyText}>
          • Debe conservar etiquetas y estado original.
        </Text>
      </View>
    </Page>
  </Document>
);
