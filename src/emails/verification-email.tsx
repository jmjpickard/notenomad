import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface VerificationEmailProps {
  verificationLink: string;
  _host: string;
}

/**
 * Email template for account verification
 */
const VerificationEmail = ({
  verificationLink,
  _host,
}: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email for NoteMomad</Preview>
      <Body style={{ fontFamily: "Arial, sans-serif" }}>
        <Container>
          <Heading>Verify your email</Heading>
          <Section>
            <Text>
              Click the button below to verify your email address for NoteMomad.
              This link will expire in 24 hours.
            </Text>
            <Button
              href={verificationLink}
              style={{
                backgroundColor: "#4A86E8",
                color: "#fff",
                padding: "12px 20px",
                borderRadius: "3px",
              }}
            >
              Verify Email
            </Button>
            <Text>
              If you did not create an account with NoteMomad, you can safely
              ignore this email.
            </Text>
            <Text>
              If the button above does not work, you can also copy and paste
              this URL into your browser:
            </Text>
            <Link href={verificationLink}>{verificationLink}</Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;
