import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Rocket, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/db";
import {
  DEFAULT_QUESTION_TIME,
  GAME_TYPES,
  generateJoinCode,
  type GameType,
} from "@/lib/game";
import type { GameRecord } from "@/lib/types";
import type { QuestionSnapshot } from "@/lib/types";
import { launchGame, resetGameForRematch } from "@/lib/useHostGameEngine";

type DeckOption = {
  id: string;
  title: string;
  questions: QuestionSnapshot[];
};

type GameSetupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "launch" | "rematch";
  decks: DeckOption[];
  initialDeckId?: string | null;
  initialGameType?: GameType;
  initialQuestionTime?: number;
  rematchGame?: GameRecord | null;
  answerIds?: string[];
};

function toSnapshot(
  questions: { text: string; options: unknown; correctIndex: number; order: number }[],
): QuestionSnapshot[] {
  return [...questions]
    .sort((a, b) => a.order - b.order)
    .map((question) => ({
      text: question.text,
      options: Array.isArray(question.options)
        ? (question.options as string[])
        : [],
      correctIndex: question.correctIndex,
    }));
}

export function GameSetupDialog({
  open,
  onOpenChange,
  mode,
  decks,
  initialDeckId,
  initialGameType = "submarine",
  initialQuestionTime = DEFAULT_QUESTION_TIME,
  rematchGame,
  answerIds = [],
}: GameSetupDialogProps) {
  const navigate = useNavigate();
  const { user } = db.useAuth();
  const [deckId, setDeckId] = useState(initialDeckId ?? decks[0]?.id ?? "");
  const [gameType, setGameType] = useState<GameType>(initialGameType);
  const [questionTime, setQuestionTime] = useState(String(initialQuestionTime));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDeckId(initialDeckId ?? decks[0]?.id ?? "");
    setGameType(initialGameType);
    setQuestionTime(String(initialQuestionTime));
  }, [open, initialDeckId, decks, initialGameType, initialQuestionTime]);

  const selectedDeck = decks.find((deck) => deck.id === deckId);
  const questions = selectedDeck?.questions ?? [];
  const selectedGame = GAME_TYPES.find((type) => type.id === gameType);

  const handleSubmit = async () => {
    if (!user || questions.length === 0) return;

    setIsSubmitting(true);
    try {
      if (mode === "launch") {
        const code = generateJoinCode();
        await launchGame({
          hostId: user.id,
          code,
          gameType,
          questionsSnapshot: questions,
          questionTimeSeconds: Number(questionTime) || DEFAULT_QUESTION_TIME,
          deckTitle: selectedDeck?.title,
          deckId: selectedDeck?.id,
        });
        onOpenChange(false);
        await navigate({ to: "/g/$code", params: { code } });
        return;
      }

      if (!rematchGame) return;

      await resetGameForRematch({
        gameId: rematchGame.id,
        answerIds,
        gameType,
        questionsSnapshot: questions,
        questionTimeSeconds: Number(questionTime) || DEFAULT_QUESTION_TIME,
        deckTitle: selectedDeck?.title,
        deckId: selectedDeck?.id,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === "launch" ? "Launch game" : "Play again";
  const description =
    mode === "launch"
      ? "Choose a deck and settings to start a new game."
      : "Pick a deck for the next round. Everyone stays in the lobby.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Deck</Label>
            <Select value={deckId} onValueChange={setDeckId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a deck" />
              </SelectTrigger>
              <SelectContent>
                {decks.map((deck) => (
                  <SelectItem key={deck.id} value={deck.id}>
                    {deck.title} ({deck.questions.length} questions)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Game type</Label>
            <Select
              value={gameType}
              onValueChange={(value) => setGameType(value as GameType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GAME_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <span className="flex items-center gap-2">
                      {type.id === "submarine" ? (
                        <Ship className="size-4" />
                      ) : (
                        <Rocket className="size-4" />
                      )}
                      {type.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedGame ? (
              <p className="text-xs text-muted-foreground">
                {selectedGame.description}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-time">Seconds per question</Label>
            <Input
              id="question-time"
              type="number"
              min={10}
              max={60}
              value={questionTime}
              onChange={(event) => setQuestionTime(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || questions.length === 0}
          >
            {isSubmitting
              ? "Saving..."
              : mode === "launch"
                ? "Launch game"
                : "Reset to lobby"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { toSnapshot };
