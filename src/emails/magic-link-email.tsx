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

interface MagicLinkEmailProps {
  magicLink: string;
  host: string;
}

/**
 * Email template for sending magic links to users
 */
const MagicLinkEmail = ({ magicLink, host }: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your magic link for NoteMomad</Preview>
      <Body style={{ fontFamily: "Arial, sans-serif" }}>
        <Container>
          <Heading>Login to NoteMomad</Heading>
          <Section>
            <Text>
              Click the button below to sign in to NoteMomad. This link will
              expire in 10 minutes.
            </Text>
            <Button
              href={magicLink}
              style={{
                backgroundColor: "#4A86E8",
                color: "#fff",
                padding: "12px 20px",
                borderRadius: "3px",
              }}
            >
              Sign in to NoteMomad
            </Button>
            <Text>
              If you did not request this link, you can safely ignore this
              email.
            </Text>
            <Text>
              If the button above does not work, you can also copy and paste
              this URL into your browser:
            </Text>
            <Link href={magicLink}>{magicLink}</Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default MagicLinkEmail;
