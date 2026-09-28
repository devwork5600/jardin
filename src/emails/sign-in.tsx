import { Button, Section, Text } from "react-email";
import { EmailLayout, emailHeadingStyle } from "./components/email-layout";

export type SignInEmailProps = { baseUrl: string; url: string };

export function SignInEmail({ baseUrl, url }: SignInEmailProps) {
  return (
    <EmailLayout preview="Votre lien de connexion" baseUrl={baseUrl}>
      <Text className="mt-[24px] mb-[8px] text-[28px] leading-[34px]" style={emailHeadingStyle}>
        Votre lien de connexion
      </Text>
      <Text className="m-0 text-[15px] leading-[24px]">
        Cliquez sur le bouton pour vous connecter. Ce lien expire dans 5 minutes.
      </Text>
      <Section className="my-[24px]">
        <Button
          href={url}
          className="rounded-[10px] bg-forest px-[28px] py-[14px] text-[13px] font-bold text-white no-underline"
        >
          Me connecter
        </Button>
      </Section>
      <Text className="m-0 text-[12px] leading-[18px] text-muted">
        {`Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur : ${url}`}
      </Text>
    </EmailLayout>
  );
}

SignInEmail.PreviewProps = { baseUrl: "http://localhost:3000", url: "http://localhost:3000/api/auth/magic-link/verify?token=abc" } satisfies SignInEmailProps;

export default SignInEmail;
