import { useEffect, useMemo, useState } from "react";
import { Terminal, Lock, LogOut, Trash2, Plus, Play, ChevronLeft, Upload, History as HistoryIcon } from "lucide-react";
import { supabase, uploadMedia } from "@/lib/supabase";
import { shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { QuestionMedia, QUESTION_TYPES, CODE_LANGUAGES } from "@/components/QuestionMedia";
import { Account } from "@/components/Account";
import { History } from "@/components/History";

/* ───────────── Joueur : liste des quizz ───────────── */
function Home({ onPlay }) {
  const [quizzes, setQuizzes] = useState(null);
  useEffect(() => {
    supabase.from("quizzes").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setQuizzes(data ?? []));
  }, []);
  if (!quizzes) return <p className="caret text-muted-foreground">chargement</p>;
  if (!quizzes.length) return <p className="text-muted-foreground">Aucun quizz pour l’instant. Connecte-toi en admin pour en créer un.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {quizzes.map((q) => (
        <Card key={q.id}>
          <CardContent className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{q.title}</p>
              <p className="text-xs text-accent">#{q.theme}</p>
            </div>
            <Button size="sm" onClick={() => onPlay(q)}><Play size={14} /> Lancer</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ───────────── Joueur : partie ───────────── */
function PlayQuiz({ quiz, onExit, session }) {
  const [qs, setQs] = useState(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("questions").select("*").eq("quiz_id", quiz.id)
      .then(({ data }) => setQs(shuffle(data ?? [])));
  }, [quiz.id]);

  const [saveError, setSaveError] = useState("");

  // Enregistre le score une seule fois, uniquement si quelqu'un est connecté (sinon la partie reste anonyme)
  useEffect(() => {
    if (qs?.length && i >= qs.length && session && !saved) {
      setSaved(true);
      supabase.from("scores").insert({ user_id: session.user.id, quiz_id: quiz.id, score, total: qs.length })
        .then(({ error }) => { if (error) setSaveError(error.message); });
    }
  }, [i, qs, session, saved, score, quiz.id]);

  const cur = qs?.[i];
  // les 4 réponses sont mélangées une seule fois par question
  const answers = useMemo(() => (cur ? shuffle([cur.correct, ...cur.wrong]) : []), [cur]);

  if (!qs) return <p className="caret text-muted-foreground">chargement</p>;
  if (!qs.length) return <p className="text-muted-foreground">Ce quizz ne contient pas encore de question.</p>;

  if (i >= qs.length)
    return (
      <Card><CardContent className="space-y-4">
        <p className="text-xl font-extrabold text-primary">$ score --final</p>
        <p className="text-3xl font-extrabold">{score} / {qs.length}</p>
        {saveError && <p className="text-sm text-destructive">Score non enregistré : {saveError}</p>}
        <div className="flex gap-2">
          <Button onClick={() => { setI(0); setScore(0); setPicked(null); setSaved(false); setQs(shuffle(qs)); }}>Rejouer</Button>
          <Button variant="outline" onClick={onExit}>Retour</Button>
        </div>
      </CardContent></Card>
    );

  const pick = (a) => { if (picked) return; setPicked(a); if (a === cur.correct) setScore((s) => s + 1); };
  const next = () => { setPicked(null); setI((n) => n + 1); };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{quiz.title}</span><span>question {i + 1}/{qs.length}</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <QuestionMedia q={cur} />
        <div className="grid gap-2">
          {answers.map((a) => {
            const state = !picked ? "" : a === cur.correct ? "border-primary text-primary" : a === picked ? "border-destructive text-destructive" : "opacity-50";
            return (
              <button key={a} onClick={() => pick(a)} disabled={!!picked}
                className={`rounded-md border border-border px-4 py-3 text-left text-sm transition-colors enabled:hover:border-accent ${state}`}>
                {a}
              </button>
            );
          })}
        </div>
        {picked && <Button onClick={next}>{i + 1 === qs.length ? "Voir le score" : "Question suivante"}</Button>}
      </CardContent>
    </Card>
  );
}

/* ───────────── Admin : tableau de bord ───────────── */
function Dashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [sel, setSel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [nq, setNq] = useState({ title: "", theme: "" });
  const empty = { type: "text", question: "", language: "javascript", correct: "", w1: "", w2: "", w3: "" };
  const [f, setF] = useState(empty);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const needsFile = f.type === "image" || f.type === "audio";

  const loadQuizzes = async () => {
    const { data } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
    setQuizzes(data ?? []);
  };
  const loadQuestions = async (id) => {
    const { data } = await supabase.from("questions").select("*").eq("quiz_id", id).order("created_at");
    setQuestions(data ?? []);
  };
  useEffect(() => { loadQuizzes(); }, []);
  useEffect(() => { if (sel) loadQuestions(sel.id); }, [sel]);

  const createQuiz = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from("quizzes").insert(nq).select().single();
    if (error) return setMsg(error.message);
    setNq({ title: "", theme: "" }); setMsg(""); await loadQuizzes(); setSel(data);
  };
  const deleteQuiz = async (q) => {
    if (!confirm(`Supprimer « ${q.title} » et toutes ses questions ?`)) return;
    await supabase.from("quizzes").delete().eq("id", q.id);
    setSel(null); loadQuizzes();
  };
  const addQuestion = async (e) => {
    e.preventDefault();
    if (needsFile && !file) return setMsg("Ajoute un fichier avant d’envoyer.");
    setSending(true);
    setMsg("");
    try {
      let media_url = null;
      if (needsFile) media_url = await uploadMedia(file);
      const { error } = await supabase.from("questions").insert({
        quiz_id: sel.id,
        type: f.type,
        question: f.question,
        language: f.type === "code" ? f.language : null,
        media_url,
        correct: f.correct,
        wrong: [f.w1, f.w2, f.w3],
      });
      if (error) throw error;
      setF(empty); setFile(null); loadQuestions(sel.id);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSending(false);
    }
  };
  const deleteQuestion = async (id) => { await supabase.from("questions").delete().eq("id", id); loadQuestions(sel.id); };

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <Card className="h-fit">
        <CardHeader><CardTitle>Mes quizz</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={createQuiz} className="space-y-2">
            <Input placeholder="titre du quizz" value={nq.title} onChange={(e) => setNq({ ...nq, title: e.target.value })} required />
            <Input placeholder="thème (ex: linux)" value={nq.theme} onChange={(e) => setNq({ ...nq, theme: e.target.value })} required />
            <Button className="w-full" type="submit"><Plus size={14} /> Créer le quizz</Button>
          </form>
          <div className="space-y-1">
            {quizzes.map((q) => (
              <button key={q.id} onClick={() => setSel(q)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${sel?.id === q.id ? "border-primary text-primary" : "border-border hover:border-accent"}`}>
                {q.title} <span className="text-xs text-muted-foreground">#{q.theme}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {msg && <p className="text-sm text-destructive">{msg}</p>}
        {!sel ? (
          <p className="text-muted-foreground">Crée un quizz ou sélectionne-en un pour gérer ses questions.</p>
        ) : (
          <>
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>{sel.title}</CardTitle>
                <Button size="sm" variant="destructive" onClick={() => deleteQuiz(sel)}><Trash2 size={14} /> Supprimer le quizz</Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={addQuestion} className="space-y-2">
                  <Select
                    value={f.type}
                    onChange={(e) => { setFile(null); setF({ ...f, type: e.target.value, question: "" }); }}
                  >
                    {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>

                  {f.type === "code" && (
                    <Select value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })}>
                      {CODE_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </Select>
                  )}

                  {f.type === "code" ? (
                    <textarea
                      className="min-h-32 w-full rounded-md border border-border bg-background p-3 font-mono text-sm placeholder:text-muted-foreground focus-visible:border-accent"
                      placeholder="Colle ton code ici (il sera coloré, jamais exécuté)"
                      value={f.question}
                      onChange={(e) => setF({ ...f, question: e.target.value })}
                      required
                    />
                  ) : f.type === "math" ? (
                    <>
                      <Input
                        placeholder="Formule en LaTeX, ex: x^2 + y^2 = z^2"
                        value={f.question}
                        onChange={(e) => setF({ ...f, question: e.target.value })}
                        required
                      />
                      {f.question && <QuestionMedia q={{ type: "math", question: f.question }} compact />}
                    </>
                  ) : needsFile ? (
                    <>
                      <label className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:border-accent">
                        <Upload size={16} />
                        {file ? file.name : f.type === "image" ? "Choisir une image" : "Choisir un fichier audio"}
                        <input
                          type="file"
                          accept={f.type === "image" ? "image/*" : "audio/*"}
                          className="hidden"
                          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      <Input
                        placeholder="Légende (optionnel)"
                        value={f.question}
                        onChange={(e) => setF({ ...f, question: e.target.value })}
                      />
                    </>
                  ) : (
                    <Input placeholder="La question" value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} required />
                  )}

                  <Input className="border-primary/60" placeholder="Bonne réponse" value={f.correct} onChange={(e) => setF({ ...f, correct: e.target.value })} required />
                  {["w1", "w2", "w3"].map((k, n) => (
                    <Input key={k} className="border-destructive/40" placeholder={`Mauvaise réponse ${n + 1}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} required />
                  ))}
                  <Button type="submit" disabled={sending}><Plus size={14} /> {sending ? "Envoi…" : "Ajouter la question"}</Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {questions.map((q) => (
                <Card key={q.id}><CardContent className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1 space-y-1 text-sm">
                    <QuestionMedia q={q} compact />
                    <p className="text-primary">✓ {q.correct}</p>
                    <p className="text-destructive">✗ {q.wrong.join(" | ")}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteQuestion(q.id)} aria-label="Supprimer la question"><Trash2 size={14} /></Button>
                </CardContent></Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────── Application ───────────── */
export default function App() {
  const [view, setView] = useState("home"); // home | play | account | history | admin
  const [quiz, setQuiz] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // Vérifie, à chaque connexion, si l'utilisateur fait partie de la table "admins"
  useEffect(() => {
    if (!session) return setIsAdmin(false);
    supabase.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between border-b border-border pb-4">
        <button onClick={() => setView("home")} className="flex cursor-pointer items-center gap-2 text-xl font-extrabold text-primary">
          <Terminal size={22} /> <span className="caret">quiz.exe</span>
        </button>
        <div className="flex gap-2">
          {view !== "home" && <Button size="sm" variant="outline" onClick={() => setView("home")}><ChevronLeft size={14} /> Quizz</Button>}
          {session ? (
            <>
              {view !== "history" && <Button size="sm" variant="outline" onClick={() => setView("history")}><HistoryIcon size={14} /> Historique</Button>}
              {isAdmin && view !== "admin" && <Button size="sm" variant="outline" onClick={() => setView("admin")}>Admin</Button>}
              <Button size="sm" variant="ghost" onClick={() => supabase.auth.signOut()}><LogOut size={14} /> Déconnexion</Button>
            </>
          ) : (
            view !== "account" && <Button size="sm" variant="ghost" onClick={() => setView("account")}><Lock size={14} /> Compte</Button>
          )}
        </div>
      </header>

      {view === "home" && <Home onPlay={(q) => { setQuiz(q); setView("play"); }} />}
      {view === "play" && <PlayQuiz quiz={quiz} onExit={() => setView("home")} session={session} />}
      {view === "account" && <Account />}
      {view === "history" && (session ? <History session={session} /> : <Account />)}
      {view === "admin" && (
        !session ? <Account />
        : isAdmin ? <Dashboard />
        : <p className="text-destructive">Accès refusé : ce compte n’est pas administrateur.</p>
      )}
    </div>
  );
}
