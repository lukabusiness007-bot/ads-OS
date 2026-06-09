import { Hr, Row, Column, Section, Text } from "@react-email/components";
import { EmailLayout, styles } from "./EmailLayout";

export type ReceiptEmailProps = {
  planName: string;
  amount: string;
  date: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
};

export function ReceiptEmail({ planName, amount, date, invoiceNumber, invoiceUrl }: ReceiptEmailProps) {
  return (
    <EmailLayout preview={`Your Augmenta receipt — ${amount}`}>
      <Text style={styles.heading}>Payment received</Text>
      <Text style={styles.paragraph}>
        Thanks for your payment. Here&apos;s a summary of your charge.
      </Text>
      <Section style={{ margin: "8px 0" }}>
        <Row style={{ margin: "4px 0" }}>
          <Column style={styles.muted}>Plan</Column>
          <Column style={{ ...styles.paragraph, textAlign: "right", margin: 0 }}>{planName}</Column>
        </Row>
        <Row style={{ margin: "4px 0" }}>
          <Column style={styles.muted}>Date</Column>
          <Column style={{ ...styles.paragraph, textAlign: "right", margin: 0 }}>{date}</Column>
        </Row>
        {invoiceNumber ? (
          <Row style={{ margin: "4px 0" }}>
            <Column style={styles.muted}>Invoice</Column>
            <Column style={{ ...styles.paragraph, textAlign: "right", margin: 0 }}>{invoiceNumber}</Column>
          </Row>
        ) : null}
        <Hr style={{ borderColor: "#e7e9e6", margin: "10px 0" }} />
        <Row style={{ margin: "4px 0" }}>
          <Column style={{ ...styles.paragraph, fontWeight: 700, margin: 0 }}>Total</Column>
          <Column style={{ ...styles.paragraph, fontWeight: 700, textAlign: "right", margin: 0 }}>{amount}</Column>
        </Row>
      </Section>
      {invoiceUrl ? (
        <Text style={styles.muted}>
          A full invoice is available here:{" "}
          <a href={invoiceUrl} style={{ color: styles.brand }}>
            view invoice
          </a>
          .
        </Text>
      ) : null}
    </EmailLayout>
  );
}

ReceiptEmail.PreviewProps = {
  planName: "Growth",
  amount: "€49.00",
  date: "June 9, 2026",
  invoiceNumber: "INV-1042",
  invoiceUrl: "https://invoice.stripe.com/i/test"
} satisfies ReceiptEmailProps;

export default ReceiptEmail;
