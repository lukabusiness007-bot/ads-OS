import { Button, Row, Column, Section, Text } from "@react-email/components";
import { EmailLayout, styles } from "./EmailLayout";

export type AnalyticsDigestStat = { label: string; value: string };

export type AnalyticsDigestEmailProps = {
  organizationName: string;
  rangeLabel: string;
  stats: AnalyticsDigestStat[];
  dashboardUrl: string;
  unsubscribeUrl: string;
};

export function AnalyticsDigestEmail({
  organizationName,
  rangeLabel,
  stats,
  dashboardUrl,
  unsubscribeUrl
}: AnalyticsDigestEmailProps) {
  return (
    <EmailLayout preview={`${organizationName} — your AR performance for ${rangeLabel}`} unsubscribeUrl={unsubscribeUrl}>
      <Text style={styles.heading}>Your AR performance</Text>
      <Text style={styles.muted}>
        {organizationName} · {rangeLabel}
      </Text>
      <Section style={{ margin: "12px 0" }}>
        {stats.map((stat) => (
          <Row key={stat.label} style={{ margin: "6px 0" }}>
            <Column style={styles.paragraph}>{stat.label}</Column>
            <Column style={{ ...styles.paragraph, fontWeight: 700, textAlign: "right", margin: 0 }}>
              {stat.value}
            </Column>
          </Row>
        ))}
      </Section>
      <Section style={{ margin: "8px 0 4px" }}>
        <Button href={dashboardUrl} style={styles.button}>
          Open analytics
        </Button>
      </Section>
    </EmailLayout>
  );
}

AnalyticsDigestEmail.PreviewProps = {
  organizationName: "Nordic Living",
  rangeLabel: "Jun 2 – Jun 9, 2026",
  stats: [
    { label: "Page views", value: "1,284" },
    { label: "AR launches", value: "342" },
    { label: "Store clicks", value: "97" },
    { label: "New models", value: "3" }
  ],
  dashboardUrl: "https://veridianar.com/analytics",
  unsubscribeUrl: "https://veridianar.com/unsubscribe?token=demo"
} satisfies AnalyticsDigestEmailProps;

export default AnalyticsDigestEmail;
