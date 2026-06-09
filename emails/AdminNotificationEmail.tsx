import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, styles } from "./EmailLayout";

export type AdminNotificationEmailProps = {
  productName: string;
  merchantName: string;
  action: "awaiting_review" | "generation_failed";
  reviewUrl: string;
};

export function AdminNotificationEmail({ productName, merchantName, action, reviewUrl }: AdminNotificationEmailProps) {
  const isReview = action === "awaiting_review";
  return (
    <EmailLayout preview={isReview ? `Model ready for review: ${productName}` : `Generation failed: ${productName}`}>
      <Text style={styles.heading}>{isReview ? "Model ready for review" : "Generation failed"}</Text>
      <Text style={styles.paragraph}>
        <strong>Product:</strong> {productName}
        <br />
        <strong>Merchant:</strong> {merchantName}
        <br />
        <strong>Status:</strong> {action.replaceAll("_", " ")}
      </Text>
      <Section style={{ margin: "12px 0 4px" }}>
        <Button href={reviewUrl} style={styles.button}>
          Open review inspector
        </Button>
      </Section>
      <Text style={styles.muted}>Augmenta Admin · Internal only</Text>
    </EmailLayout>
  );
}

AdminNotificationEmail.PreviewProps = {
  productName: "Walnut Lounge Chair",
  merchantName: "Nordic Living",
  action: "awaiting_review",
  reviewUrl: "https://veridianar.com/admin/review/123"
} satisfies AdminNotificationEmailProps;

export default AdminNotificationEmail;
