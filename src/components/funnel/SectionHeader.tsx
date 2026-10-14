import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

type SectionHeaderProps = {
  id: string;
  eyebrow: string;
  headline: string;
  body?: string;
};

export function SectionHeader({ id, eyebrow, headline, body }: SectionHeaderProps) {
  return (
    <>
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>

      <Reveal y={24}>
        <h2 id={`${id}-heading`} className="display-l mt-6">
          {headline}
        </h2>
      </Reveal>

      {body && (
        <Reveal delay={0.08}>
          <p className="body-copy mt-6">{body}</p>
        </Reveal>
      )}
    </>
  );
}
