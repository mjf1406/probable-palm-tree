import { useEffect, useState } from "react";
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
  buildQuestionsSnapshot,
  parseShuffleMode,
  reshuffleForRepetition,
  type GameType,
  type ShuffleMode,
} from "@/lib/game";
import type { GameRecord, QuestionSnapshot } from "@/lib/types";
import { resetGameForRematch } from "@/lib/useHostGameEngine";

type DeckOption = {
  id: string;
  title: string;
  questions: {
    text: string;
    options: unknown;
    correctIndex: number;
    order: number;
    questionType?: unknown;
  }[];
  answerShuffleMode?: ShuffleMode | string | null;
  questionShuffleMode?: ShuffleMode | string | null;
};

type GameSetupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "rematch";
  decks: DeckOption[];
  initialDeckId?: string | null;
  initialGameType?: GameType;
  initialQuestionTime?: number;
  rematchGame?: GameRecord | null;
  answerIds?: string[];
};

function buildLaunchSnapshot(
  questions: {
    text: string;
    options: unknown;
    correctIndex: number;
    order: number;
    questionType?: unknown;
  }[],
  answerShuffleMode: ShuffleMode,
  questionShuffleMode: ShuffleMode,
): QuestionSnapshot[] {
  return buildQuestionsSnapshot(questions, {
    answerShuffleMode,
    questionShuffleMode,
  });
}

export function GameSetupDialog({
  open,
  onOpenChange,
  decks,
  initialDeckId,
  initialGameType = "submarine",
  initialQuestionTime = DEFAULT_QUESTION_TIME,
  rematchGame,
  answerIds = [],
}: GameSetupDialogProps) {
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
  const answerShuffleMode = parseShuffleMode(selectedDeck?.answerShuffleMode);
  const questionShuffleMode = parseShuffleMode(
    selectedDeck?.questionShuffleMode,
  );
  const selectedGame = GAME_TYPES.find((type) => type.id === gameType);
  const hasQuestions = (selectedDeck?.questions.length ?? 0) > 0;

  const handleSubmit = async () => {
    if (!user || !rematchGame || !selectedDeck || !hasQuestions) return;

    setIsSubmitting(true);
    try {
      const sameDeck = rematchGame.deckId === selectedDeck.id;
      let questionsSnapshot: QuestionSnapshot[];

      if (sameDeck) {
        // Keep existing snapshot order for modes that are not eachRepetition.
        questionsSnapshot = reshuffleForRepetition(
          rematchGame.questionsSnapshot,
          { answerShuffleMode, questionShuffleMode },
        );
      } else {
        // New deck: shuffle now for once / eachRepetition.
        questionsSnapshot = buildLaunchSnapshot(
          selectedDeck.questions,
          answerShuffleMode,
          questionShuffleMode,
        );
      }

      await resetGameForRematch({
        gameId: rematchGame.id,
        answerIds,
        gameType,
        questionsSnapshot,
        questionTimeSeconds: Number(questionTime) || DEFAULT_QUESTION_TIME,
        deckTitle: selectedDeck.title,
        deckId: selectedDeck.id,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Play again</DialogTitle>
          <DialogDescription>
            Pick a deck for the next round. Everyone stays in the lobby.
          </DialogDescription>
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
            disabled={isSubmitting || !hasQuestions}
          >
            {isSubmitting ? "Saving..." : "Reset to lobby"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Authored deck → snapshot without shuffling (for listing / rematch deck options). */
export function toSnapshot(
  questions: {
    text: string;
    options: unknown;
    correctIndex: number;
    order: number;
    questionType?: unknown;
  }[],
): QuestionSnapshot[] {
  return buildQuestionsSnapshot(
    questions,
    { answerShuffleMode: "none", questionShuffleMode: "none" },
    { shuffleAnswers: false, shuffleQuestions: false },
  );
}
