import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, styles } from "./EmailLayout";

export type WelcomeEmailProps = {
  name: string;
  dashboardUrl: string;
};

export function WelcomeEmail({ name, dashboardUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout preview="Welcome to Augmenta — let's bring your products into AR">
      <Text style={styles.heading}>Welcome to Augmenta, {name} 👋</Text>
      <Text style={styles.paragraph}>
        Your account is ready. Upload a few product photos and we&apos;ll turn them into a
        web-ready 3D model and an augmented-reality experience your customers can place in
        their own space.
      </Text>
      <Text style={styles.paragraph}>
        Most products need just 3–6 clear photos from different angles to get a great result.
      </Text>
      <Section style={{ margin: "8px 0 4px" }}>
        <Button href={dashboardUrl} style={styles.button}>
          Open your dashboard
        </Button>
      </Section>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Sam",
  dashboardUrl: "https://veridianar.com/dashboard"
} satisfies WelcomeEmailProps;

export default WelcomeEmail;
