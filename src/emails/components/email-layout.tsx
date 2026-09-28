import type { ReactNode } from "react";
import { Body, Container, Head, Hr, Html, Img, Preview, Section, Tailwind, Text, pixelBasedPreset } from "react-email";

// Same palette as the site (globals.css), spelled out because mail clients
// don't know CSS variables.
const config = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        ink: "#16261d",
        forest: "#173a2a",
        ivory: "#f7f5f1",
        copper: "#8c4a26",
        muted: "#7a857d",
        line: "#ece8df",
      },
    },
  },
};

const SERIF = "Georgia, 'Times New Roman', serif";

// Templates are pure (props in, markup out) so `npm run email:dev` can preview
// them without a database. `baseUrl` is the public address of the site.
export function EmailLayout({
  preview,
  baseUrl,
  children,
}: {
  preview: string;
  baseUrl: string;
  children: ReactNode;
}) {
  // A mail client can't load an image from localhost: only show the logo once
  // the site has a public address.
  const showLogo = !baseUrl.includes("localhost");

  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind config={config}>
        <Body className="bg-ivory font-sans text-ink">
          <Container className="mx-auto my-0 max-w-[560px] px-[20px] py-[32px]">
            <Section>
              {showLogo && (
                <Img
                  src={`${baseUrl}/icons/icon-192.png`}
                  width="36"
                  height="36"
                  alt=""
                  className="mb-[8px] rounded-[8px]"
                />
              )}
              <Text className="m-0 text-[22px] text-forest italic" style={{ fontFamily: SERIF }}>
                Feuilles et épines
              </Text>
            </Section>

            {children}

            <Hr className="mt-[32px] mb-[16px] border-line" />
            <Text className="m-0 text-[12px] leading-[18px] text-muted">
              Site de démonstration : aucune vente réelle n&apos;a lieu, ce message est un exemple.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export const emailHeadingStyle = { fontFamily: SERIF };
