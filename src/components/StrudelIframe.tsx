import { generateStrudelUrl } from "~/utils/strudel";

interface StrudelIframeProps {
  strudelCode: string;
  title: string;
  className?: string;
  height?: string;
}

export function StrudelIframe({ 
  strudelCode, 
  title, 
  className = "w-full",
  height = "500px" 
}: StrudelIframeProps) {
  return (
    <iframe
      src={generateStrudelUrl(strudelCode)}
      className={`${className} border border-border rounded-md`}
      style={{ height }}
      title={`Strudel code for ${title}`}
      allow="autoplay; microphone"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
    />
  );
}