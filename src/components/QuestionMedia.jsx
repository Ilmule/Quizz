import { useMemo } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-php";
import "prismjs/themes/prism-okaidia.css";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Code2, Image as ImageIcon, Sigma, Volume2 } from "lucide-react";

// Types de support disponibles pour une question
export const QUESTION_TYPES = [
  { value: "text", label: "📝 Texte" },
  { value: "code", label: "💻 Code" },
  { value: "image", label: "🖼️ Image" },
  { value: "math", label: "📐 Formule mathématique" },
  { value: "audio", label: "🎵 Audio" },
];

// Langages proposés pour la coloration du code
export const CODE_LANGUAGES = [
  "javascript", "python", "html", "css", "sql", "bash", "json", "java", "c", "cpp", "php",
];

const BADGES = {
  code: { icon: Code2, label: "code" },
  image: { icon: ImageIcon, label: "image" },
  math: { icon: Sigma, label: "formule" },
  audio: { icon: Volume2, label: "audio" },
};

/** Petite étiquette affichée au-dessus d'une question non-textuelle, pour que le joueur comprenne tout de suite ce qu'il regarde. */
function TypeBadge({ type }) {
  const b = BADGES[type];
  if (!b) return null;
  const Icon = b.icon;
  return (
    <span className="mb-2 inline-flex items-center gap-1 rounded border border-accent/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-accent">
      <Icon size={11} /> {b.label}
    </span>
  );
}

/** Affiche le contenu d'une question (q.question / q.media_url / q.language) selon q.type. Jamais exécuté : le code est seulement coloré visuellement. */
export function QuestionMedia({ q, compact = false }) {
  const html = useMemo(() => {
    if (q.type === "code") {
      const grammar = Prism.languages[q.language] || Prism.languages.javascript;
      return Prism.highlight(q.question || "", grammar, q.language || "javascript");
    }
    if (q.type === "math") {
      try {
        return katex.renderToString(q.question || "", { throwOnError: false, displayMode: true });
      } catch {
        return q.question;
      }
    }
    return null;
  }, [q.type, q.question, q.language]);

  const size = compact ? "text-sm" : "text-lg";

  return (
    <div>
      <TypeBadge type={q.type} />
      {(!q.type || q.type === "text") && <p className={`font-semibold ${size}`}><span className="text-primary">&gt; </span>{q.question}</p>}

      {q.type === "code" && (
        <pre className="overflow-x-auto rounded-md border border-border bg-[#0a0e14] p-4 text-sm leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      )}

      {q.type === "image" && (
        <div className="space-y-2">
          {q.question && <p className={size}>{q.question}</p>}
          {q.media_url && <img src={q.media_url} alt="" className="max-h-80 rounded-md border border-border object-contain" />}
        </div>
      )}

      {q.type === "math" && (
        <div className="overflow-x-auto rounded-md border border-border bg-background p-4" dangerouslySetInnerHTML={{ __html: html }} />
      )}

      {q.type === "audio" && (
        <div className="space-y-2">
          {q.question && <p className={size}>{q.question}</p>}
          {q.media_url && <audio controls src={q.media_url} className="w-full" />}
        </div>
      )}
    </div>
  );
}
