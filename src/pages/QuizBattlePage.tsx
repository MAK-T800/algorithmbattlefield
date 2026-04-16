import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Users, Trophy, Zap, ArrowLeft, Copy, Check, X,
  SkipForward, StopCircle, Play, Flame, Star, Crown, Medal,
} from "lucide-react";
import { useQuizRoom } from "@/hooks/useQuizRoom";
import { getTopicByIdOrDefault, type MCQQuestion } from "@/lib/mcqQuestions";
import { getSessionId, getUsername } from "@/lib/session";
import { useToast } from "@/hooks/use-toast";

const QUESTION_TIME_LIMIT = 120; // 2 min

const rankBadge = (rank: number) => {
  if (rank === 1) return { label: "Diamond", color: "text-neon-cyan", icon: Crown, bg: "bg-neon-cyan/10" };
  if (rank === 2) return { label: "Gold", color: "text-neon-orange", icon: Star, bg: "bg-neon-orange/10" };
  if (rank === 3) return { label: "Silver", color: "text-muted-foreground", icon: Medal, bg: "bg-muted/30" };
  return { label: "Bronze", color: "text-neon-orange/60", icon: Medal, bg: "bg-muted/20" };
};

export default function QuizBattlePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    room, participants, myParticipant, answers, reactions,
    loading, error, startQuiz, nextQuestion, endQuiz, submitAnswer, sendReaction, leaveRoom,
  } = useQuizRoom(roomCode || null);

  const sessionId = getSessionId();
  const userName = getUsername() || "Anonymous";
  const topic = useMemo(() => getTopicByIdOrDefault(room?.topic || "dsa"), [room?.topic]);
  const currentQ: MCQQuestion | null = topic.questions[room?.current_question_index ?? 0] || null;
  const totalQuestions = topic.questions.length;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [showReveal, setShowReveal] = useState(false);

  const isHost = myParticipant?.is_host || false;
  const questionIndex = room?.current_question_index ?? 0;

  // Reset state on question change
  useEffect(() => {
    setSelectedOption(null);
    setSubmitted(false);
    setShowReveal(false);
    setTimeLeft(QUESTION_TIME_LIMIT);
  }, [questionIndex]);

  // Check if already answered
  useEffect(() => {
    if (!myParticipant) return;
    const existing = answers.find(
      (a) => a.participant_id === myParticipant.id && a.question_index === questionIndex
    );
    if (existing) {
      setSubmitted(true);
      setSelectedOption(existing.selected_option);
    }
  }, [answers, myParticipant, questionIndex]);

  // Timer
  useEffect(() => {
    if (!room?.quiz_started || room?.status !== "active" || !room?.question_started_at) return;
    const startedAt = new Date(room.question_started_at).getTime();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, QUESTION_TIME_LIMIT - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
        setShowReveal(true);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [room?.quiz_started, room?.status, room?.question_started_at]);

  // Compute leaderboard
  const leaderboard = useMemo(() => {
    return [...participants].sort((a, b) => b.score - a.score);
  }, [participants]);

  // Heatmap: count answers per option for current question
  const optionCounts = useMemo(() => {
    const counts = [0, 0, 0, 0];
    answers
      .filter((a) => a.question_index === questionIndex)
      .forEach((a) => {
        if (a.selected_option >= 0 && a.selected_option < 4) counts[a.selected_option]++;
      });
    return counts;
  }, [answers, questionIndex]);

  const totalAnswered = optionCounts.reduce((s, c) => s + c, 0);

  // Fastest correct answer
  const fastestCorrect = useMemo(() => {
    const correctAnswers = answers
      .filter((a) => a.question_index === questionIndex && a.is_correct)
      .sort((a, b) => a.time_taken_ms - b.time_taken_ms);
    if (correctAnswers.length === 0) return null;
    const p = participants.find((p) => p.id === correctAnswers[0].participant_id);
    return p?.user_name || null;
  }, [answers, participants, questionIndex]);

  const handleSubmit = async () => {
    if (selectedOption === null || !currentQ || submitted) return;
    const isCorrect = selectedOption === currentQ.correctIndex;
    const timeTaken = (QUESTION_TIME_LIMIT - timeLeft) * 1000;
    setSubmitted(true);
    await submitAnswer(questionIndex, selectedOption, isCorrect, timeTaken);
  };

  const handleLeave = async () => {
    await leaveRoom();
    navigate("/");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode || "");
    toast({ title: "Copied!", description: `Room code ${roomCode}` });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Zap className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative z-10 gap-4">
        <p className="text-destructive text-lg">{error || "Room not found"}</p>
        <button onClick={() => navigate("/")} className="glass-panel px-5 py-2 text-primary">Back</button>
      </div>
    );
  }

  // WAITING LOBBY
  if (!room.quiz_started || room.status === "waiting") {
    return (
      <div className="min-h-screen pt-20 px-4 pb-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel-strong p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl">{topic.icon}</span>
              <h2 className="text-2xl font-display font-bold text-foreground">{topic.label}</h2>
            </div>
            <p className="text-muted-foreground mb-6">{totalQuestions} questions · 2 min each</p>

            <div className="glass-panel p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-1">Room Code</p>
              <button onClick={copyCode} className="flex items-center gap-2 mx-auto text-2xl font-mono font-bold text-primary tracking-[0.3em] hover:text-neon-cyan transition-colors">
                {roomCode}
                <Copy className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 justify-center mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{participants.length} joined</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <AnimatePresence>
                  {participants.map((p) => (
                    <motion.span
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        p.is_host ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted/50 text-foreground"
                      }`}
                    >
                      {p.is_host && <Crown className="w-3 h-3 inline mr-1" />}
                      {p.user_name}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {isHost ? (
              <button
                onClick={startQuiz}
                className="px-8 py-3 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-all font-display font-bold text-lg neon-glow-blue flex items-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5" /> Start Quiz
              </button>
            ) : (
              <p className="text-muted-foreground animate-pulse">Waiting for host to start...</p>
            )}

            <button onClick={handleLeave} className="mt-4 text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 mx-auto">
              <ArrowLeft className="w-3 h-3" /> Leave Room
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // FINISHED
  if (room.status === "finished") {
    return (
      <div className="min-h-screen pt-20 px-4 pb-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel-strong p-8">
            <h2 className="text-2xl font-display font-bold text-center text-foreground mb-6">
              🏆 Quiz Complete!
            </h2>
            <div className="space-y-3">
              {leaderboard.map((p, i) => {
                const badge = rankBadge(i + 1);
                const correctCount = answers.filter((a) => a.participant_id === p.id && a.is_correct).length;
                const tag = correctCount >= totalQuestions * 0.9 ? "Excellent" : correctCount >= totalQuestions * 0.7 ? "Great" : correctCount >= totalQuestions * 0.5 ? "Good" : "Needs Improvement";
                const isMe = p.session_id === sessionId;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-xl ${badge.bg} ${isMe ? "border border-primary/30" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-display font-bold ${badge.color}`}>#{i + 1}</span>
                      <badge.icon className={`w-5 h-5 ${badge.color}`} />
                      <div>
                        <span className="font-semibold text-foreground">{p.user_name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{badge.label}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-primary">{p.score}</span>
                      <span className="text-xs text-muted-foreground ml-2">{correctCount}/{totalQuestions}</span>
                      <span className={`block text-xs mt-0.5 ${tag === "Excellent" ? "text-neon-cyan" : tag === "Great" ? "text-primary" : tag === "Good" ? "text-neon-orange" : "text-destructive"}`}>
                        {tag}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <button onClick={() => navigate("/")} className="mt-6 w-full py-3 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 transition-colors font-semibold">
              Back to Rooms
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ACTIVE QUIZ
  const progress = ((questionIndex + 1) / totalQuestions) * 100;
  const timerColor = timeLeft > 60 ? "text-neon-cyan" : timeLeft > 30 ? "text-neon-orange" : "text-destructive";
  const timerWidth = (timeLeft / QUESTION_TIME_LIMIT) * 100;

  return (
    <div className="min-h-screen pt-20 px-2 pb-4 relative z-10">
      {/* Floating reactions */}
      <AnimatePresence>
        {reactions.slice(-10).map((r, i) => (
          <motion.span
            key={`${i}-${r.emoji}`}
            initial={{ opacity: 1, y: 0, x: Math.random() * 200 + 100 }}
            animate={{ opacity: 0, y: -200 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed bottom-20 text-3xl pointer-events-none z-50"
          >
            {r.emoji}
          </motion.span>
        ))}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-6rem)]">
        {/* Main Question Area */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Top Bar */}
          <div className="glass-panel p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{topic.icon}</span>
              <span className="text-sm font-semibold text-foreground">{topic.label}</span>
              <span className="text-xs text-muted-foreground">Q{questionIndex + 1}/{totalQuestions}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={copyCode} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Copy className="w-3 h-3" /> {roomCode}
              </button>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{participants.length}</span>
              </div>
            </div>
          </div>

          {/* Timer Bar */}
          <div className="glass-panel p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${timerColor}`} />
                <span className={`font-mono font-bold text-lg ${timerColor}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </span>
              </div>
              {currentQ && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  currentQ.type === "output" ? "bg-secondary/20 text-secondary" :
                  currentQ.type === "complexity" ? "bg-neon-orange/20 text-neon-orange" :
                  currentQ.type === "scenario" ? "bg-neon-cyan/20 text-neon-cyan" :
                  "bg-primary/20 text-primary"
                }`}>
                  {currentQ.type}
                </span>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${timeLeft > 60 ? "bg-neon-cyan" : timeLeft > 30 ? "bg-neon-orange" : "bg-destructive"}`}
                animate={{ width: `${timerWidth}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="glass-panel-strong p-6 flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={questionIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex-1 flex flex-col"
              >
                <h3 className="text-xl font-display font-bold text-foreground mb-8 leading-relaxed">
                  {currentQ?.question}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                  {currentQ?.options.map((opt, i) => {
                    const isSelected = selectedOption === i;
                    const isCorrect = currentQ.correctIndex === i;
                    const showResult = submitted || showReveal;
                    let optionClass = "glass-panel p-4 cursor-pointer transition-all duration-300 hover:border-primary/40 text-left";

                    if (showResult) {
                      if (isCorrect) optionClass = "glass-panel p-4 border-2 border-neon-cyan/60 bg-neon-cyan/10 text-left";
                      else if (isSelected && !isCorrect) optionClass = "glass-panel p-4 border-2 border-destructive/60 bg-destructive/10 text-left";
                      else optionClass = "glass-panel p-4 opacity-50 text-left";
                    } else if (isSelected) {
                      optionClass = "glass-panel p-4 border-2 border-primary/60 bg-primary/10 text-left neon-glow-blue";
                    }

                    return (
                      <motion.button
                        key={i}
                        whileHover={!showResult ? { scale: 1.02 } : {}}
                        whileTap={!showResult ? { scale: 0.98 } : {}}
                        onClick={() => !submitted && !showReveal && setSelectedOption(i)}
                        disabled={submitted || showReveal}
                        className={optionClass}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                            showResult && isCorrect ? "bg-neon-cyan/20 text-neon-cyan" :
                            showResult && isSelected && !isCorrect ? "bg-destructive/20 text-destructive" :
                            isSelected ? "bg-primary/20 text-primary" :
                            "bg-muted/50 text-muted-foreground"
                          }`}>
                            {showResult ? (isCorrect ? <Check className="w-4 h-4" /> : isSelected ? <X className="w-4 h-4" /> : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-foreground text-sm leading-relaxed">{opt}</span>
                        </div>
                        {/* Heatmap bar */}
                        {showResult && totalAnswered > 0 && (
                          <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(optionCounts[i] / totalAnswered) * 100}%` }}
                              className={`h-full rounded-full ${isCorrect ? "bg-neon-cyan" : "bg-muted-foreground/40"}`}
                            />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Submit / Status */}
                <div className="mt-6 flex items-center justify-between">
                  {!submitted && !showReveal ? (
                    <button
                      onClick={handleSubmit}
                      disabled={selectedOption === null}
                      className="px-8 py-3 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-all font-semibold disabled:opacity-30"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {submitted && selectedOption === currentQ?.correctIndex ? (
                        <span className="text-neon-cyan font-semibold flex items-center gap-1"><Check className="w-4 h-4" /> Correct!</span>
                      ) : submitted ? (
                        <span className="text-destructive font-semibold flex items-center gap-1"><X className="w-4 h-4" /> Wrong</span>
                      ) : (
                        <span className="text-muted-foreground">Time's up!</span>
                      )}
                      {fastestCorrect && (
                        <span className="text-xs text-neon-orange ml-3 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Fastest: {fastestCorrect}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="flex items-center gap-1">
                    {["🔥", "👏", "😮", "💡"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => sendReaction(emoji, userName)}
                        className="text-xl hover:scale-125 transition-transform p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress */}
          <div className="glass-panel p-2">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Teacher controls */}
          {isHost && (
            <div className="glass-panel p-3 flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Teacher</span>
              <button onClick={nextQuestion} disabled={questionIndex >= totalQuestions - 1} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors text-sm font-semibold disabled:opacity-30">
                <SkipForward className="w-3.5 h-3.5" /> Next
              </button>
              <button onClick={endQuiz} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors text-sm font-semibold">
                <StopCircle className="w-3.5 h-3.5" /> End Quiz
              </button>
              <span className="text-xs text-muted-foreground ml-auto">
                {totalAnswered}/{participants.length} answered
              </span>
            </div>
          )}
        </div>

        {/* Right: Leaderboard */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="glass-panel-strong p-4 flex-1 overflow-y-auto scrollbar-hide">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-neon-orange" />
              <span className="font-display font-bold text-foreground">Leaderboard</span>
            </div>

            {/* Top 3 podium */}
            {leaderboard.length >= 3 && (
              <div className="flex items-end justify-center gap-2 mb-6 h-32">
                {[1, 0, 2].map((idx) => {
                  const p = leaderboard[idx];
                  if (!p) return null;
                  const badge = rankBadge(idx + 1);
                  const height = idx === 0 ? "h-28" : idx === 1 ? "h-20" : "h-16";
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ delay: idx * 0.2 }}
                      className={`flex flex-col items-center ${idx === 0 ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}
                    >
                      <span className="text-xs font-semibold text-foreground mb-1 truncate max-w-[80px]">{p.user_name}</span>
                      <span className={`text-xs font-mono font-bold ${badge.color}`}>{p.score}</span>
                      <div className={`w-16 ${height} rounded-t-lg ${badge.bg} flex items-center justify-center mt-1`}>
                        <badge.icon className={`w-5 h-5 ${badge.color}`} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            <div className="space-y-1.5">
              {leaderboard.map((p, i) => {
                const badge = rankBadge(i + 1);
                const isMe = p.session_id === sessionId;
                const correctCount = answers.filter((a) => a.participant_id === p.id && a.is_correct).length;
                return (
                  <motion.div
                    key={p.id}
                    layout
                    className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                      isMe ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold w-6 ${badge.color}`}>#{i + 1}</span>
                      <span className="text-sm text-foreground truncate max-w-[120px]">{p.user_name}</span>
                      {p.is_host && <Crown className="w-3 h-3 text-neon-orange" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{correctCount}✓</span>
                      <span className="text-sm font-mono font-bold text-primary">{p.score}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Participants */}
          <div className="glass-panel p-4 max-h-48 overflow-y-auto scrollbar-hide">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Participants ({participants.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {participants.map((p) => {
                const hasAnswered = answers.some((a) => a.participant_id === p.id && a.question_index === questionIndex);
                return (
                  <span
                    key={p.id}
                    className={`px-2 py-1 rounded-md text-xs ${hasAnswered ? "bg-neon-cyan/10 text-neon-cyan" : "bg-muted/30 text-muted-foreground"}`}
                  >
                    {p.user_name} {hasAnswered && "✓"}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
