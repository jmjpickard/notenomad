import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

/**
 * Page displayed after a user requests a magic link
 */
const VerifyRequestPage = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            A sign in link has been sent to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground text-sm">
            Please check your email for a sign in link. This link will expire in
            10 minutes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyRequestPage;
