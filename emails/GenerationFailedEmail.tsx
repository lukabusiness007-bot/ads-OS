import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, styles } from "./EmailLayout";

export type GenerationFailedEmailProps = {
  productName: string;
  dashboardUrl: string;
  reason?: string;
};

export function GenerationFailedEmail({ productName, dashboardUrl, reason }: GenerationFailedEmailProps) {
  return (
    <EmailLayout preview={`We couldn't finish the model for ${productName}`}>
      <Text style={styles.heading}>Generation didn&apos;t finish</Text>
      <Text style={styles.paragraph}>
        We hit a problem generating the 3D model for <strong>{productName}</strong>.
        {reason ? ` ${reason}` : ""}
      </Text>
      <Text style={styles.muted}>
        This usually resolves on a retry. New, well-lit photos from a few angles give the best
        chance of success.
      </Text>
      <Section style={{ margin: "12px 0 4px" }}>
        <Button href={dashboardUrl} style={styles.button}>
          Try again
        </Button>
      </Section>
    </EmailLayout>
  );
}

GenerationFailedEmail.PreviewProps = {
  productName: "Walnut Lounge Chair",
  dashboardUrl: "https://augmenta3d.com/dashboard",
  reason: "The uploaded photos didn't have enough detail to reconstruct the shape."
} satisfies GenerationFailedEmailProps;

export default GenerationFailedEmail;
