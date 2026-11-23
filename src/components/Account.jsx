import { useEffect, useRef, useState } from "react";
import { Lock, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

/** Écran unique de connexion ET de création de compte (les potes créent leur compte ici, toi aussi). */
export function Account({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaBox = useRef(null);
  const widgetId = useRef(null);

  // Affiche la case anti-robot Cloudflare Turnstile, seulement si une clé est configurée (VITE_TURNSTILE_SITE_KEY)
  useEffect(() => {
    if (!SITE_KEY) return;
    const render = () => {
      if (window.turnstile && captchaBox.current && widgetId.current === null) {
        widgetId.current = window.turnstile.render(captchaBox.current, {
          sitekey: SITE_KEY,
          callback: setCaptchaToken,
          "expired-callback": () => setCaptchaToken(""),
        });
      }
    };
    if (window.turnstile) render();
    const t = setInterval(() => { if (window.turnstile && widgetId.current === null) { render(); clearInterval(t); } }, 300);
    return () => clearInterval(t);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (SITE_KEY && !captchaToken) return setMsg("Coche la case de vérification avant de continuer.");
    setSending(true);
    setMsg("");
    const options = SITE_KEY ? { captchaToken } : undefined;
    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password: pwd, options })
        : await supabase.auth.signUp({ email, password: pwd, options });
    setSending(false);
    if (window.turnstile && widgetId.current !== null) window.turnstile.reset(widgetId.current);
    setCaptchaToken("");
    if (error) return setMsg(error.message);
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
          <Input type="password" placeholder="mot de passe (8 caractères min.)" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={8} />
          {SITE_KEY && <div ref={captchaBox} />}
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
