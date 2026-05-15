import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const MOODS = [
  { emoji: "🤩", value: "excited",  label: "Excited"  },
  { emoji: "😊", value: "happy",    label: "Happy"    },
  { emoji: "😐", value: "neutral",  label: "Neutral"  },
  { emoji: "😴", value: "tired",    label: "Tired"    },
  { emoji: "😰", value: "anxious",  label: "Anxious"  },
  { emoji: "😓", value: "stressed", label: "Stressed" },
  { emoji: "😠", value: "angry",    label: "Angry"    },
];

export default function Submit({ user }) {
  const [teams, setTeams]         = useState([]);
  const [teamId, setTeamId]       = useState("");
  const [mood, setMood]           = useState("");
  const [thoughts, setThoughts]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");
  const [aiResult, setAiResult]   = useState(null);

  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    const { data: memberRows } = await supabase
      .from("team_members")
      .select("team_id, teams(id, name, color)")
      .eq("user_id", user.id);
    const myTeams = memberRows?.map((r) => r.teams).filter(Boolean) || [];
    setTeams(myTeams);
    if (myTeams.length > 0) setTeamId(myTeams[0].id);
  };

  const analyzeWithAI = async (text) => {
    setAnalyzing(true);
    try {
      const token = import.meta.env.VITE_HF_TOKEN;
      const response = await fetch(
        "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text })
        }
      );

      const data = await response.json();
      const results = data[0];
      if (!results) throw new Error("No results");

      const top = results.reduce((a, b) => a.score > b.score ? a : b);
      const sentiment = top.label.toLowerCase() === "positive" ? "positive"
                      : top.label.toLowerCase() === "negative" ? "negative"
                      : "neutral";
      const score = sentiment === "positive" ? top.score
                  : sentiment === "negative" ? -top.score
                  : 0;

      const emotional_tone = sentiment === "positive" ? "motivated"
                           : sentiment === "negative" ? "frustrated"
                           : "content";
      const flag = sentiment === "negative" && top.score > 0.7;
      const summaryMap = {
        motivated: "This person seems to be in a positive and energized state.",
        content: "This person seems comfortable and at ease.",
        frustrated: "This person may be experiencing stress or frustration.",
      };

      return {
        sentiment,
        sentiment_score: parseFloat(score.toFixed(2)),
        emotional_tone,
        summary: summaryMap[emotional_tone],
        flag,
      };

    } catch (e) {
      console.error("AI error:", e);

      const lowerText = text.toLowerCase();

      const positiveWords = [
        // Strong positive phrases
        { w: "extremely happy", v: 0.95 }, { w: "so happy", v: 0.88 },
        { w: "very happy", v: 0.85 }, { w: "super happy", v: 0.89 },
        { w: "sobrang happy", v: 0.90 }, { w: "love this", v: 0.87 },
        { w: "love it", v: 0.86 }, { w: "love na love", v: 0.91 },
        { w: "so good", v: 0.79 }, { w: "very good", v: 0.81 },
        { w: "so great", v: 0.82 }, { w: "so excited", v: 0.86 },
        { w: "super excited", v: 0.88 }, { w: "really happy", v: 0.86 },
        { w: "really good", v: 0.79 }, { w: "really great", v: 0.82 },
        { w: "feeling good", v: 0.74 }, { w: "feeling great", v: 0.79 },
        { w: "feel good", v: 0.72 }, { w: "feel great", v: 0.77 },
        { w: "doing well", v: 0.68 }, { w: "going well", v: 0.71 },
        { w: "all good", v: 0.64 }, { w: "so blessed", v: 0.84 },
        { w: "very blessed", v: 0.83 }, { w: "so grateful", v: 0.84 },
        { w: "very grateful", v: 0.82 }, { w: "thank god", v: 0.76 },
        { w: "thank goodness", v: 0.72 }, { w: "no complaints", v: 0.67 },
        { w: "couldn't be better", v: 0.91 }, { w: "could not be better", v: 0.91 },
        { w: "best day", v: 0.87 }, { w: "great day", v: 0.81 },
        { w: "good day", v: 0.72 }, { w: "good vibes", v: 0.78 },
        { w: "positive vibes", v: 0.79 }, { w: "high spirits", v: 0.81 },
        { w: "on top of the world", v: 0.93 }, { w: "over the moon", v: 0.92 },
        { w: "thrilled", v: 0.84 }, { w: "delighted", v: 0.83 },
        { w: "ecstatic", v: 0.92 }, { w: "elated", v: 0.89 },
        { w: "pumped", v: 0.81 }, { w: "pumped up", v: 0.83 },
        { w: "hyped", v: 0.82 }, { w: "stoked", v: 0.83 },
        { w: "fired up", v: 0.81 }, { w: "lit", v: 0.73 },
        // English single words
        { w: "amazing", v: 0.84 }, { w: "awesome", v: 0.82 },
        { w: "fantastic", v: 0.83 }, { w: "wonderful", v: 0.81 },
        { w: "excellent", v: 0.83 }, { w: "outstanding", v: 0.85 },
        { w: "superb", v: 0.84 }, { w: "brilliant", v: 0.83 },
        { w: "excited", v: 0.79 }, { w: "great", v: 0.74 },
        { w: "happy", v: 0.72 }, { w: "glad", v: 0.68 },
        { w: "good", v: 0.63 }, { w: "motivated", v: 0.76 },
        { w: "proud", v: 0.73 }, { w: "grateful", v: 0.75 },
        { w: "hopeful", v: 0.67 }, { w: "enjoyed", v: 0.71 },
        { w: "enjoy", v: 0.69 }, { w: "better", v: 0.58 },
        { w: "okay", v: 0.47 }, { w: "fine", v: 0.45 },
        { w: "confident", v: 0.74 }, { w: "relieved", v: 0.66 },
        { w: "cheerful", v: 0.77 }, { w: "optimistic", v: 0.72 },
        { w: "content", v: 0.61 }, { w: "well", v: 0.43 },
        { w: "blessed", v: 0.78 }, { w: "love", v: 0.74 },
        { w: "joyful", v: 0.81 }, { w: "joy", v: 0.76 },
        { w: "peaceful", v: 0.71 }, { w: "calm", v: 0.59 },
        { w: "relaxed", v: 0.63 }, { w: "refreshed", v: 0.67 },
        { w: "energized", v: 0.76 }, { w: "inspired", v: 0.78 },
        { w: "encouraged", v: 0.73 }, { w: "empowered", v: 0.77 },
        { w: "determined", v: 0.72 }, { w: "focused", v: 0.67 },
        { w: "productive", v: 0.72 }, { w: "accomplished", v: 0.79 },
        { w: "achieved", v: 0.76 }, { w: "succeed", v: 0.77 },
        { w: "success", v: 0.78 }, { w: "winning", v: 0.79 },
        { w: "progress", v: 0.68 }, { w: "growth", v: 0.69 },
        { w: "improving", v: 0.67 }, { w: "supported", v: 0.69 },
        { w: "appreciated", v: 0.73 }, { w: "valued", v: 0.72 },
        { w: "comfortable", v: 0.62 }, { w: "satisfied", v: 0.68 },
        { w: "fulfilling", v: 0.74 }, { w: "meaningful", v: 0.72 },
        { w: "fun", v: 0.67 }, { w: "laugh", v: 0.66 },
        { w: "smile", v: 0.65 }, { w: "positive", v: 0.64 },
        { w: "nice", v: 0.58 },
        // Internet slang
        { w: "goated", v: 0.89 }, { w: "goat", v: 0.82 },
        { w: "slay", v: 0.83 }, { w: "slaying", v: 0.84 },
        { w: "ate that", v: 0.83 }, { w: "no cap", v: 0.71 },
        { w: "bussin", v: 0.83 }, { w: "fire", v: 0.79 },
        { w: "w team", v: 0.81 }, { w: "big w", v: 0.83 },
        { w: "poggers", v: 0.82 }, { w: "gg", v: 0.72 },
        { w: "lets go", v: 0.83 }, { w: "lezgo", v: 0.83 },
        { w: "lets gooo", v: 0.86 }, { w: "yesss", v: 0.81 },
        { w: "yasss", v: 0.83 }, { w: "yass", v: 0.81 },
        { w: "yay", v: 0.76 }, { w: "woohoo", v: 0.81 },
        { w: "hype", v: 0.78 }, { w: "iconic", v: 0.77 },
        { w: "legendary", v: 0.83 }, { w: "chef kiss", v: 0.86 },
        { w: "immaculate", v: 0.84 }, { w: "based", v: 0.72 },
        { w: "valid", v: 0.61 }, { w: "facts", v: 0.63 },
        { w: "lowkey good", v: 0.68 }, { w: "highkey good", v: 0.76 },
        // Typos
        { w: "hapy", v: 0.69 }, { w: "happpy", v: 0.71 },
        { w: "excitd", v: 0.76 }, { w: "excitted", v: 0.77 },
        { w: "awsome", v: 0.80 }, { w: "amzing", v: 0.81 },
        { w: "graet", v: 0.71 }, { w: "goood", v: 0.72 },
        { w: "guud", v: 0.61 }, { w: "luv", v: 0.71 },
        { w: "looove", v: 0.80 }, { w: "thankfull", v: 0.73 },
        { w: "gratefull", v: 0.73 }, { w: "blesed", v: 0.76 },
        // Filipino / Taglish phrases
        { w: "sobrang saya", v: 0.91 }, { w: "grabe ang saya", v: 0.89 },
        { w: "ang saya saya", v: 0.88 }, { w: "masayang masaya", v: 0.87 },
        { w: "ok naman", v: 0.49 }, { w: "okay naman", v: 0.49 },
        { w: "ayos naman", v: 0.54 }, { w: "okay lang", v: 0.46 },
        { w: "ok lang", v: 0.46 }, { w: "ayos lang", v: 0.51 },
        { w: "nag-eenjoy", v: 0.71 }, { w: "enjoy naman", v: 0.68 },
        { w: "enjoy ako", v: 0.72 }, { w: "nasisiyahan ako", v: 0.76 },
        { w: "masaya ako", v: 0.78 }, { w: "proud ako", v: 0.76 },
        { w: "galing ng team", v: 0.81 }, { w: "love ang team", v: 0.83 },
        { w: "ang galing", v: 0.78 }, { w: "ang saya", v: 0.76 },
        { w: "ang ganda", v: 0.74 }, { w: "bet na bet", v: 0.81 },
        { w: "bet ko", v: 0.74 }, { w: "kaya natin", v: 0.77 },
        { w: "kayang kaya", v: 0.79 }, { w: "kaya ko", v: 0.74 },
        { w: "todo suporta", v: 0.79 }, { w: "maraming salamat", v: 0.74 },
        { w: "oo naman", v: 0.56 },
        // Filipino single words
        { w: "masaya", v: 0.78 }, { w: "maganda", v: 0.72 },
        { w: "ayos", v: 0.54 }, { w: "nagagalak", v: 0.77 },
        { w: "excite", v: 0.76 }, { w: "thankful", v: 0.73 },
        { w: "okey", v: 0.47 }, { w: "galing", v: 0.74 },
        { w: "swabe", v: 0.63 }, { w: "saya", v: 0.71 },
        { w: "nasisiyahan", v: 0.74 }, { w: "bet", v: 0.67 },
        { w: "solid", v: 0.69 }, { w: "lodi", v: 0.72 },
        { w: "haha", v: 0.62 }, { w: "hahaha", v: 0.67 },
        { w: "hahahaha", v: 0.71 }, { w: "lol", v: 0.59 },
        { w: "hehe", v: 0.58 }, { w: "hihi", v: 0.59 },
        { w: "salamat", v: 0.67 }, { w: "mabuti", v: 0.61 },
        { w: "magaling", v: 0.72 }, { w: "husay", v: 0.74 },
        { w: "sulit", v: 0.68 }, { w: "kaya namin", v: 0.76 },
        { w: "tiwala", v: 0.69 }, { w: "sigla", v: 0.71 },
        { w: "sigasig", v: 0.74 },
      ];

      const negativeWords = [
        // Strong negative phrases
        { w: "extremely sad", v: 0.94 }, { w: "very sad", v: 0.87 },
        { w: "so stressed", v: 0.89 }, { w: "very stressed", v: 0.86 },
        { w: "super stressed", v: 0.89 }, { w: "sobrang stressed", v: 0.90 },
        { w: "so tired", v: 0.81 }, { w: "very tired", v: 0.83 },
        { w: "super tired", v: 0.84 }, { w: "sobrang pagod", v: 0.87 },
        { w: "so sad", v: 0.86 }, { w: "super sad", v: 0.88 },
        { w: "really sad", v: 0.85 }, { w: "really stressed", v: 0.84 },
        { w: "really tired", v: 0.80 }, { w: "really bad", v: 0.79 },
        { w: "so bad", v: 0.78 }, { w: "very bad", v: 0.81 },
        { w: "feeling bad", v: 0.74 }, { w: "feel bad", v: 0.72 },
        { w: "feeling down", v: 0.76 }, { w: "feeling low", v: 0.74 },
        { w: "feeling lost", v: 0.77 }, { w: "feeling empty", v: 0.79 },
        { w: "not okay", v: 0.78 }, { w: "not ok", v: 0.77 },
        { w: "not fine", v: 0.74 }, { w: "not good", v: 0.71 },
        { w: "not well", v: 0.72 }, { w: "not happy", v: 0.74 },
        { w: "hindi masaya", v: 0.81 }, { w: "di masaya", v: 0.81 },
        { w: "di okay", v: 0.76 }, { w: "di ok", v: 0.75 },
        { w: "cant do this", v: 0.86 }, { w: "cannot do this", v: 0.86 },
        { w: "give up", v: 0.87 }, { w: "giving up", v: 0.86 },
        { w: "want to quit", v: 0.88 }, { w: "want to give up", v: 0.89 },
        { w: "ayaw ko na", v: 0.88 }, { w: "hindi ko kaya", v: 0.85 },
        { w: "di ko kaya", v: 0.84 }, { w: "wala na ako", v: 0.83 },
        { w: "give up na", v: 0.87 }, { w: "surrender na", v: 0.85 },
        { w: "no motivation", v: 0.81 }, { w: "no energy", v: 0.78 },
        { w: "no hope", v: 0.86 }, { w: "losing hope", v: 0.84 },
        { w: "lost hope", v: 0.85 }, { w: "burnt out", v: 0.87 },
        { w: "burned out", v: 0.86 }, { w: "breaking down", v: 0.88 },
        { w: "falling apart", v: 0.87 }, { w: "worst day", v: 0.89 },
        { w: "bad day", v: 0.73 }, { w: "rough day", v: 0.71 },
        { w: "tough day", v: 0.69 }, { w: "bad vibes", v: 0.72 },
        { w: "low spirits", v: 0.76 }, { w: "at my limit", v: 0.84 },
        { w: "too much pressure", v: 0.86 }, { w: "so much pressure", v: 0.84 },
        { w: "not great", v: 0.68 }, { w: "di maayos", v: 0.74 },
        { w: "may problema", v: 0.67 }, { w: "malaking problema", v: 0.79 },
        { w: "walang motivation", v: 0.79 }, { w: "walang energy", v: 0.77 },
        { w: "walang gana", v: 0.76 }, { w: "wala nang gana", v: 0.79 },
        { w: "ayaw na", v: 0.82 }, { w: "suko na", v: 0.84 },
        { w: "give up na ako", v: 0.87 }, { w: "quit na", v: 0.83 },
        { w: "naiiyak na ako", v: 0.83 }, { w: "iyak na lang", v: 0.81 },
        { w: "umiyak ako", v: 0.79 }, { w: "malungkot ako", v: 0.78 },
        { w: "nalulungkot ako", v: 0.79 }, { w: "galit ako", v: 0.77 },
        { w: "naiinis ako", v: 0.74 }, { w: "stressed out ako", v: 0.84 },
        { w: "burn out na ako", v: 0.87 }, { w: "nag-aalala ako", v: 0.76 },
        { w: "nahihirapan ako", v: 0.78 }, { w: "hindi ko na kaya", v: 0.87 },
        { w: "di ko na kaya", v: 0.86 }, { w: "pagod na pagod", v: 0.86 },
        { w: "napapagod na ako", v: 0.82 }, { w: "wala na akong", v: 0.83 },
        { w: "sobrang lungkot", v: 0.91 }, { w: "grabe ang lungkot", v: 0.89 },
        { w: "sobrang hirap", v: 0.88 }, { w: "grabe ang hirap", v: 0.87 },
        { w: "grabe ang pagod", v: 0.85 }, { w: "gusto ko nang sumuko", v: 0.91 },
        { w: "hindi ko comfortable", v: 0.71 }, { w: "hindi motivated", v: 0.78 },
        { w: "di motivated", v: 0.78 }, { w: "nakakainis", v: 0.72 },
        { w: "nakakastress", v: 0.79 }, { w: "nakakaburnout", v: 0.84 },
        // English single words
        { w: "hopeless", v: 0.91 }, { w: "depressed", v: 0.92 },
        { w: "terrible", v: 0.88 }, { w: "hate", v: 0.84 },
        { w: "miserable", v: 0.87 }, { w: "overwhelmed", v: 0.83 },
        { w: "exhausted", v: 0.79 }, { w: "burnout", v: 0.86 },
        { w: "frustrated", v: 0.81 }, { w: "anxious", v: 0.78 },
        { w: "worried", v: 0.74 }, { w: "struggling", v: 0.77 },
        { w: "broken", v: 0.85 }, { w: "empty", v: 0.76 },
        { w: "lonely", v: 0.75 }, { w: "lost", v: 0.67 },
        { w: "scared", v: 0.73 }, { w: "afraid", v: 0.72 },
        { w: "stuck", v: 0.68 }, { w: "helpless", v: 0.82 },
        { w: "drained", v: 0.78 }, { w: "upset", v: 0.74 },
        { w: "disappointed", v: 0.73 }, { w: "uncomfortable", v: 0.64 },
        { w: "sad", v: 0.71 }, { w: "stressed", v: 0.76 },
        { w: "tired", v: 0.57 }, { w: "bad", v: 0.61 },
        { w: "angry", v: 0.79 }, { w: "lacking", v: 0.63 },
        { w: "problem", v: 0.59 }, { w: "difficult", v: 0.62 },
        { w: "hard", v: 0.54 }, { w: "pressure", v: 0.67 },
        { w: "pain", v: 0.76 }, { w: "hurt", v: 0.74 },
        { w: "fail", v: 0.72 }, { w: "failure", v: 0.78 },
        { w: "useless", v: 0.84 }, { w: "worthless", v: 0.87 },
        { w: "weak", v: 0.69 }, { w: "incompetent", v: 0.79 },
        { w: "behind", v: 0.62 }, { w: "delayed", v: 0.63 },
        { w: "regret", v: 0.74 }, { w: "mistake", v: 0.67 },
        { w: "wrong", v: 0.63 }, { w: "confused", v: 0.64 },
        { w: "uncertain", v: 0.61 }, { w: "doubt", v: 0.64 },
        { w: "insecure", v: 0.74 }, { w: "unappreciated", v: 0.79 },
        { w: "ignored", v: 0.74 }, { w: "excluded", v: 0.76 },
        { w: "isolated", v: 0.77 }, { w: "unmotivated", v: 0.76 },
        { w: "demotivated", v: 0.78 }, { w: "discouraged", v: 0.76 },
        { w: "unfair", v: 0.71 }, { w: "neglected", v: 0.74 },
        { w: "toxic", v: 0.82 }, { w: "tense", v: 0.67 },
        { w: "conflict", v: 0.72 }, { w: "argument", v: 0.73 },
        { w: "drama", v: 0.66 }, { w: "issue", v: 0.57 },
        { w: "worry", v: 0.71 }, { w: "fear", v: 0.73 },
        { w: "nervous", v: 0.69 }, { w: "panic", v: 0.81 },
        { w: "crisis", v: 0.82 }, { w: "breakdown", v: 0.87 },
        { w: "demoralized", v: 0.81 }, { w: "disengaged", v: 0.72 },
        { w: "undervalued", v: 0.76 }, { w: "hostile", v: 0.81 },
        // Internet slang negative
        { w: "l team", v: 0.79 }, { w: "big l", v: 0.81 },
        { w: "took an l", v: 0.78 }, { w: "dead inside", v: 0.86 },
        { w: "its over", v: 0.83 }, { w: "we're cooked", v: 0.82 },
        { w: "cooked", v: 0.74 }, { w: "mid", v: 0.63 },
        { w: "trash", v: 0.79 }, { w: "not it", v: 0.69 },
        { w: "fml", v: 0.84 }, { w: "ugh", v: 0.66 },
        { w: "ughhh", v: 0.71 }, { w: "oof", v: 0.63 },
        { w: "yikes", v: 0.68 }, { w: "smh", v: 0.67 },
        { w: "bruh", v: 0.58 }, { w: "bruhhh", v: 0.64 },
        // Typos
        { w: "sadd", v: 0.73 }, { w: "saddd", v: 0.76 },
        { w: "tierd", v: 0.55 }, { w: "stresed", v: 0.74 },
        { w: "stressedd", v: 0.78 }, { w: "anxous", v: 0.75 },
        { w: "overwelmed", v: 0.81 }, { w: "exausted", v: 0.77 },
        { w: "frustarted", v: 0.79 }, { w: "fustrated", v: 0.78 },
        { w: "deppressed", v: 0.90 }, { w: "depresed", v: 0.89 },
        { w: "hopeles", v: 0.89 }, { w: "lonley", v: 0.73 },
        { w: "dissapointed", v: 0.71 }, { w: "wurried", v: 0.72 },
        { w: "panik", v: 0.79 }, { w: "pannick", v: 0.80 },
        // Filipino single words
        { w: "malungkot", v: 0.78 }, { w: "lungkot", v: 0.74 },
        { w: "pagod", v: 0.67 }, { w: "napagod", v: 0.71 },
        { w: "naiinis", v: 0.74 }, { w: "galit", v: 0.79 },
        { w: "nalulungkot", v: 0.77 }, { w: "nag-aalala", v: 0.76 },
        { w: "nahihirapan", v: 0.78 }, { w: "hirap", v: 0.69 },
        { w: "praning", v: 0.71 }, { w: "balisa", v: 0.73 },
        { w: "takot", v: 0.72 }, { w: "masakit", v: 0.77 },
        { w: "sakit", v: 0.73 }, { w: "problema", v: 0.64 },
        { w: "nahihiya", v: 0.67 }, { w: "nakakalungkot", v: 0.76 },
        { w: "nakakasawa", v: 0.71 }, { w: "naiiyak", v: 0.78 },
        { w: "iyak", v: 0.73 }, { w: "umiyak", v: 0.76 },
        { w: "suko", v: 0.79 }, { w: "sumuko", v: 0.82 },
        { w: "sablay", v: 0.72 }, { w: "palpak", v: 0.74 },
        { w: "bagsak", v: 0.76 }, { w: "bigo", v: 0.76 },
        { w: "nabigo", v: 0.77 }, { w: "nagsisi", v: 0.72 },
        { w: "walang", v: 0.54 }, { w: "wala", v: 0.51 },
        { w: "sawa", v: 0.67 }, { w: "badtrip", v: 0.76 },
        { w: "bad trip", v: 0.75 }, { w: "hassle", v: 0.63 },
        { w: "tamad", v: 0.58 }, { w: "inggit", v: 0.64 },
      ];

      const getHits = (wordList) => {
        const matched = [];
        const sorted = [...wordList].sort((a, b) => b.w.length - a.w.length);
        let remaining = lowerText;
        for (const item of sorted) {
          if (remaining.includes(item.w)) {
            matched.push(item.v);
            remaining = remaining.replace(item.w, "");
          }
        }
        return matched;
      };

      const positiveHits = getHits(positiveWords);
      const negativeHits = getHits(negativeWords);

      const avgPositive = positiveHits.length > 0
        ? positiveHits.reduce((a, b) => a + b, 0) / positiveHits.length : 0;
      const avgNegative = negativeHits.length > 0
        ? negativeHits.reduce((a, b) => a + b, 0) / negativeHits.length : 0;

      const positiveStrength = avgPositive * Math.sqrt(positiveHits.length);
      const negativeStrength = avgNegative * Math.sqrt(negativeHits.length);

      let sentiment, score;

      if (positiveStrength > negativeStrength && positiveStrength > 0.3) {
        sentiment = "positive";
        const reduction = negativeHits.length > 0 ? negativeStrength * 0.25 : 0;
        score = parseFloat(Math.min(positiveStrength - reduction, 0.97).toFixed(2));
      } else if (negativeStrength > positiveStrength && negativeStrength > 0.3) {
        sentiment = "negative";
        const reduction = positiveHits.length > 0 ? positiveStrength * 0.25 : 0;
        score = parseFloat(-Math.min(negativeStrength - reduction, 0.97).toFixed(2));
      } else if (positiveStrength > 0 || negativeStrength > 0) {
        sentiment = "neutral";
        score = parseFloat(((positiveStrength - negativeStrength) * 0.3).toFixed(2));
      } else {
        sentiment = "neutral";
        score = 0;
      }

      const emotional_tone = sentiment === "positive" ? "motivated"
                           : sentiment === "negative" ? "frustrated"
                           : "content";

      return {
        sentiment,
        sentiment_score: score,
        emotional_tone,
        summary: "Analysis based on your text.",
        flag: sentiment === "negative" && Math.abs(score) > 0.65,
      };
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!mood) { setError("Please select a mood."); return; }
    if (!thoughts.trim()) { setError("Please share your thoughts."); return; }
    if (!teamId) { setError("No team selected."); return; }

    setLoading(true);

    const ai = await analyzeWithAI(thoughts);
    setAiResult(ai);

    const { data: userProfile } = await supabase
      .from("users")
      .select("anonymous_mode, full_name")
      .eq("id", user.id)
      .single();

    const { error: insertError } = await supabase
      .from("feedback")
      .insert({
        user_id: user.id,
        team_id: teamId,
        mood,
        message: thoughts.trim(),
        sentiment: ai.sentiment,
        sentiment_score: ai.sentiment_score,
        anonymous: userProfile?.anonymous_mode ?? false,
        display_name: userProfile?.anonymous_mode ? null : userProfile?.full_name,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  };

  if (submitted && aiResult) {
    const sentimentColor = aiResult.sentiment === "positive" ? "#3dba7e"
                         : aiResult.sentiment === "negative" ? "#e8692a"
                         : "#7a7f9a";

    return (
      <>
        <div className="page-header">
          <h2>Submit Feedback</h2>
        </div>
        <div className="card" style={{ maxWidth: 1000, textAlign: "center", padding: "40px 32px" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
          <h3 style={{ marginBottom: 4 }}>Feedback submitted!</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
            Thank you for sharing. Here's what our AI detected:
          </p>
          <div style={{
            background: sentimentColor + "12",
            border: `1px solid ${sentimentColor}44`,
            borderRadius: 12, padding: "16px 20px",
            textAlign: "left", marginBottom: 24
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: sentimentColor, textTransform: "capitalize" }}>
                {aiResult.sentiment} sentiment
              </span>
              <span style={{ fontSize: "13px", color: "#888" }}>
                Score: {aiResult.sentiment_score?.toFixed(2)}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#444", margin: "0 0 8px" }}>
              {aiResult.summary}
            </p>
            <span style={{
              fontSize: "11px", padding: "3px 10px", borderRadius: 999,
              background: sentimentColor + "22", color: sentimentColor, fontWeight: 600
            }}>
              {aiResult.emotional_tone?.replace(/_/g, " ")}
            </span>
            {aiResult.flag && (
              <div style={{
                marginTop: 10, padding: "8px 12px", borderRadius: 8,
                background: "#fff3cd", fontSize: "12px", color: "#856404"
              }}>
                ⚠️ This response has been flagged — someone may need support.
              </div>
            )}
          </div>
          <button className="btn btn-outline" onClick={() => {
            setSubmitted(false);
            setMood("");
            setThoughts("");
            setAiResult(null);
          }}>
            Submit Another
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>Submit Feedback</h2>
        <p>How are you feeling about the team right now?</p>
      </div>

      <div className="card" style={{ width: "100%" }}>
        {error && <p style={{ color: "red", fontSize: "14px", marginBottom: 12 }}>{error}</p>}

        {teams.length > 1 && (
          <div className="field">
            <label>Submit to Team</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: "14px" }}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>Select Mood</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 4, padding: "10px 14px", borderRadius: 12,
                  border: mood === m.value ? "2px solid #6c5ce7" : "1px solid #ddd",
                  background: mood === m.value ? "#6c5ce711" : "white",
                  cursor: "pointer", transition: "all 0.15s ease"
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>{m.emoji}</span>
                <span style={{ fontSize: "11px", color: "#666" }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Your Thoughts</label>
          <textarea
            placeholder="Share what's on your mind..."
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
            rows={4}
            style={{ resize: "vertical" }}
          />
          {thoughts.trim().length > 0 && (
            <div style={{ marginTop: 8, fontSize: "12px", color: "#888" }}>
              🤖 AI will analyze the emotional tone of your response
            </div>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || analyzing}
          style={{ width: "100%" }}
        >
          {analyzing ? "🤖 Analyzing with AI..." : loading ? "Saving..." : "Submit Feedback"}
        </button>
      </div>
    </>
  );
}