import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text
} from "@react-email/components";
import type { ReactNode } from "react";

const BRAND = "#0f7a52";
const TEXT = "#1a1a1a";
const MUTED = "#8a8a8a";

type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
  /** When set, renders a marketing unsubscribe footer link. */
  unsubscribeUrl?: string;
};

export function EmailLayout({ preview, children, unsubscribeUrl }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>Augmenta</Text>
          </Section>
          <Section style={card}>{children}</Section>
          <Hr style={hr} />
          <Text style={footer}>
            Augmenta · Bring your products into augmented reality
          </Text>
          {unsubscribeUrl ? (
            <Text style={footer}>
              <Link href={unsubscribeUrl} style={{ color: MUTED, textDecoration: "underline" }}>
                Unsubscribe from marketing emails
              </Link>
            </Text>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}

export const styles = {
  heading: { fontSize: "22px", fontWeight: 700, color: TEXT, margin: "0 0 12px" } as const,
  paragraph: { fontSize: "15px", lineHeight: "24px", color: TEXT, margin: "0 0 16px" } as const,
  muted: { fontSize: "13px", lineHeight: "20px", color: MUTED, margin: "0 0 8px" } as const,
  button: {
    backgroundColor: BRAND,
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    padding: "12px 22px",
    display: "inline-block"
  } as const,
  brand: BRAND
};

const body = { backgroundColor: "#f4f5f3", fontFamily: "-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", margin: 0, padding: "24px 0" } as const;
const container = { maxWidth: "560px", margin: "0 auto", padding: "0 16px" } as const;
const header = { padding: "8px 0 16px" } as const;
const brand = { fontSize: "20px", fontWeight: 800, color: BRAND, margin: 0 } as const;
const card = { backgroundColor: "#ffffff", borderRadius: "14px", padding: "28px", border: "1px solid #e7e9e6" } as const;
const hr = { borderColor: "#e7e9e6", margin: "20px 0 12px" } as const;
const footer = { fontSize: "12px", color: MUTED, textAlign: "center" as const, margin: "0 0 4px" } as const;
