import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Liste les parties jouées par l'utilisateur connecté, les plus récentes d'abord. */
export function History({ session }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    supabase
      .from("scores")
      .select("score, total, created_at, quizzes(title)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, [session.user.id]);

  if (!rows) return <p className="caret text-muted-foreground">chargement</p>;
  if (!rows.length) return <p className="text-muted-foreground">Aucune partie jouée pour l’instant. Lance un quizz !</p>;

  return (
    <Card>
      <CardHeader><CardTitle>Mon historique</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {rows.map((r, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-0">
            <span className="truncate">{r.quizzes?.title ?? "Quizz supprimé"}</span>
            <span className="font-semibold text-primary">{r.score} / {r.total}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
