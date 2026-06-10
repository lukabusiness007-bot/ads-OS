import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, styles } from "./EmailLayout";

export type SubscriptionChange = "renewed" | "updated" | "canceled" | "trial_ending";

export type SubscriptionEmailProps = {
  change: SubscriptionChange;
  planName: string;
  billingUrl: string;
  periodEnd?: string;
};

const COPY: Record<SubscriptionChange, { heading: string; body: (plan: string, end?: string) => string }> = {
  renewed: {
    heading: "Your subscription renewed",
    body: (plan) => `Your ${plan} plan has renewed. Thanks for staying with Augmenta.`
  },
  updated: {
    heading: "Your plan was updated",
    body: (plan) => `Your subscription is now on the ${plan} plan.`
  },
  canceled: {
    heading: "Your subscription was canceled",
    body: (plan, end) =>
      `Your ${plan} plan has been canceled${end ? ` and access continues until ${end}` : ""}. You can resubscribe any time.`
  },
  trial_ending: {
    heading: "Your trial is ending soon",
    body: (plan, end) =>
      `Your ${plan} trial${end ? ` ends on ${end}` : " is ending soon"}. Add a payment method to keep your AR pages live.`
  }
};

export function SubscriptionEmail({ change, planName, billingUrl, periodEnd }: SubscriptionEmailProps) {
  const copy = COPY[change];
  return (
    <EmailLayout preview={copy.heading}>
      <Text style={styles.heading}>{copy.heading}</Text>
      <Text style={styles.paragraph}>{copy.body(planName, periodEnd)}</Text>
      <Section style={{ margin: "12px 0 4px" }}>
        <Button href={billingUrl} style={styles.button}>
          Manage billing
        </Button>
      </Section>
    </EmailLayout>
  );
}

SubscriptionEmail.PreviewProps = {
  change: "trial_ending",
  planName: "Growth",
  billingUrl: "https://augmenta3d.com/billing",
  periodEnd: "June 16, 2026"
} satisfies SubscriptionEmailProps;

export default SubscriptionEmail;
