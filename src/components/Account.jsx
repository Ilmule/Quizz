import { useState } from "react";
import { Lock, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Écran unique de connexion ET de création de compte (les potes créent leur compte ici, toi aussi). */
export function Account({ onLoggedIn }) {
    // TEMPORAIRE : à retirer une fois le souci de clé résolu
  useEffect(() => { console.log("DEBUG SITE_KEY =", JSON.stringify(SITE_KEY)); }, []);
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setMsg("");
    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password: pwd })
        : await supabase.auth.signUp({ email, password: pwd });
    setSending(false);
    if (error) return setMsg(error.message);
    // Une session active signifie que la connexion a vraiment eu lieu (pas besoin d'attendre une confirmation par email)
    if (data?.session) return onLoggedIn?.();
    if (mode === "signup") setMsg("Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse avant de jouer.");
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === "login" ? <Lock size={16} /> : <UserPlus size={16} />}
          {mode === "login" ? "sudo login" : "créer un compte"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={submit} className="space-y-3">
          <Input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="mot de passe (6 caractères min.)" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={6} />
          {msg && <p className="text-sm text-destructive">{msg}</p>}
          <Button className="w-full" type="submit" disabled={sending}>
            {sending ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(""); }}
          className="w-full cursor-pointer text-center text-xs text-muted-foreground hover:text-accent"
        >
          {mode === "login" ? "Pas encore de compte ? Crée-en un" : "Déjà un compte ? Connecte-toi"}
        </button>
      </CardContent>
    </Card>
  );
}
