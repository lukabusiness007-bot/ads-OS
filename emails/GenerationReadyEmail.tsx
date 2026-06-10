import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, styles } from "./EmailLayout";

export type GenerationReadyEmailProps = {
  productName: string;
  dashboardUrl: string;
};

export function GenerationReadyEmail({ productName, dashboardUrl }: GenerationReadyEmailProps) {
  return (
    <EmailLayout preview={`Your 3D model for ${productName} is ready`}>
      <Text style={styles.heading}>Your model is ready 🎉</Text>
      <Text style={styles.paragraph}>
        The 3D model for <strong>{productName}</strong> has finished generating. Our team gives
        every model a quick quality check before it goes live, so you may see it marked
        &ldquo;in review&rdquo; for a short while.
      </Text>
      <Text style={styles.muted}>
        You&apos;ll be able to preview it, fine-tune details, and publish its AR page from your
        dashboard.
      </Text>
      <Section style={{ margin: "12px 0 4px" }}>
        <Button href={dashboardUrl} style={styles.button}>
          View your model
        </Button>
      </Section>
    </EmailLayout>
  );
}

GenerationReadyEmail.PreviewProps = {
  productName: "Walnut Lounge Chair",
  dashboardUrl: "https://augmenta3d.com/dashboard"
} satisfies GenerationReadyEmailProps;

export default GenerationReadyEmail;
